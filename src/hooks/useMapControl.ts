/**
 * マップ操作カスタムフック
 *
 * Google Mapsのマップ操作機能（向きのリセット、現在地取得など）を提供します。
 */

import { useCallback } from 'react';

import { ERROR_MESSAGES } from '../constants/constants';

import type { LatLngLiteral } from '../types/types';

/**
 * 位置情報取得の設定
 */
const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true, // 高精度の位置情報を取得
  timeout: 10000, // タイムアウト時間（ミリ秒）
  maximumAge: 0, // キャッシュを使用せず常に新しい位置情報を取得
} as const;

/**
 * マップ操作フック
 * マップの向きを北にリセットする機能や現在地を取得する機能を提供します。
 *
 * @param map - Google Maps のマップインスタンス
 * @returns マップ操作関数を含むオブジェクト
 */
export const useMapControl = (map: google.maps.Map | null) => {
  /**
   * マップの向きを北にリセットする関数
   */
  const resetNorth = useCallback(() => {
    if (map) {
      map.setHeading(0);
    }
  }, [map]);

  /**
   * 現在地を取得する関数
   *
   * @param callbacks - 成功時とエラー時のコールバック関数
   */
  const handleGetCurrentLocation = useCallback(
    (callbacks: {
      onSuccess: (location: LatLngLiteral) => void;
      onError: (error: string) => void;
    }) => {
      // ブラウザが位置情報APIをサポートしているか確認
      if (!navigator.geolocation) {
        callbacks.onError('このブラウザでは位置情報がサポートされていません。');
        return;
      }

      // 位置情報の取得を試行
      navigator.geolocation.getCurrentPosition(
        // 成功時のコールバック
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          callbacks.onSuccess(location);
        },

        // エラー時のコールバック
        (error) => {
          let errorMessage: string;

          // エラーコードに応じたメッセージを設定
          switch (error.code) {
            case GeolocationPositionError.PERMISSION_DENIED:
              errorMessage = ERROR_MESSAGES.GEOLOCATION.PERMISSION_DENIED;
              break;
            case GeolocationPositionError.POSITION_UNAVAILABLE:
              errorMessage = ERROR_MESSAGES.GEOLOCATION.POSITION_UNAVAILABLE;
              break;
            case GeolocationPositionError.TIMEOUT:
              errorMessage = ERROR_MESSAGES.GEOLOCATION.TIMEOUT;
              break;
            default:
              errorMessage = ERROR_MESSAGES.GEOLOCATION.UNKNOWN;
          }
          callbacks.onError(errorMessage);
        },
      );
    },
    [map],
  );

  return { resetNorth, handleGetCurrentLocation };
};
