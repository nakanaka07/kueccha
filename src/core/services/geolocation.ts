import { CONFIG } from '../../constants/config';
import { ERROR_MESSAGES } from '../../constants/messages';
import type { GeolocationError, LatLngLiteral } from '../../types/common';

/**
 * 位置情報取得のためのサービス
 */
export const GeolocationService = {
  /**
   * 現在の位置情報を取得する
   *
   * @param callbacks - 成功・失敗時のコールバック関数
   * @param options - Geolocation APIのオプション（省略可）
   */
  getCurrentPosition: (
    callbacks: {
      onSuccess: (location: LatLngLiteral) => void;
      onError: (error: GeolocationError) => void;
    },
    options?: Partial<typeof CONFIG.maps.geolocation>,
  ): void => {
    // ブラウザのgeolocation APIが利用可能か確認
    if (!navigator.geolocation) {
      callbacks.onError({
        code: -1,
        message: 'このブラウザでは位置情報がサポートされていません。',
      });
      return;
    }

    // CONFIG設定と引数のオプションをマージ
    const geolocationOptions = {
      enableHighAccuracy: CONFIG.maps.geolocation.highAccuracy,
      timeout: CONFIG.maps.geolocation.timeout,
      maximumAge: CONFIG.maps.geolocation.maxAge,
      ...options,
    };

    // 位置情報を取得
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

        // エラーコードに応じたメッセージを設定
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

  /**
   * 位置情報の監視を開始する
   */
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
        // エラーハンドリングは getCurrentPosition と同じロジックを使用
        let message: string;
        let details: string | undefined;

        // エラーコードに応じたメッセージを設定
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

  /**
   * 位置情報の監視を停止する
   */
  clearWatch: (watchId: number): void => {
    if (navigator.geolocation && watchId !== -1) {
      navigator.geolocation.clearWatch(watchId);
    }
  },
};
