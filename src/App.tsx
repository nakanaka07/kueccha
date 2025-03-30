import { useCallback, useState, useEffect, useRef, useMemo } from 'react';

import ErrorDisplay from '@/components/ErrorDisplay';
import FilterPanel from '@/components/FilterPanel';
import LoadingOverlay from '@/components/LoadingOverlay';
import { MapContainer } from '@/components/MapContainer';
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

  useEffect(() => {
    logger.info('アプリケーション初期化開始');

    try {
      const isValid = logger.measureTime('環境変数検証', () => validateEnv(), LogLevel.INFO);

      if (!isValid) {
        const errorMsg = '必要な環境変数が設定されていません。管理者に連絡してください。';
        logger.error(errorMsg);
        setEnvError(errorMsg);
      } else {
        logger.info('環境変数検証成功');
      }
    } catch (error) {
      const errorMsg = '環境変数の検証中にエラーが発生しました';
      logger.error(errorMsg, error instanceof Error ? error : new Error(String(error)));
      setEnvError(errorMsg);
    }

    return () => {
      logger.info('アプリケーションクリーンアップ');
    };
  }, []);

  return envError;
};

// POI データとフィルタリングを管理するフック
const usePOIManagement = (envError: string | null) => {
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);
  const [filteredPOIs, setFilteredPOIs] = useState<PointOfInterest[]>([]);

  // POIデータの取得
  const {
    pois,
    isLoading: isLoadingPOIs,
    error: poisError,
  } = usePOIData({
    enabled: !envError,
  });

  // フィルタリング初期化
  useEffect(() => {
    // データが存在し、長さがある場合のみフィルタリング
    if (pois.length > 0) {
      logger.debug('初期POIフィルター設定', { count: pois.length });
      setFilteredPOIs(pois);
    }
  }, [pois]);

  // POI詳細表示
  const handlePOISelect = useCallback((poi: PointOfInterest) => {
    logger.info('POI選択', {
      id: poi.id,
      name: poi.name,
      category: poi.category,
    });

    setSelectedPOI(poi);
  }, []);

  // POI詳細を閉じる
  const handleClosePOIDetails = useCallback(() => {
    logger.debug('POI詳細を閉じました');
    setSelectedPOI(null);
  }, []);

  // フィルタリングされたPOIの更新
  const handleFilterChange = useCallback(
    (filtered: PointOfInterest[]) => {
      const poisLength = pois.length || 1; // pois.lengthが0の場合は1で除算

      logger.debug('POIフィルター適用', {
        before: filteredPOIs.length,
        after: filtered.length,
        reduction: `${Math.round((1 - filtered.length / poisLength) * 100)}%`,
      });

      setFilteredPOIs(filtered);
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
    logger.debug('マップDOM要素が準備完了');

    // 状態更新を確実に行う
    setTimeout(() => {
      setIsMapElementReady(true);
      logger.info('マップDOM要素の状態を更新しました');
    }, 0);
  }, []);

  // Google Mapsフック
  const { isLoaded, error } = useGoogleMaps({
    elementId: 'map',
    zoom: 11,
    onMapLoaded,
    skipInit: !isMapElementReady,
    initTimeout: 15000,
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
      logger.logIf(
        true,
        LogLevel.WARN,
        'マップは表示されていますが、マップインスタンスが利用できません'
      );
    }
    return available;
  }, [shouldShowMarkers, mapRef]);

  // アプリの表示状態を計測しログに記録
  useEffect(() => {
    if (isMapAvailable && filteredPOIs.length > 0 && !isAppLoading) {
      const poisLength = pois.length || 1; // 0除算防止

      logger.info('アプリケーション表示準備完了', {
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
 * メインアプリケーションコンポーネント
 * 地図の表示とPOIデータの管理を行います
 */
function App() {
  const mapRef = useRef<google.maps.Map | null>(null);

  // マップ読み込み完了時のコールバック
  const handleMapLoaded = useCallback((map: google.maps.Map) => {
    logger.info('Google Maps APIの読み込みが完了しました', {
      center: map.getCenter()?.toJSON(),
      zoom: map.getZoom(),
    });

    mapRef.current = map;
  }, []);

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
      logger.warn('アプリケーションエラーが発生しています', { errorType: currentError });
    }
    return currentError;
  }, [envError, mapError, poisError]);

  // ローディング状態の判定
  const isAppLoading = useMemo(() => {
    const loading = !isLoaded || isLoadingPOIs;
    if (loading) {
      logger.logIf(true, LogLevel.DEBUG, 'アプリケーションローディング中', {
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
        {displayError && <ErrorDisplay message={displayError} />}
      </main>

      <footer className='app-footer'>
        <p>&copy; {new Date().getFullYear()} 佐渡で食えっちゃ</p>
      </footer>
    </div>
  );
}

export default App;
