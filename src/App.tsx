import { useCallback, useState, useEffect, useRef, useMemo } from 'react';

import ErrorDisplay from '@/components/ErrorDisplay';
import FilterPanel from '@/components/FilterPanel';
import LoadingOverlay from '@/components/LoadingOverlay';
import { MapContainer } from '@/components/MapContainer';
import MapLoadingError from '@/components/MapLoadingError';
import MapMarkers from '@/components/MapMarkers';
import POIDetails from '@/components/POIDetails';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { usePOIData } from '@/hooks/usePOIData';
import type { PointOfInterest } from '@/types/poi';
import { validateEnv } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';

// 環境バリデーション用のフック
const useEnvValidation = () => {
  const [envError, setEnvError] = useState<string | null>(null);
  const initDoneRef = useRef(false); // 初期化済みフラグ

  useEffect(() => {
    // 既に初期化済みなら処理をスキップ
    if (initDoneRef.current) return;

    logger.info('アプリケーション初期化開始', {
      component: 'App',
      action: 'initialize',
    });

    try {
      const isValid = logger.measureTime('環境変数検証', () => validateEnv(), LogLevel.INFO, {
        component: 'App',
        action: 'validateEnv',
      });

      if (!isValid) {
        const missingVars = [
          'VITE_GOOGLE_API_KEY',
          'VITE_GOOGLE_SPREADSHEET_ID',
          'VITE_GOOGLE_MAPS_MAP_ID',
        ].filter(key => !import.meta.env[key as keyof ImportMetaEnv]);

        const errorMsg = `必要な環境変数が設定されていません: ${missingVars.join(', ')}。管理者に連絡してください。`;
        logger.error(errorMsg, {
          component: 'App',
          missingVars,
          severity: 'critical',
        });
        setEnvError(errorMsg);
      } else {
        logger.info('環境変数検証成功', {
          component: 'App',
          status: 'success',
        });
      }
    } catch (error) {
      const errorMsg = '環境変数の検証中にエラーが発生しました';
      logger.error(errorMsg, error instanceof Error ? error : new Error(String(error)));
      setEnvError(errorMsg);
    }

    // 初期化完了をマーク
    initDoneRef.current = true;

    return () => {
      logger.info('アプリケーションクリーンアップ', {
        component: 'App',
        action: 'cleanup',
      });
    };
  }, []);

  return envError;
};

// POI データとフィルタリングを管理するフック
const usePOIManagement = (envError: string | null) => {
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);
  const [filteredPOIs, setFilteredPOIs] = useState<PointOfInterest[]>([]);

  // POIデータの取得 (環境変数エラーがない場合のみ有効化)
  const {
    pois,
    isLoading: isLoadingPOIs,
    error: poisError,
  } = usePOIData({
    enabled: !envError,
  });

  // フィルタリング初期化 - POIデータ取得時に実行
  useEffect(() => {
    if (pois.length > 0) {
      // 初期データ読み込み時の処理をパフォーマンス測定
      logger.measureTime(
        'POIデータの初期化処理',
        () => {
          logger.debug('初期POIフィルター設定', {
            component: 'App',
            action: 'initializeFilter',
            count: pois.length,
            categories: Array.from(new Set(pois.map(poi => poi.category))),
          });
          setFilteredPOIs(pois);
        },
        LogLevel.DEBUG,
        { component: 'App' },
        100 // 100ms以上かかった場合のみログ出力
      );
    }
  }, [pois]);

  // POI詳細表示 - メモ化によるパフォーマンス最適化
  const handlePOISelect = useCallback((poi: PointOfInterest) => {
    logger.info('POI選択', {
      component: 'App',
      action: 'selectPOI',
      id: poi.id,
      name: poi.name,
      category: poi.category,
    });

    setSelectedPOI(poi);
  }, []);

  // POI詳細を閉じる - メモ化
  const handleClosePOIDetails = useCallback(() => {
    logger.debug('POI詳細を閉じました', {
      component: 'App',
      action: 'closePOIDetails',
    });
    setSelectedPOI(null);
  }, []);

  // フィルタリングされたPOIの更新 - パフォーマンス測定とメモ化
  const handleFilterChange = useCallback(
    (filtered: PointOfInterest[]) => {
      const poisLength = pois.length || 1; // 0除算防止
      const reductionPercentage = Math.round((1 - filtered.length / poisLength) * 100);

      logger.measureTime(
        'フィルター適用',
        () => {
          logger.debug('POIフィルター適用', {
            component: 'App',
            action: 'applyFilter',
            before: filteredPOIs.length,
            after: filtered.length,
            reduction: `${reductionPercentage}%`,
            remainingCategories: Array.from(new Set(filtered.map(poi => poi.category))),
          });

          setFilteredPOIs(filtered);
        },
        LogLevel.DEBUG,
        { component: 'App' },
        50 // 50ms以上かかった場合のみログ出力
      );
    },
    [filteredPOIs.length, pois.length]
  );

  return {
    pois,
    filteredPOIs,
    selectedPOI,
    isLoadingPOIs,
    poisError,
    handlePOISelect,
    handleClosePOIDetails,
    handleFilterChange,
  };
};

