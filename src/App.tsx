import React, { useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import styles from './App.module.css';
import { ErrorBoundary, LoadingIndicators, LocationWarning, Map, MapControls } from './components';
import { useAppState } from './hooks/useAppState';
import { useCurrentLocationPoi } from './hooks/useCurrentLocationPoi';
import { useErrorHandling } from './hooks/useErrorHandling';
import { useLocationWarning } from './hooks/useLocationWarning';
import { useMapNorthControl } from './hooks/useMapNorthControl';
import { useSheetData } from './features/data';
import { APP, ERROR_MESSAGES } from './utils/constants';

// メインコンポーネント
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
    <div className={styles.app}>
      <ErrorBoundary>
        <div className={styles.appContainer}>
          {isLoadingVisible && (
            <LoadingIndicators.Fallback
              isLoading={!combinedError}
              isLoaded={false}
              error={combinedError ? new Error(errorMessage) : null}
              message={loadingMessage}
              variant="spinner"
              spinnerClassName={styles.fullPageLoader}
              isFading={isFading}
              onRetry={combinedError ? actions.retryMapLoad : undefined}
            />
          )}

          {isMapLoaded && (
            <div className={styles.srOnly} aria-live="polite">
              マップが読み込まれました
            </div>
          )}

          <Map onLoad={actions.handleMapLoad} pois={allPois} selectedPoi={selectedPoi} />

          <MapControls onResetNorth={resetNorth} onGetCurrentLocation={handleGetCurrentLocation} />

          {showWarning && <LocationWarning onClose={() => setShowWarning(false)} />}
        </div>
      </ErrorBoundary>
    </div>
  );
};

// レンダリングロジックをメイン関数に分離
function renderApp() {
  const container = document.getElementById('app');
  if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);

  const root = createRoot(container);
  root.render(<App />);
}

// アプリケーションのレンダリング
renderApp();

export default App;
