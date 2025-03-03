import { useState, useCallback } from 'react';
import { useAreaVisibility } from './useAreaVisibility';
import { useLoadingState } from './useLoadingState';
import { useLocationWarning } from './useLocationWarning';
import { useMapState } from './useMapState';
import { usePoiState } from './usePoiState';
import type { Poi } from '../utils/types';

export const useAppState = (pois: Poi[]) => {
  const mapState = useMapState();
  const poiState = usePoiState(pois);
  const { areaVisibility, setAreaVisibility } = useAreaVisibility();
  const locationWarning = useLocationWarning();
  const [error, setError] = useState<Error | null>(null);

  const { isVisible, isFading } = useLoadingState(mapState.isLoading, mapState.isMapLoaded, 5000);

  const retryMapLoad = useCallback(() => {
    setError(null);
  }, []);

  return {
    ...mapState,
    ...poiState,
    isMapLoaded: mapState.isMapLoaded,
    areaVisibility,
    setAreaVisibility,
    ...locationWarning,
    isMapLoading: mapState.isLoading,
    error,
    loading: {
      isVisible,
      isFading,
    },
    actions: {
      handleMapLoad: mapState.handleMapLoad,
      setSelectedPoi: poiState.setSelectedPoi,
      retryMapLoad,
    },
  };
};
