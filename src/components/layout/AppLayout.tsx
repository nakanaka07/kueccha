// components/layout/AppLayout.tsx
import React from 'react';
import styles from './AppLayout.module.css';
import { ErrorBoundary, LoadingIndicators, LocationWarning, Map, MapControls } from '../common';
import type { Poi } from '../../types/poi';

interface AppLayoutProps {
  isMapLoaded: boolean;
  isLoadingVisible: boolean;
  isFading: boolean;
  combinedError: boolean;
  errorMessage: string;
  loadingMessage: string;
  showWarning: boolean;
  allPois: Poi[];
  selectedPoi: Poi | null;
  actions: {
    handleMapLoad: (map: google.maps.Map) => void;
    retryMapLoad: () => void;
  };
  resetNorth: () => void;
  handleGetCurrentLocation: () => void;
  setShowWarning: (show: boolean) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  isMapLoaded,
  isLoadingVisible,
  isFading,
  combinedError,
  errorMessage,
  loadingMessage,
  showWarning,
  allPois,
  selectedPoi,
  actions,
  resetNorth,
  handleGetCurrentLocation,
  setShowWarning,
}) => {
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