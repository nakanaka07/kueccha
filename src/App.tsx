import React, { useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import styles from './App.module.css';
import { ErrorBoundary, LoadingIndicators, LocationWarning, Map, MapControls } from './components';
import { useAppState } from './hooks/useAppState';
import { useLocationWarning } from './hooks/useLocationWarning';
import { useMapNorthControl } from './hooks/useMapNorthControl';
import { useSheetData } from './hooks/useSheetData';
import { ERROR_MESSAGES } from './utils/constants';
import type { Poi } from './utils/types';

const App: React.FC = () => {
  const { pois, error: poisError } = useSheetData();

  const { currentLocation, showWarning, setShowWarning, getCurrentLocationInfo } = useLocationWarning();

  const currentLocationPoi: Poi | null = useMemo(() => {
    if (!currentLocation) return null;

    return {
      id: 'current-location',
      name: '現在地',
      location: currentLocation,
      area: 'CURRENT_LOCATION',
      genre: '現在地',
      category: '現在地',
    };
  }, [currentLocation]);

  const allPois = useMemo(() => {
    const basePois = pois || [];
    return currentLocationPoi ? [...basePois, currentLocationPoi] : basePois;
  }, [pois, currentLocationPoi]);

  const {
    mapInstance,
    isMapLoaded,
    isMapLoading,
    loading: { isVisible: isLoadingVisible, isFading },
    error,
    actions,
    selectedPoi,
  } = useAppState(allPois);

  const { resetNorth } = useMapNorthControl(mapInstance);

  const handleGetCurrentLocation = useCallback(() => {
    getCurrentLocationInfo();
  }, [getCurrentLocationInfo]);

  const errorMessage = useMemo(() => {
    if (!error && !poisError) return null;
    return (error || poisError)?.message || ERROR_MESSAGES.MAP.LOAD_FAILED;
  }, [error, poisError]);

  const loadingMessage = useMemo(() => {
    return isMapLoading ? ERROR_MESSAGES.LOADING.MAP : ERROR_MESSAGES.LOADING.DATA;
  }, [isMapLoading]);

  return (
    <div className={styles.app}>
      <ErrorBoundary>
        <div className={styles.appContainer}>
          {isLoadingVisible && (
            <LoadingIndicators.Fallback
              isLoading={!error && !poisError}
              isLoaded={false}
              error={error || poisError ? new Error(errorMessage || '') : null}
              message={loadingMessage}
              variant="spinner"
              spinnerClassName={styles.fullPageLoader}
              isFading={isFading}
              onRetry={error || poisError ? actions.retryMapLoad : undefined}
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

const container = document.getElementById('app');
if (!container) throw new Error(ERROR_MESSAGES.SYSTEM.CONTAINER_NOT_FOUND);
const root = createRoot(container);
root.render(<App />);
