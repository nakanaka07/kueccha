import { handleGeolocationError } from './errorUtils';
import { CONFIG } from '../constants/config.constants';
import type { LatLngLiteral } from '../types/common.types';
import type { GeolocationError } from '../types/error.types';

/**
 * 位置情報サービス
 * - ブラウザのGeolocation APIのラッピング
 * - 現在位置の取得と監視機能
 * - 位置情報エラーのハンドリングと変換
 * - 高精度モードや位置情報取得のタイムアウト設定
 */
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
