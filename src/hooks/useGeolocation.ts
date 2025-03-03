import { useCallback } from 'react';
import { ERROR_MESSAGES, MAPS_CONFIG } from '../utils/constants';
import type { LatLngLiteral } from '../utils/types';

type GeolocationOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
};

export const useGeolocation = () => {
  const getCurrentPosition = useCallback(
    (
      callbacks: {
        onSuccess: (location: LatLngLiteral) => void;
        onError: (error: string) => void;
      },
      options?: GeolocationOptions,
    ) => {
      // デフォルト設定をconstantsから取得し、オプションでオーバーライド可能に
      const geolocationOptions = {
        enableHighAccuracy: MAPS_CONFIG.geolocation.highAccuracy,
        timeout: MAPS_CONFIG.geolocation.timeout,
        maximumAge: MAPS_CONFIG.geolocation.maxAge,
        ...options,
      };

      if (!navigator.geolocation) {
        callbacks.onError('このブラウザでは位置情報がサポートされていません。');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          callbacks.onSuccess(location);
        },
        (error) => {
          let errorMessage;

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = ERROR_MESSAGES.GEOLOCATION.PERMISSION_DENIED;
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = ERROR_MESSAGES.GEOLOCATION.POSITION_UNAVAILABLE;
              break;
            case error.TIMEOUT:
              errorMessage = ERROR_MESSAGES.GEOLOCATION.TIMEOUT;
              break;
            default:
              errorMessage = ERROR_MESSAGES.GEOLOCATION.UNKNOWN;
              break;
          }

          callbacks.onError(errorMessage);
        },
        geolocationOptions,
      );
    },
    [],
  );

  return { getCurrentPosition };
};
