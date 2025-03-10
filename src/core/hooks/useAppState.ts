import { useState, useCallback, useEffect } from 'react';
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
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(null);

  const { isVisible, isFading } = useLoadingState(mapState.isLoading, mapState.isMapLoaded, LOADING_DELAY || 5000);

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        message: ERROR_MESSAGES.GEOLOCATION.UNKNOWN,
        code: 'GEOLOCATION_NOT_SUPPORTED',
      });
      return;
    }

    const geolocationOptions = {
      timeout: CONFIG.maps.geolocation.timeout,
      maximumAge: CONFIG.maps.geolocation.maxAge,
      enableHighAccuracy: CONFIG.maps.geolocation.highAccuracy,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (geoError) => {
        let errorMessage: string = ERROR_MESSAGES.GEOLOCATION.UNKNOWN;
        let errorCode = 'GEOLOCATION_UNKNOWN_ERROR';

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage = ERROR_MESSAGES.GEOLOCATION.PERMISSION_DENIED;
            errorCode = 'GEOLOCATION_PERMISSION_DENIED';
            locationWarning.setShowWarning(true);
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMessage = ERROR_MESSAGES.GEOLOCATION.POSITION_UNAVAILABLE;
            errorCode = 'GEOLOCATION_POSITION_UNAVAILABLE';
            break;
          case geoError.TIMEOUT:
            errorMessage = ERROR_MESSAGES.GEOLOCATION.TIMEOUT;
            errorCode = 'GEOLOCATION_TIMEOUT';
            break;
        }

        setError({ message: errorMessage, code: errorCode });
      },
      geolocationOptions,
    );
  }, [locationWarning]);

  const retryMapLoad = useCallback(() => {
    setError(null);
    if (mapState.isMapLoaded) {
      getUserLocation();
    } else {
      if (mapState.mapInstance) {
        mapState.handleMapLoad(mapState.mapInstance);
      } else {
        setError({
          message: ERROR_MESSAGES.MAP.LOAD_FAILED,
          code: 'MAP_INSTANCE_MISSING',
        });
      }
    }
  }, [mapState, getUserLocation]);

  useEffect(() => {
    if (mapState.isMapLoaded && !currentLocation && !error) {
      getUserLocation();
    }
  }, [mapState.isMapLoaded, currentLocation, getUserLocation, error]);

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
    loading: {
      isVisible,
      isFading,
    },
    actions: {
      handleMapLoad: mapState.handleMapLoad,
      setSelectedPoi: poiState.setSelectedPoi,
      retryMapLoad,
      getUserLocation,
    },
  };
};
