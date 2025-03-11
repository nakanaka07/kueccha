import React from 'react';
import MapContainer from '../../../modules/map/components/MapContainer';
import MapControls from '../../../modules/map/components/MapControls';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingFallback } from './LoadingFallback';
import { LocationWarning } from '../ui/LocationWarning';
import type { Poi } from '../../../core/types/poi';

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
    <div>
      <ErrorBoundary>
        <div>
          {isLoadingVisible && (
            <LoadingFallback
              isLoading={!combinedError}
              isLoaded={false}
              error={combinedError ? new Error(errorMessage) : null}
              message={loadingMessage}
              variant="spinner"
              isFading={isFading}
              onRetry={combinedError ? actions.retryMapLoad : undefined}
            />
          )}

          {isMapLoaded && <div aria-live="polite">マップが読み込まれました</div>}

          <MapContainer onLoad={actions.handleMapLoad} pois={allPois} selectedPoi={selectedPoi} />

          <MapControls onResetNorth={resetNorth} onGetCurrentLocation={handleGetCurrentLocation} />

          {showWarning && <LocationWarning onClose={() => setShowWarning(false)} />}
        </div>
      </ErrorBoundary>
    </div>
  );
};
