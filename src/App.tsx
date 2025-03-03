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

const MARKER_ZOOM_LEVEL = 15;

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
    areaVisibility,
  } = useAppState(allPois);

  const { resetNorth } = useMapNorthControl(mapInstance);

  const handleGetCurrentLocation = useCallback(() => {
    getCurrentLocationInfo();
  }, [getCurrentLocationInfo]);

  const handleFitMarkers = useCallback(() => {
    if (mapInstance && allPois && allPois.length > 0) {
      const visiblePois = allPois.filter((poi) => poi.id === 'current-location' || areaVisibility[poi.area]);

      if (visiblePois.length === 0) return;

      const bounds = new google.maps.LatLngBounds();
      visiblePois.forEach((poi) => {
        bounds.extend(poi.location);
      });

      (mapInstance as google.maps.Map).fitBounds(bounds);

      const zoomListener = google.maps.event.addListener(mapInstance, 'idle', () => {
        if ((mapInstance?.getZoom() ?? 0) > 17) {
          mapInstance?.setZoom(17);
        }
        google.maps.event.removeListener(zoomListener);
      });
    }
  }, [mapInstance, allPois, areaVisibility]);

  const errorMessage = useMemo(() => {
    if (!error && !poisError) return null;
    return (error || poisError)?.message || ERROR_MESSAGES.MAP.LOAD_FAILED;
  }, [error, poisError]);

  const loadingMessage = useMemo(() => {
    return isMapLoading ? ERROR_MESSAGES.LOADING.MAP : ERROR_MESSAGES.LOADING.DATA;
  }, [isMapLoading]);

  const handleMarkerClick = useCallback(
    (poi: Poi) => {
      actions.setSelectedPoi(poi);

      if (!mapInstance) return;

      try {
        mapInstance.panTo(poi.location);
        mapInstance.setZoom(MARKER_ZOOM_LEVEL);

        const srNotification = document.createElement('div');
        srNotification.className = styles.srOnly;
        srNotification.setAttribute('aria-live', 'polite');
        srNotification.textContent = `${poi.name}を選択しました`;
        document.body.appendChild(srNotification);
        setTimeout(() => document.body.removeChild(srNotification), 3000);
      } catch (error) {
        console.error('マーカー選択時にエラーが発生しました:', error);
      }
    },
    [mapInstance, actions.setSelectedPoi],
  );

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

          <Map
            onLoad={actions.handleMapLoad}
            pois={allPois}
            selectedPoi={selectedPoi}
            onMarkerClick={handleMarkerClick}
          />

          <MapControls
            onResetNorth={resetNorth}
            onGetCurrentLocation={handleGetCurrentLocation}
            onFitMarkers={handleFitMarkers}
          />

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
