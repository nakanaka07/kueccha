import { useCallback } from 'react';
import { CONFIG } from '../constants/config.constants';
import { GeolocationService } from '../service/geolocation.service';
import type { LatLngLiteral } from '../types/common.types';
import type { GeolocationError } from '../types/error.types';

export const useGeolocation = () => {
  const getCurrentPosition = useCallback(
    (
      callbacks: {
        onSuccess: (location: LatLngLiteral) => void;
        onError: (error: GeolocationError) => void;
      },
      options?: Partial<typeof CONFIG.maps.geolocation>,
    ) => {
      GeolocationService.getCurrentPosition(callbacks, options);
    },
    [],
  );

  const watchPosition = useCallback(
    (
      callbacks: {
        onSuccess: (location: LatLngLiteral) => void;
        onError: (error: GeolocationError) => void;
      },
      options?: Partial<typeof CONFIG.maps.geolocation>,
    ) => {
      return GeolocationService.watchPosition(callbacks, options);
    },
    [],
  );

  const clearWatch = useCallback((watchId: number) => {
    GeolocationService.clearWatch(watchId);
  }, []);

  return {
    getCurrentPosition,
    watchPosition,
    clearWatch,
  };
};