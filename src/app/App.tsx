import React, { useCallback, useMemo, useEffect } from 'react';
import { useMapNorthControl } from '@/modules/map/hooks/useMapNorthControl';
import { LOADING_MESSAGES, ERRORS } from '@core/constants/messages';
import { useAppState } from '@core/hooks/useAppState';
import { useSheetData } from '@core/services/sheets';
import { AppLayout } from '@shared/components/layout/AppLayout';
import { ErrorBoundary } from '@shared/components/ui/error/ErrorBoundary';
import { useAreaFiltering } from '../core/hooks/useAreaFiltering';
import { useCurrentLocation } from '../core/hooks/useCurrentLocation';
import { useErrorHandling } from '../core/hooks/useErrorHandling';
import { createError } from '../core/utils/errorHandling';

/**
 * メインアプリケーションコンポーネント
 * データフローの中枢、状態管理のハブ、マップ機能の統括として機能
 */
const App: React.FC = () => {
  // ----- データソースの統合 -----
  // POIデータの取得
  const { data: pois, status: poisStatus } = useSheetData();

  // 位置情報の管理
  const { currentLocationPoi, showWarning, setShowWarning, getCurrentLocationInfo } = useCurrentLocation();

  // POIデータの統合（現在地 + スプレッドシートデータ）
  const allPois = useMemo(() => {
    if (!pois?.length) return currentLocationPoi ? [currentLocationPoi] : [];
    return currentLocationPoi ? [currentLocationPoi, ...pois] : pois;
  }, [pois, currentLocationPoi]);

  // ----- アプリケーション状態管理 -----
  // 集約された状態管理
  const {
    mapInstance,
    isMapLoaded,
    isMapLoading,
    loading: { isVisible: isLoadingVisible, isFading },
    error: mapError,
    actions,
    selectedPoi,
  } = useAppState(allPois);

  // ----- マップ機能管理 -----
  // マップコントロール
  const { onResetNorth: resetNorth } = useMapNorthControl(
    // 型キャストは避けられない場合のみ使用
    mapInstance as unknown as google.maps.Map | null,
  );

  // マップのライフサイクル管理
  useEffect(() => {
    if (!mapInstance) return;

    return () => {
      const mapWithCleanup = mapInstance as unknown as { cleanup?: () => void };
      if (typeof mapWithCleanup.cleanup === 'function') {
        mapWithCleanup.cleanup();
      }
    };
  }, [mapInstance]);

  // ----- エラー状態の統合 -----
  // POIデータのエラーハンドリング - createErrorを使用して標準化
  const poisError = poisStatus === 'error' ? createError('DATA', 'FETCH_FAILED', ERRORS.dataFetch) : null;

  // 統合エラーハンドリングフックの使用
  const { combinedError, errorMessage, errorDetails, isRetryable, severity } = useErrorHandling(mapError, poisError);

  // ----- イベントハンドラ -----
  const handleGetCurrentLocation = useCallback(() => {
    getCurrentLocationInfo();
  }, [getCurrentLocationInfo]);

  // ローディングメッセージの判定
  const loadingMessage = useMemo(() => (isMapLoading ? LOADING_MESSAGES.map : LOADING_MESSAGES.data), [isMapLoading]);

  // エリアフィルタリングの統合使用
  const { filteredPois } = useAreaFiltering(allPois || []);

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>読み込み中...</div>}>
        <AppLayout
          isLoadingVisible={isLoadingVisible}
          isFading={isFading}
          isMapLoaded={isMapLoaded}
          loadingMessage={loadingMessage}
          // エラー情報を適切に渡す
          combinedError={!!combinedError}
          errorMessage={errorMessage}
          errorDetails={errorDetails}
          errorSeverity={severity}
          isRetryable={isRetryable}
          // 警告表示の管理
          showWarning={showWarning}
          setShowWarning={setShowWarning}
          // POIデータ管理
          allPois={allPois}
          filteredPois={filteredPois} // filteredPois を直接渡す
          selectedPoi={selectedPoi}
          // アクション
          actions={actions}
          resetNorth={resetNorth}
          handleGetCurrentLocation={handleGetCurrentLocation}
        />
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default App;
