// App.tsx
import React, { useCallback, useMemo } from 'react';
import { useAppState } from './hooks/useAppState';
import { useCurrentLocationPoi } from './hooks/useCurrentLocationPoi';
import { useErrorHandling } from './hooks/useErrorHandling';
import { useLocationWarning } from './hooks/useLocationWarning';
import { useMapNorthControl } from './hooks/useMapNorthControl';
import { useSheetData } from './features/data';
import { APP } from './utils/constants';
import { AppLayout } from './components/layout/AppLayout';

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
    return isMapLoading ? APP.ui.messages.loading.map : APP.ui.messages.loading.data;
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