// マップ関連の機能を管理するフック
const useMapManagement = (onMapLoaded: (map: google.maps.Map) => void) => {
  const [isMapElementReady, setIsMapElementReady] = useState(false);

  // マップ要素がDOMに追加された時のコールバック
  const handleMapElementReady = useCallback(() => {
    logger.debug('マップDOM要素が準備完了', {
      component: 'App',
      action: 'mapElementReady',
    });

    // 状態更新を確実に行う
    setTimeout(() => {
      setIsMapElementReady(true);
      logger.info('マップDOM要素の状態を更新しました', {
        component: 'App',
        action: 'updateMapElementState',
      });
    }, 0);
  }, []);

  // Google Mapsフック
  const { isLoaded, error } = useGoogleMaps({
    elementId: 'map',
    zoom: 11,
    onMapLoaded,
    skipInit: !isMapElementReady,
    initTimeout: 15000, // 15秒のタイムアウト
  });

  return { isMapElementReady, isLoaded, error, handleMapElementReady };
};

// UI状態管理フック
const useUIState = (
  isLoaded: boolean,
  filteredPOIs: PointOfInterest[],
  isAppLoading: boolean,
  displayError: string | null,
  mapRef: React.RefObject<google.maps.Map | null>,
  pois: PointOfInterest[]
) => {
  // 条件判定のメモ化
  const shouldShowFilters = useMemo(() => {
    return isLoaded && !displayError;
  }, [isLoaded, displayError]);

  // マップマーカー表示の条件判定
  const shouldShowMarkers = useMemo(
    () => isLoaded && !displayError && filteredPOIs.length > 0,
    [isLoaded, displayError, filteredPOIs.length]
  );

  // マップが実際に利用可能かどうかを確認
  const isMapAvailable = useMemo(() => {
    const available = shouldShowMarkers && mapRef.current !== null;
    if (!available && shouldShowMarkers) {
      logger.warn('マップは表示されていますが、マップインスタンスが利用できません', {
        component: 'App',
        action: 'mapCheck',
        status: 'unavailable',
      });
    }
    return available;
  }, [shouldShowMarkers, mapRef]);

  // アプリの表示状態を計測しログに記録
  useEffect(() => {
    if (isMapAvailable && filteredPOIs.length > 0 && !isAppLoading) {
      const poisLength = pois.length || 1; // 0除算防止

      logger.info('アプリケーション表示準備完了', {
        component: 'App',
        action: 'uiReady',
        poisCount: filteredPOIs.length,
        filteredPercentage: Math.round((filteredPOIs.length / poisLength) * 100),
        mapZoom: mapRef.current?.getZoom(),
      });
    }
  }, [isMapAvailable, filteredPOIs.length, isAppLoading, pois.length, mapRef]);

  return {
    shouldShowFilters,
    isMapAvailable,
  };
};

/**
 * エラー表示コンポーネントを選択する関数
 */
const selectErrorComponent = (
  displayError: string | null,
  mapError: string | null,
  retryCount: number,
  handleRetryMapLoad: () => void
) => {
  if (!displayError) return null;

  // 地図読み込みエラーの特別処理
  if (mapError) {
    logger.debug('地図読み込みエラーのため専用エラー表示を使用', {
      component: 'App',
      action: 'selectError',
      error: mapError,
      errorType: 'mapError',
      retryCount,
    });
    return <MapLoadingError error={displayError} onRetry={handleRetryMapLoad} />;
  }

  // その他のエラー
  logger.debug('一般エラー表示を使用', {
    component: 'App',
    action: 'selectError',
    errorType: 'generalError',
  });
  return <ErrorDisplay message={displayError} />;
};

