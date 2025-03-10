import { CONFIG } from '../constants/config';
import { handleGeolocationError } from '../utils/errorHandling';
import type { GeolocationError, LatLngLiteral } from '../types/common';

export const GeolocationService = {
  getCurrentPosition: (
    callbacks: {
      onSuccess: (location: LatLngLiteral) => void;
      onError: (error: GeolocationError) => void;
    },
    options?: Partial<typeof CONFIG.maps.geolocation>,
  ): void => {
    if (!navigator.geolocation) {
      callbacks.onError({
        code: -1,
        message: 'このブラウザでは位置情報がサポートされていません。',
      });
      return;
    }

    const geolocationOptions = {
      enableHighAccuracy: CONFIG.maps.geolocation.highAccuracy,
      timeout: CONFIG.maps.geolocation.timeout,
      maximumAge: CONFIG.maps.geolocation.maxAge,
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LatLngLiteral = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        callbacks.onSuccess(location);
      },
      (error) => {
        console.warn(`位置情報エラー [${error.code}]`, error);
        callbacks.onError(handleGeolocationError(error));
      },
      geolocationOptions,
    );
  },

  watchPosition: (
    callbacks: {
      onSuccess: (location: LatLngLiteral) => void;
      onError: (error: GeolocationError) => void;
    },
    options?: Partial<typeof CONFIG.maps.geolocation>,
  ): number => {
    if (!navigator.geolocation) {
      callbacks.onError({
        code: -1,
        message: 'このブラウザでは位置情報がサポートされていません。',
      });
      return -1;
    }

    const geolocationOptions = {
      enableHighAccuracy: CONFIG.maps.geolocation.highAccuracy,
      timeout: CONFIG.maps.geolocation.timeout,
      maximumAge: CONFIG.maps.geolocation.maxAge,
      ...options,
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        const location: LatLngLiteral = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        callbacks.onSuccess(location);
      },
      (error) => {
        console.warn(`位置情報エラー [${error.code}]`, error);
        callbacks.onError(handleGeolocationError(error));
      },
      geolocationOptions,
    );
  },

  clearWatch: (watchId: number): void => {
    if (navigator.geolocation && watchId !== -1) {
      navigator.geolocation.clearWatch(watchId);
    }
  },
};
