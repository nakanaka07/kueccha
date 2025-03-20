/**
 * アプリケーションのメインコンポーネント
 *
 * 地図表示とPOI管理の中央ハブとして機能し、
 * データロード、エラーハンドリング、ユーザー操作を調整します。
 */
import React, { useState, useCallback, useEffect } from 'react';

import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingFallback } from './components/LoadingFallback';
import Map from './components/map/Map';
import { ERROR_MESSAGES } from './constants';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import { usePoisData } from './hooks/usePoisData'; // 新規カスタムフック
import { createError } from './utils/errors.utils';
import { logError } from './utils/logger';

import type { MapLoadResult } from './types/maps.types'; // 明確なパスからインポート
import type { Poi } from './types/poi.types'; // 明確なパスからインポート

const App: React.FC = () => {
  // デバイス検出フック (モバイル対応用)
  const { isMobile } = useDeviceDetection();

  // POIデータ取得カスタムフック
  const { pois, isLoading: isDataLoading, error: dataError, refetch } = usePoisData();

  // 選択されたPOIの状態管理
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  // マップローディング状態の管理
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true);

  // マップエラー状態の管理
  const [mapError, setMapError] = useState<Error | null>(null);

  /**
   * マップ読み込み完了時のハンドラ
   */
  const handleMapLoad = useCallback((result: MapLoadResult) => {
    setIsMapLoading(false);

    if (result.success) {
      console.log('マップが正常に読み込まれました');
    } else {
      const errorMessage = result.error.message || ERROR_MESSAGES.MAP.LOAD_FAILED;
      logError('MAP', 'LOAD_ERROR', errorMessage, result.error.details);
      setMapError(new Error(errorMessage));
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
      <div className="error-container" role="alert">
        <h2>マップの読み込みに失敗しました</h2>
        <p>{appError.message}</p>
        <button onClick={() => window.location.reload()}>再読み込み</button>
      </div>
    );
  }, []);

  /**
   * エラーがある場合に再試行するハンドラ
   */
  const handleRetry = useCallback(() => {
    if (dataError) {
      refetch();
    }
    if (mapError) {
      setMapError(null);
      setIsMapLoading(true);
    }
  }, [dataError, mapError, refetch]);

  // ローディング中かどうかの判定
  const isLoading = isDataLoading || isMapLoading;

  // エラーの有無の判定
  const hasError = dataError || mapError;

  // エラーメッセージの設定
  const errorMessage =
    dataError?.message || mapError?.message || 'アプリケーションエラーが発生しました';

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
                message={
                  isDataLoading ? 'データを読み込んでいます...' : '地図を読み込んでいます...'
                }
                showProgress={true}
                className="map-loading"
                aria-live="polite"
              />
            )}
            <Map
              onMapLoad={handleMapLoad}
              pois={pois}
              eventHandlers={{
                onPoiSelect: handlePoiSelect,
              }}
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
