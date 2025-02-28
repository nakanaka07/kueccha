import { useCallback } from 'react';
import type { LatLngLiteral } from '../utils/types';

/**
 * Geolocation APIを使って現在地を取得する基本機能を提供するカスタムフック
 *
 * このフックは、現在地取得のコアロジックを提供します。ステート管理は行わず、
 * コールバック関数経由で結果を返します。より高レベルな機能はuseCurrentLocationフックを使用してください。
 *
 * @returns {Object} 位置情報取得関数を含むオブジェクト
 *   @property {function} getCurrentPosition - 現在位置を取得する関数
 *
 * @example
 * function LocationButton() {
 *   const { getCurrentPosition } = useGeolocation();
 *
 *   const handleClick = () => {
 *     getCurrentPosition({
 *       onSuccess: (location) => console.log("現在地:", location),
 *       onError: (error) => console.error(error)
 *     });
 *   };
 *
 *   return <button onClick={handleClick}>現在地を取得</button>;
 * }
 *
 * @remarks
 * - ブラウザのGeolocation APIを利用するため、ユーザーの許可が必要です
 * - 高精度の位置情報を使用し、10秒のタイムアウトが設定されています
 */
export const useGeolocation = () => {
  const getCurrentPosition = useCallback(
    (callbacks: { onSuccess: (location: LatLngLiteral) => void; onError: (error: string) => void }) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            callbacks.onSuccess(location);
          },
          (error) => {
            let errorMessage = '現在地の取得に失敗しました。';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = '位置情報の取得が許可されていません。';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = '位置情報が利用できません。';
                break;
              case error.TIMEOUT:
                errorMessage = '位置情報の取得がタイムアウトしました。';
                break;
              default:
                errorMessage = '未知のエラーが発生しました。';
                break;
            }
            callbacks.onError(errorMessage);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          },
        );
      } else {
        callbacks.onError('このブラウザでは位置情報がサポートされていません。');
      }
    },
    [],
  );

  return { getCurrentPosition };
};
