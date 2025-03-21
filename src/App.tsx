/**
 * アプリケーションのメインコンポーネント
 * GitHub Pages静的サイト向けに最適化
 */
import React, { useState, useCallback, useMemo } from 'react';

import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingFallback } from './components/LoadingFallback';
import Map from './components/map/Map';
import { ERROR_MESSAGES } from './constants';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import { usePoisData } from './hooks/usePoisData';
import { createError } from './utils/errors.utils';
import { logError } from './utils/logger';

import type { MapLoadResult } from './types/maps.types';
import type { Poi } from './types/poi.types';

/**
 * アプリケーションのメインコンポーネント
 */
const App: React.FC = () => {
  const { isMobile } = useDeviceDetection();
  const { 
    pois, 
    isLoading: isDataLoading, 
    error: dataError, 
    refetch 
  } = usePoisData();
  
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<Error | null>(null);

  // マップ読み込み完了ハンドラ
  const handleMapLoad = useCallback((result: MapLoadResult) => {
    setIsMapLoading(false);
    
    if (!result.success) {
      const errorMessage = result.error.message || ERROR_MESSAGES.MAP.LOAD_FAILED;
      logError('MAP', 'LOAD_ERROR', errorMessage, result.error.details);
      setMapError(createError('MAP', 'LOAD_ERROR', errorMessage));
    }
  }, []);

  // POI選択ハンドラ
  const handlePoiSelect = useCallback((poi: Poi | null) => {
    setSelectedPoi(poi);
  }, []);

  // エラー表示コンポーネント - メモ化
  const ErrorFallback = useMemo(() => {
    return ({ message, onRetry }: { message: string, onRetry: () => void }) => (
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
      
    return { isLoading, hasError, errorMessage, loadingMessage };
  }, [isDataLoading, isMapLoading, dataError, mapError]);

  // エラーバウンダリ用フォールバック（マップレンダリングエラー専用）
  const renderErrorFallback = useCallback((error: Error) => {
    const appError = createError('MAP', 'RENDER_ERROR', error.message);
    return (
      <ErrorFallback 
        message={appError.message} 
        onRetry={() => window.location.reload()} 
      />
    );
  }, [ErrorFallback]);

  return (
    <div className="app-container">
      <ErrorBoundary fallback={renderErrorFallback}>
        {appState.hasError ? (
          <ErrorFallback 
            message={appState.errorMessage} 
            onRetry={handleRetry} 
          />
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
            />
          </>
        )}
      </ErrorBoundary>
    </div>
  );
};

export default App;