/**
 * メインアプリケーションコンポーネント
 * 地図の表示とPOIデータの管理を行います
 */
function App() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // マップ読み込み完了時のコールバック
  const handleMapLoaded = useCallback((map: google.maps.Map) => {
    logger.info('Google Maps APIの読み込みが完了しました', {
      component: 'App',
      action: 'mapLoaded',
      center: map.getCenter()?.toJSON(),
      zoom: map.getZoom(),
      apiVersion: google.maps.version, // APIバージョンを記録
    });

    mapRef.current = map;
  }, []);

  // 地図読み込み再試行ハンドラ
  const handleRetryMapLoad = useCallback(() => {
    logger.info('地図読み込みの再試行を実行', {
      component: 'App',
      action: 'retryMap',
      retryCount: retryCount + 1,
    });
    setRetryCount(prev => prev + 1);
  }, [retryCount]);

  // 環境変数のバリデーション
  const envError = useEnvValidation();

  // マップ管理
  const {
    isMapElementReady,
    isLoaded,
    error: mapError,
    handleMapElementReady,
  } = useMapManagement(handleMapLoaded);

  // POI管理
  const {
    pois,
    filteredPOIs,
    selectedPOI,
    isLoadingPOIs,
    poisError,
    handlePOISelect,
    handleClosePOIDetails,
    handleFilterChange,
  } = usePOIManagement(envError);

  // 表示すべきエラーの決定（環境変数エラーを優先）
  const displayError = useMemo(() => {
    const currentError = envError ?? mapError ?? poisError;
    if (currentError) {
      logger.warn('アプリケーションエラーが発生しています', {
        component: 'App',
        action: 'errorDetection',
        errorType: envError ? 'environment' : mapError ? 'map' : 'data',
        errorDetail: currentError,
      });
    }
    return currentError;
  }, [envError, mapError, poisError]);

  // エラーコンポーネントの選択
  const errorComponent = useMemo(
    () => selectErrorComponent(displayError, mapError, retryCount, handleRetryMapLoad),
    [displayError, mapError, retryCount, handleRetryMapLoad]
  );

  // ローディング状態の判定
  const isAppLoading = useMemo(() => {
    const loading = !isLoaded || isLoadingPOIs;
    if (loading) {
      logger.debug('アプリケーションローディング中', {
        component: 'App',
        action: 'loading',
        isMapLoaded: isLoaded,
        isDataLoading: isLoadingPOIs,
      });
    }
    return loading;
  }, [isLoaded, isLoadingPOIs]);

  // UI状態の管理
  const { shouldShowFilters, isMapAvailable } = useUIState(
    isLoaded,
    filteredPOIs,
    isAppLoading,
    displayError,
    mapRef,
    pois
  );

  return (
    <div className='app-container'>
      <header className='app-header'>
        <h1>佐渡で食えっちゃ</h1>
      </header>

      <main>
        {/* フィルターパネル */}
        {shouldShowFilters && <FilterPanel pois={pois} onFilterChange={handleFilterChange} />}

        {/* マップコンテナは常に表示（環境変数エラーがない場合） */}
        {!envError && <MapContainer onMapElementReady={handleMapElementReady} />}

        {/* マップにマーカーを追加 */}
        {isMapAvailable && (
          <MapMarkers
            pois={filteredPOIs}
            mapRef={mapRef}
            onSelectPOI={handlePOISelect}
            onViewDetails={handlePOISelect}
          />
        )}

        {/* POI詳細表示 */}
        {selectedPOI && <POIDetails poi={selectedPOI} onClose={handleClosePOIDetails} />}

        {/* ローディング表示 */}
        {isAppLoading && !displayError && (
          <LoadingOverlay
            isLoadingPOIs={isLoadingPOIs}
            isLoaded={isLoaded}
            isMapElementReady={isMapElementReady}
          />
        )}

        {/* エラー表示 */}
        {errorComponent}
      </main>

      <footer className='app-footer'>
        <p>&copy; {new Date().getFullYear()} 佐渡で食えっちゃ</p>
      </footer>
    </div>
  );
}

export default App;
