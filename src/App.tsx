/**
 * アプリケーションのメインコンポーネント
 * 
 * 地図表示とPOI管理の中央ハブとして機能します。
 */
import React, { useState, useCallback } from 'react';

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

const App: React.FC = () => {
  const { isMobile } = useDeviceDetection();
  const { pois, isLoading: isDataLoading, error: dataError, refetch } = usePoisData();
  
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<Error | null>(null);

  const handleMapLoad = useCallback((result: MapLoadResult) => {
    setIsMapLoading(false);
    
    if (!result.success) {
      const errorMessage = result.error.message || ERROR_MESSAGES.MAP.LOAD_FAILED;
      logError('MAP', 'LOAD_ERROR', errorMessage, result.error.details);
      setMapError(new Error(errorMessage));
    }
  }, []);

  const handlePoiSelect = useCallback((poi: Poi | null) => {
    setSelectedPoi(poi);
  }, []);

  const renderErrorFallback = useCallback((error: Error) => {
    const appError = createError('MAP', 'RENDER_ERROR', error.message);
    return (
      <div className="error-container" role="alert">
        <h2>マップの読み込みに失敗しました</h2>
        <p>{appError.message}</p>
        <button onClick={() => window.location.reload()}>再読み込み</button>
      </div>
    );
  }, []);

  const handleRetry = useCallback(() => {
    if (dataError) refetch();
    if (mapError) {
      setMapError(null);
      setIsMapLoading(true);
    }
  }, [dataError, mapError, refetch]);

  // ステータス判定
  const isLoading = isDataLoading || isMapLoading;
  const hasError = dataError || mapError;
  const errorMessage = dataError?.message || mapError?.message || 'アプリケーションエラーが発生しました';

  return (
    <div className="app-container">
      <ErrorBoundary fallback={renderErrorFallback}>
        {hasError ? (
          <div className="error-container" role="alert">
            <h2>読み込みに失敗しました</h2>
            <p>{errorMessage}</p>
            <button onClick={handleRetry}>再試行</button>
          </div>
        ) : (
          <>
            {isLoading && (
              <LoadingFallback
                message={isDataLoading ? 'データを読み込んでいます...' : '地図を読み込んでいます...'}
                showProgress={true}
                className="map-loading"
                aria-live="polite"
              />
            )}
            <Map
              onMapLoad={handleMapLoad}
              pois={pois}
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