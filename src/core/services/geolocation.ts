/**
 * 機能: ブラウザの位置情報APIをラップした位置情報サービス
 * 依存関係:
 *   - Web Geolocation API
 *   - CONFIG設定 (config.ts)
 *   - エラーメッセージ定数 (messages.ts)
 * 注意点:
 *   - ユーザーが位置情報の使用を許可する必要があります
 *   - モバイルデバイスでは精度が向上しますが、バッテリー消費が増加します
 *   - タイムアウトやエラー処理が実装されています
 *   - 屋内や地下では精度が低下する可能性があります
 */
import { CONFIG } from '../../constants/config';
import { ERROR_MESSAGES } from '../../constants/messages';
import type { GeolocationError, LatLngLiteral } from '../../types/common';

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
        let message: string;
        let details: string | undefined;

        switch (error.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            message = ERROR_MESSAGES.GEOLOCATION.PERMISSION_DENIED;
            details = '位置情報の使用が許可されていません。ブラウザの設定を確認してください。';
            break;
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            message = ERROR_MESSAGES.GEOLOCATION.POSITION_UNAVAILABLE;
            details = '位置情報を取得できませんでした。ネットワーク接続を確認してください。';
            break;
          case GeolocationPositionError.TIMEOUT:
            message = ERROR_MESSAGES.GEOLOCATION.TIMEOUT;
            details = `位置情報の取得がタイムアウトしました（${CONFIG.maps.geolocation.timeout}ms）。`;
            break;
          default:
            message = ERROR_MESSAGES.GEOLOCATION.UNKNOWN;
            details = error.message || '詳細不明のエラーが発生しました。';
            break;
        }

        console.warn(`位置情報エラー [${error.code}]: ${message}`, error);
        callbacks.onError({ code: error.code, message, details });
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
        let message: string;
        let details: string | undefined;

        switch (error.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            message = ERROR_MESSAGES.GEOLOCATION.PERMISSION_DENIED;
            details = '位置情報の使用が許可されていません。ブラウザの設定を確認してください。';
            break;
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            message = ERROR_MESSAGES.GEOLOCATION.POSITION_UNAVAILABLE;
            details = '位置情報を取得できませんでした。ネットワーク接続を確認してください。';
            break;
          case GeolocationPositionError.TIMEOUT:
            message = ERROR_MESSAGES.GEOLOCATION.TIMEOUT;
            details = `位置情報の取得がタイムアウトしました（${CONFIG.maps.geolocation.timeout}ms）。`;
            break;
          default:
            message = ERROR_MESSAGES.GEOLOCATION.UNKNOWN;
            details = error.message || '詳細不明のエラーが発生しました。';
            break;
        }

        console.warn(`位置情報エラー [${error.code}]: ${message}`, error);
        callbacks.onError({ code: error.code, message, details });
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
