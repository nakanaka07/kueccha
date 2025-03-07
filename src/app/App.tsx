// App.tsx
import React, { useCallback, useMemo } from 'react';
// 正しい相対パスに修正
import { CONFIG } from '../core/constants/config';
import { useAppState } from '../core/hooks/useAppState';
import { useLocationWarning } from '../core/hooks/useLocationWarning';
// 存在しないインポートを正しいパスに修正
import { createError } from '../core/services/errors';
import { useSheetData } from '../core/services/sheets'; // sheets.tsに統合済み
import { useMapNorthControl } from '../modules/map/hooks/useMapNorthControl';
import { useCurrentLocationPoi } from '../modules/poi/hooks/useCurrentLocationPoi';
import { AppLayout } from '../shared/components/layout/AppLayout';

// useErrorHandling が見当たらないので、作成する必要があります

// エラーハンドリングのフックを追加
const useErrorHandling = (mapError: any, poisError: any) => {
  const combinedError = mapError || poisError;
  const errorMessage = combinedError?.message || '予期しないエラーが発生しました';
  return { combinedError, errorMessage };
};

const App: React.FC = () => {
  const { pois, error: poisError } = useSheetData();
  const { currentLocation, showWarning, setShowWarning, getCurrentLocationInfo } = useLocationWarning();

  // カスタムフックで現在地POIを生成
  const currentLocationPoi = useCurrentLocationPoi(currentLocation);

  // POIリストの結合（不要なレンダリングを防ぐためのメモ化）
  const allPois = useMemo(() => {
    if (!pois) {
      return currentLocationPoi ? [currentLocationPoi] : [];
    }
    return currentLocationPoi ? [currentLocationPoi, ...pois] : pois;
  }, [pois, currentLocationPoi]);

  const {
    mapInstance,
    isMapLoaded,
    isMapLoading,
    loading: { isVisible: isLoadingVisible, isFading },
    error: mapError,
    actions,
    selectedPoi,
  } = useAppState(allPois);

  const { onResetNorth: resetNorth } = useMapNorthControl(mapInstance);

  // エラー処理のロジックを分離したカスタムフックを使用
  const { combinedError, errorMessage } = useErrorHandling(mapError, poisError);

  // 現在地取得のコールバック
  const handleGetCurrentLocation = useCallback(() => {
    getCurrentLocationInfo();
  }, [getCurrentLocationInfo]);

  // ローディングメッセージの生成
  const loadingMessage = useMemo(() => {
    return isMapLoading ? CONFIG.ui.messages.loading.map : CONFIG.ui.messages.loading.data;
  }, [isMapLoading]);

  return (
    <AppLayout
      isMapLoaded={isMapLoaded}
      isLoadingVisible={isLoadingVisible}
      isFading={isFading}
      combinedError={combinedError}
      errorMessage={errorMessage}
      loadingMessage={loadingMessage}
      showWarning={showWarning}
      allPois={allPois}
      selectedPoi={selectedPoi}
      actions={actions}
      resetNorth={resetNorth}
      handleGetCurrentLocation={handleGetCurrentLocation}
      setShowWarning={setShowWarning}
    />
  );
};

export default App;
