import React, { useCallback, useMemo, useEffect } from 'react';
import { LOADING_MESSAGES, ERRORS } from '@core/constants/messages';
import { useAppState } from '@core/hooks/useAppState';
import { useLocationWarning } from '@core/hooks/useLocationWarning';
import { useSheetData } from '@core/services/sheets';
import { useMapNorthControl } from '@modules/map/hooks/useMapNorthControl';
import { useCurrentLocationPoi } from '@modules/poi/hooks/useCurrentLocationPoi';
import { AppLayout } from '@shared/components/layout/AppLayout';
import { ErrorBoundary } from '@shared/components/ui/error/ErrorBoundary';

/**
 * メインアプリケーションコンポーネント
 * データフローの中枢、状態管理のハブ、マップ機能の統括として機能
 */
const App: React.FC = () => {
  // ----- データソースの統合 -----
  // POIデータの取得
  const { data: pois, status: poisStatus } = useSheetData();

  // 位置情報の管理
  const { currentLocation, showWarning, setShowWarning, getCurrentLocationInfo } = useLocationWarning();

  // 現在地をPOIとして扱う
  const currentLocationPoi = useCurrentLocationPoi(currentLocation);

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
  // POIデータのエラーハンドリング
  // dataFetchErrorが存在しないため、正しいエラープロパティに変更
  const poisError = poisStatus === 'error' ? { message: ERRORS.dataFetch, severity: 'error' as const } : null;

  // エラー情報の統合
  const errorDetails = useMemo(() => {
    const error = mapError || poisError;
    if (!error) return null;

    return {
      message: error.message || ERRORS.systemError,
      severity: error.severity || 'error',
      code: 'code' in error ? error.code : undefined,
    };
  }, [mapError, poisError]);

  // ----- イベントハンドラ -----
  const handleGetCurrentLocation = useCallback(() => {
    getCurrentLocationInfo();
  }, [getCurrentLocationInfo]);

  // ローディングメッセージの判定
  const loadingMessage = useMemo(() => (isMapLoading ? LOADING_MESSAGES.map : LOADING_MESSAGES.data), [isMapLoading]);

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<div>読み込み中...</div>}>
        <AppLayout
          isLoadingVisible={isLoadingVisible}
          isFading={isFading}
          isMapLoaded={isMapLoaded}
          loadingMessage={loadingMessage}
          combinedError={!!errorDetails}
          errorMessage={errorDetails?.message || ''}
          showWarning={showWarning}
          setShowWarning={setShowWarning}
          allPois={allPois}
          selectedPoi={selectedPoi}
          actions={actions}
          resetNorth={resetNorth}
          handleGetCurrentLocation={handleGetCurrentLocation}
        />
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default App;
