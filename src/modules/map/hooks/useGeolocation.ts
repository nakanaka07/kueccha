import { useCallback } from 'react';
import { CONFIG } from '../../../core/constants/config';
import { GeolocationService } from '../../../core/services/geolocation';
import type { GeolocationError, LatLngLiteral } from '../../../core/types/common';

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
