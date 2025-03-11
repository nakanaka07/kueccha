import React, { useCallback, useMemo, useEffect } from 'react';
import { LOADING_MESSAGES, ERRORS } from '@/messages';
import { useErrorHandling } from '@/index';
import { createError } from '@/index';
import { useAppState } from '@/use/useAppState';
import { useCurrentLocation } from '@/use/useCurrentLocation';
import { useMapNorthControl } from '@/use/useMapNorthControl';
import { usePoiStore } from '@/use/usePoiStore';
import { AppLayout } from '@/AppLayout';
import { ErrorBoundary } from '@/ErrorBoundary';

/**
 * メインアプリケーションコンポーネント
 * データフローの中枢、状態管理のハブ、マップ機能の統括として機能
 */
const App: React.FC = () => {
  // アプリケーション状態（マップ関連）
  const {
    mapInstance,
    isMapLoaded,
    isMapLoading,
    loading: { isVisible: isLoadingVisible, isFading },
    error: mapError,
    actions,
  } = useAppState();

  // POI関連の状態を統合管理
  const { allPois, filteredPois, selectedPoi, setSelectedPoi, poisStatus } = usePoiStore();

  // 位置情報関連（UI表示のみ）
  const { showWarning, setShowWarning, getCurrentLocationInfo } = useCurrentLocation();

  // マップコントロール
  const { onResetNorth: resetNorth } = useMapNorthControl(mapInstance as unknown as google.maps.Map | null);

  // エラーハンドリング
  const poisError = poisStatus === 'error' ? createError('DATA', 'FETCH_FAILED', ERRORS.dataFetch) : null;

  const { combinedError, errorMessage, errorDetails, isRetryable, severity } = useErrorHandling(mapError, poisError);

  // 現在地取得ハンドラ
  const handleGetCurrentLocation = useCallback(() => {
    getCurrentLocationInfo();
  }, [getCurrentLocationInfo]);

  // ローディングメッセージ
  const loadingMessage = isMapLoading ? LOADING_MESSAGES.map : LOADING_MESSAGES.data;

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>読み込み中...</div>}>
        <AppLayout
          isLoadingVisible={isLoadingVisible}
          isFading={isFading}
          isMapLoaded={isMapLoaded}
          loadingMessage={loadingMessage}
          // エラー情報
          combinedError={!!combinedError}
          errorMessage={errorMessage}
          errorDetails={errorDetails}
          errorSeverity={severity}
          isRetryable={isRetryable}
          // 警告表示
          showWarning={showWarning}
          setShowWarning={setShowWarning}
          // POIデータ
          allPois={allPois}
          filteredPois={filteredPois}
          selectedPoi={selectedPoi}
          // アクション
          actions={actions}
          resetNorth={resetNorth}
          handleGetCurrentLocation={handleGetCurrentLocation}
          setSelectedPoi={setSelectedPoi}
        />
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default App;
