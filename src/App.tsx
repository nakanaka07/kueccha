import React, { useState, useCallback } from 'react';

import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingFallback } from './components/LoadingFallback';
import Map from './components/map/Map';
import { ERROR_MESSAGES } from './constants';
import { createError } from './utils/errors.utils';
import { logError } from './utils/logger';

import type { MapLoadResult, Poi } from './types';

const App: React.FC = () => {
  // POIデータの状態管理
  const [pois, setPois] = useState<Poi[]>([]);
  // 選択されたPOIの状態管理
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  // ローディング状態の管理
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * マップ読み込み完了時のハンドラ
   */
  const handleMapLoad = useCallback((result: MapLoadResult) => {
    setIsLoading(false);

    if (result.success) {
      console.log('マップが正常に読み込まれました');
    } else {
      const errorMessage = result.error.message || ERROR_MESSAGES.MAP.LOAD_FAILED;
      logError('MAP', 'LOAD_ERROR', errorMessage, result.error.details);
    }
  }, []);

  /**
   * POI選択時のハンドラ
   */
  const handlePoiSelect = useCallback((poi: Poi | null) => {
    setSelectedPoi(poi);
  }, []);

  /**
   * エラー発生時のフォールバックコンポーネント
   */
  const renderErrorFallback = useCallback((error: Error) => {
    const appError = createError('MAP', 'RENDER_ERROR', error.message);
    return (
      <div className="error-container">
        <h2>マップの読み込みに失敗しました</h2>
        <p>{appError.message}</p>
        <button onClick={() => window.location.reload()}>再読み込み</button>
      </div>
    );
  }, []);

  return (
    <div className="app-container">
      <ErrorBoundary fallback={renderErrorFallback}>
        {isLoading && (
          <LoadingFallback
            message="地図を読み込んでいます..."
            showProgress={true}
            className="map-loading"
          />
        )}
        <Map
          onMapLoad={handleMapLoad}
          pois={pois}
          eventHandlers={{
            onPoiSelect: handlePoiSelect,
          }}
        />
      </ErrorBoundary>
    </div>
  );
};

export default App;
