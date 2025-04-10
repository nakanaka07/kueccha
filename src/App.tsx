import { useCallback, useState, useEffect, useRef, useMemo } from 'react';

import ErrorDisplay from '@/components/ErrorDisplay';
import FilterPanel from '@/components/FilterPanel';
import LoadingOverlay from '@/components/LoadingOverlay';
import { MapContainer } from '@/components/MapContainer';
import MapLoadingError from '@/components/MapLoadingError';
import MapMarkers from '@/components/MapMarkers';
import POIDetails from '@/components/POIDetails';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { usePOIConverter } from '@/hooks/usePOIConverter';
import { usePOIData } from '@/hooks/usePOIData';
import { usePOIState } from '@/hooks/usePOIState';
import type { PointOfInterest } from '@/types/poi';
import { validateEnv, getEnvVar, ENV, toLogLevel } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';

// 環境バリデーション用のフック - 環境変数検証を責務とする
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
      // validateEnv()の結果だけを信頼し、二重検証を行わない
      const isValid = logger.measureTime('環境変数検証', validateEnv, LogLevel.INFO, {
        component: 'App',
        action: 'validateEnv',
      });

      if (!isValid) {
        // validateEnv内で必要な検証は完了しているため、結果だけを使用
        const errorMsg = '必要な環境変数が設定されていません。管理者に連絡してください。';
        logger.error(errorMsg, {
          component: 'App',
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

// ログ設定のみを担当するフック - ログ設定を責務とする
const useLoggerConfiguration = () => {
  useEffect(() => {
    // 環境変数に基づいたログレベルの設定
    const logLevelStr = getEnvVar({
      key: 'VITE_LOG_LEVEL',
      defaultValue: ENV.env.isDev ? 'debug' : 'info',
    });

    // ログレベル設定
    const logLevel = toLogLevel(logLevelStr);

    // ログ設定の適用
    logger.configure({
      minLevel: logLevel,
      // コンポーネント別のログレベルをより詳細に設定
      componentLevels: {
        App: ENV.env.isDev ? LogLevel.DEBUG : LogLevel.INFO,
        MapContainer: LogLevel.INFO,
        FilterPanel: ENV.env.isDev ? LogLevel.DEBUG : LogLevel.WARN,
      },
      // サンプリングレートの設定（高頻度イベント対応）
      samplingRates: {
        マーカー更新: 5,
        フィルター適用: 3,
      },
    });

    logger.info('ロガー設定を環境に合わせて調整しました', {
      component: 'App',
      action: 'configureLogger',
      logLevel,
      isDev: ENV.env.isDev,
    });
  }, []);
};

// 再試行機能のみを担当するフック
const useMapRetry = () => {
  const [retryCount, setRetryCount] = useState(0);

  // 地図読み込み再試行ハンドラ
  const handleRetryMapLoad = useCallback(() => {
    logger.info('地図読み込みの再試行を実行', {
      component: 'App',
      action: 'retryMap',
      retryCount: retryCount + 1,
    });
    setRetryCount(prev => prev + 1);
  }, [retryCount]);

  return {
    retryCount,
    handleRetryMapLoad,
  };
};

// マップ関連の状態のみを扱うフック
const useMapState = (onMapLoaded: (map: google.maps.Map) => void) => {
  const mapRef = useRef<google.maps.Map | null>(null);

  // マップ読み込み完了時のコールバック
  const handleMapLoaded = useCallback(
    (map: google.maps.Map) => {
      logger.info('Google Maps APIの読み込みが完了しました', {
        component: 'App',
        action: 'mapLoaded',
        center: map.getCenter()?.toJSON(),
        zoom: map.getZoom(),
        apiVersion: google.maps.version, // APIバージョンを記録
      });

      mapRef.current = map;
      onMapLoaded(map);
    },
    [onMapLoaded]
  );

  return {
    mapRef,
    handleMapLoaded,
  };
};

// POI データとフィルタリングを管理するフック
const usePOIManagement = (envError: string | null) => {
  const [convertedPOIs, setConvertedPOIs] = useState<PointOfInterest[]>([]); // 変換済みPOIデータを保持

  // POIデータの取得 (環境変数エラーがない場合のみ有効化)
  const {
    data: pois,
    isLoading: isLoadingPOIs,
    error: poisError,
  } = usePOIData({
    enabled: envError === null,
  });

  // POI型変換関数 - 独立したフックから取得
  const { convertPOItoPointOfInterest } = usePOIConverter();

  // POIの状態管理 - 独立したフックから取得
  const { selectedPOI, filteredPOIs, handlePOISelect, handleClosePOIDetails, handleFilterChange } =
    usePOIState(convertedPOIs);

  // POIデータ変換 - pois変更時に実行
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

          // POIデータをPOIInput型に適合させて変換
          const converted = pois.map(poi =>
            convertPOItoPointOfInterest({
              ...poi, // ベースとなるプロパティを先に展開
              // 必要な型変換や特別な処理が必要なプロパティのみを明示的にオーバーライド
              categories: Array.isArray(poi.category) ? poi.category : [poi.category], // poi.categoryは常にtruthyなので単純に配列化
              district:
                typeof poi.district === 'string' || typeof poi.district === 'number'
                  ? poi.district
                  : '', // 厳密な型チェック
            })
          );
          setConvertedPOIs(converted);
        },
        LogLevel.DEBUG,
        { component: 'App' },
        100 // 100ms以上かかった場合のみログ出力
      );
    }
  }, [pois, convertPOItoPointOfInterest]);

  return {
    pois: convertedPOIs, // 変換済みのPointOfInterest型POIデータを返す
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
    return isLoaded && displayError === null;
  }, [isLoaded, displayError]);

  // マップマーカー表示の条件判定
  const shouldShowMarkers = useMemo(
    () => isLoaded && displayError === null && filteredPOIs.length > 0,
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
      // filteredPOIsが存在するならpois.lengthは必ず1以上なので、条件チェックは不要
      const poisLength = pois.length;

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
 * Error型をstring型に変換する関数
 */
const errorToString = (error: Error | null): string | null => {
  if (error === null) return null;
  return error.message || '不明なエラーが発生しました';
};

/**
 * エラーを計算する関数
 * 環境変数、マップ、POIデータのエラーを優先順位付けして返す
 */
const calculateDisplayError = (
  envError: string | null,
  mapError: string | null,
  poisError: Error | null
) => {
  // poisErrorをstring型に変換
  const poisErrorStr = errorToString(poisError);
  const currentError = envError ?? mapError ?? poisErrorStr;

  if (currentError !== null) {
    logger.warn('アプリケーションエラーが発生しています', {
      component: 'App',
      action: 'errorDetection',
      errorType: envError !== null ? 'environment' : mapError !== null ? 'map' : 'data',
      errorDetail: currentError,
    });
  }
  return currentError;
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
  if (displayError === null) return null;

  // 地図読み込みエラーの特別処理
  if (mapError !== null) {
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

// アプリケーションの設定と状態を管理するカスタムフック
// 以前のuseAppConfigurationを分割して簡素化
const useAppConfiguration = () => {
  // リファクタリングした各フックを使用
  useLoggerConfiguration();
  const { retryCount, handleRetryMapLoad } = useMapRetry();
  const { mapRef, handleMapLoaded } = useMapState(_map => {
    // マップロード完了時に呼び出す追加の処理があれば記述
    // 未使用引数はアンダースコア接頭辞で明示
  });

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
  const displayError = useMemo(
    () => calculateDisplayError(envError, mapError, poisError),
    [envError, mapError, poisError]
  );

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

  return {
    mapRef,
    envError,
    displayError,
    isLoaded,
    isLoadingPOIs,
    isMapElementReady,
    pois,
    filteredPOIs,
    selectedPOI,
    isAppLoading,
    shouldShowFilters,
    isMapAvailable,
    errorComponent,
    handleMapElementReady,
    handlePOISelect,
    handleClosePOIDetails,
    handleFilterChange,
  };
};

/**
 * アプリのUIレンダリングを担当するコンポーネント
 */
const AppUI = ({
  shouldShowFilters,
  envError,
  handleMapElementReady,
  isMapAvailable,
  filteredPOIs,
  mapRef,
  handlePOISelect,
  selectedPOI,
  handleClosePOIDetails,
  isAppLoading,
  displayError,
  isLoadingPOIs,
  isLoaded,
  isMapElementReady,
  errorComponent,
  pois,
  handleFilterChange,
}: {
  shouldShowFilters: boolean;
  envError: string | null;
  handleMapElementReady: () => void;
  isMapAvailable: boolean;
  filteredPOIs: PointOfInterest[];
  mapRef: React.RefObject<google.maps.Map | null>;
  handlePOISelect: (poi: PointOfInterest) => void;
  selectedPOI: PointOfInterest | null;
  handleClosePOIDetails: () => void;
  isAppLoading: boolean;
  displayError: string | null;
  isLoadingPOIs: boolean;
  isLoaded: boolean;
  isMapElementReady: boolean;
  errorComponent: React.ReactNode;
  pois: PointOfInterest[];
  handleFilterChange: (filtered: PointOfInterest[]) => void;
}) => (
  <div className='app-container'>
    <header className='app-header'>
      <h1>佐渡で食えっちゃ</h1>
    </header>

    <main>
      {/* フィルターパネル */}
      {shouldShowFilters && <FilterPanel pois={pois} onFilterChange={handleFilterChange} />}

      {/* マップコンテナは常に表示（環境変数エラーがない場合） */}
      {envError === null && <MapContainer onMapElementReady={handleMapElementReady} />}

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
      {selectedPOI !== null && <POIDetails poi={selectedPOI} onClose={handleClosePOIDetails} />}

      {/* ローディング表示 */}
      {isAppLoading && displayError === null && (
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

/**
 * メインアプリケーションコンポーネント
 * 地図の表示とPOIデータの管理を行います
 */
function App() {
  // 設定と状態管理を新しいカスタムフックに委譲
  const {
    mapRef,
    envError,
    displayError,
    isLoaded,
    isLoadingPOIs,
    isMapElementReady,
    pois,
    filteredPOIs,
    selectedPOI,
    isAppLoading,
    shouldShowFilters,
    isMapAvailable,
    errorComponent,
    handleMapElementReady,
    handlePOISelect,
    handleClosePOIDetails,
    handleFilterChange,
  } = useAppConfiguration();

  // UIコンポーネントをレンダリング
  return (
    <AppUI
      shouldShowFilters={shouldShowFilters}
      envError={envError}
      handleMapElementReady={handleMapElementReady}
      isMapAvailable={isMapAvailable}
      filteredPOIs={filteredPOIs}
      mapRef={mapRef}
      handlePOISelect={handlePOISelect}
      selectedPOI={selectedPOI}
      handleClosePOIDetails={handleClosePOIDetails}
      isAppLoading={isAppLoading}
      displayError={displayError}
      isLoadingPOIs={isLoadingPOIs}
      isLoaded={isLoaded}
      isMapElementReady={isMapElementReady}
      errorComponent={errorComponent}
      pois={pois}
      handleFilterChange={handleFilterChange}
    />
  );
}

export default App;
