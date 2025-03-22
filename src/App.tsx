/**
 * アプリケーションのメインコンポーネント
 * GitHub Pages静的サイト向けに最適化
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';

import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingFallback } from './components/LoadingFallback';
import Map from './components/map/Map';
import { APP_CONFIG } from './config/app.config';
import { ERROR_MESSAGES } from './constants';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import { usePoisData } from './hooks/usePoisData';
import type { MapLoadResult } from './types/maps.types';
import type { Poi } from './types/poi.types';
import { createError } from './utils/errors.utils';
import { logError, logInfo } from './utils/logger';

/**
 * アプリケーションのメインコンポーネント
 */
const App: React.FC = () => {
  const { isMobile } = useDeviceDetection();
  const { pois, isLoading: isDataLoading, error: dataError, refetch } = usePoisData();

  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // オンライン/オフラインステータスの監視
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logInfo('APP', 'ONLINE', 'オンライン接続が回復しました');
    };

    const handleOffline = () => {
      setIsOnline(false);
      logInfo('APP', 'OFFLINE', 'オフライン状態になりました');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // マップ読み込み完了ハンドラ
  const handleMapLoad = useCallback((result: MapLoadResult) => {
    setIsMapLoading(false);

    if (!result.success) {
      const errorMessage = result.error.message || ERROR_MESSAGES.MAP.LOAD_FAILED;
      logError('MAP', 'LOAD_ERROR', errorMessage, result.error.details);
      setMapError(createError('MAP', 'LOAD_ERROR', errorMessage));
    } else {
      logInfo('MAP', 'LOAD_SUCCESS', 'マップが正常に読み込まれました', {
        basePath: APP_CONFIG.BASE_PATH.CURRENT,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  // POI選択ハンドラ
  const handlePoiSelect = useCallback((poi: Poi | null) => {
    setSelectedPoi(poi);
  }, []);

  // エラー表示コンポーネント - メモ化
  const ErrorFallback = useMemo(() => {
    return ({ message, onRetry }: { message: string; onRetry: () => void }) => (
      <div className="error-container" role="alert">
        <h2>読み込みに失敗しました</h2>
        <p>{message}</p>
        <button onClick={onRetry}>再試行</button>
      </div>
    );
  }, []);

  // 再試行ハンドラ
  const handleRetry = useCallback(() => {
    if (dataError) refetch();
    if (mapError) {
      setMapError(null);
      setIsMapLoading(true);
    }
  }, [dataError, mapError, refetch]);

  // アプリケーション状態の計算
  const appState = useMemo(() => {
    const isLoading = isDataLoading || isMapLoading;
    const hasError = Boolean(dataError || mapError);
    const errorMessage = dataError?.message || mapError?.message || ERROR_MESSAGES.GENERAL.UNKNOWN;
    const loadingMessage = isDataLoading
      ? 'データを読み込んでいます...'
      : '地図を読み込んでいます...';

    return { isLoading, hasError, errorMessage, loadingMessage, isOnline };
  }, [isDataLoading, isMapLoading, dataError, mapError, isOnline]);

  // エラーバウンダリ用フォールバック（マップレンダリングエラー専用）
  const renderErrorFallback = useCallback(
    (error: Error) => {
      const appError = createError('MAP', 'RENDER_ERROR', error.message);
      return <ErrorFallback message={appError.message} onRetry={() => window.location.reload()} />;
    },
    [ErrorFallback],
  );

  // オフライン状態の表示
  const OfflineNotice = useMemo(() => {
    return (
      <div className="offline-notice" role="status" aria-live="polite">
        <p>📶 現在オフライン状態です。一部の機能が制限されています。</p>
      </div>
    );
  }, []);

  return (
    <div className="app-container" data-version={APP_CONFIG.VERSION} data-env={APP_CONFIG.ENV}>
      {!appState.isOnline && OfflineNotice}

      <ErrorBoundary fallback={renderErrorFallback}>
        {appState.hasError ? (
          <ErrorFallback message={appState.errorMessage} onRetry={handleRetry} />
        ) : (
          <>
            {appState.isLoading && (
              <LoadingFallback
                message={appState.loadingMessage}
                showProgress={true}
                className="map-loading"
                aria-live="polite"
              />
            )}
            <Map
              onMapLoad={handleMapLoad}
              pois={pois || []}
              eventHandlers={{ onPoiSelect: handlePoiSelect }}
              selectedPoi={selectedPoi}
              isMobile={isMobile}
              basePath={APP_CONFIG.BASE_PATH.CURRENT}
              isOffline={!appState.isOnline}
            />
          </>
        )}
      </ErrorBoundary>
    </div>
  );
};

export default App;
