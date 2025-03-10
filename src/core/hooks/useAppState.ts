import { useState, useCallback, useEffect } from 'react';
import { useCurrentLocation } from './useCurrentLocation';
import { useLoadingState } from './useLoadingState';
import { useLocationWarning } from './useLocationWarning';
import { useAreaVisibility } from '../../modules/filter/hooks/useAreaVisibility';
import { useMapState } from '../../modules/map/hooks/useMapState';
import { usePoiState } from '../../modules/poi/hooks/usePoiState';
import { CONFIG } from '../constants/config';
import { ERROR_MESSAGES } from '../constants/messages';
import { LOADING_DELAY } from '../constants/ui';
import type { AppError, LatLngLiteral } from '../types/common';
import type { Poi } from '../types/poi';

export const useAppState = (pois: Poi[]) => {
  const mapState = useMapState();
  const poiState = usePoiState(pois);
  const { areaVisibility, setAreaVisibility } = useAreaVisibility();
  const locationWarning = useLocationWarning();
  const [error, setError] = useState<AppError | null>(null);

  const { isVisible, isFading } = useLoadingState(mapState.isLoading, mapState.isMapLoaded, LOADING_DELAY || 5000);

  const { currentLocation, isLocating, locationError, getCurrentLocationInfo } = useCurrentLocation();

  const retryMapLoad = useCallback(() => {
    if (!mapState.isMapLoaded && mapState.mapInstance) {
      mapState.handleMapLoad(mapState.mapInstance);
    } else if (mapState.isMapLoaded) {
      getCurrentLocationInfo();
    }
  }, [mapState, getCurrentLocationInfo]);

  useEffect(() => {
    if (mapState.isMapLoaded && !currentLocation && !error) {
      getCurrentLocationInfo();
    }
  }, [mapState.isMapLoaded, currentLocation, getCurrentLocationInfo, error]);

  useEffect(() => {
    if (!mapState.isMapLoaded && !mapState.isLoading && !error) {
      setError({
        message: ERROR_MESSAGES.MAP.LOAD_FAILED,
        code: 'MAP_LOADING_ERROR',
      });
    }
  }, [mapState.isMapLoaded, mapState.isLoading, error]);

  return {
    ...mapState,
    ...poiState,
    isMapLoaded: mapState.isMapLoaded,
    areaVisibility,
    setAreaVisibility,
    ...locationWarning,
    isMapLoading: mapState.isLoading,
    error,
    currentLocation,
    locationError,
    isLocating,
    loading: {
      isVisible,
      isFading,
    },
    actions: {
      handleMapLoad: mapState.handleMapLoad,
      setSelectedPoi: poiState.setSelectedPoi,
      retryMapLoad,
      getUserLocation: getCurrentLocationInfo,
    },
  };
};
