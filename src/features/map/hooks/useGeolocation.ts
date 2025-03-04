import { useCallback } from 'react';
import { CONFIG } from '../../../constants/config';
import { GeolocationService } from '../../../services/geolocation';
import type { GeolocationError, LatLngLiteral } from '../../../types/common';

/**
 * 位置情報取得のカスタムフック
 *
 * @returns getCurrentPosition - 現在位置を取得する関数
 */
export const useGeolocation = () => {
  /**
   * 現在の位置情報を取得する
   */
  const getCurrentPosition = useCallback(
    (
      callbacks: {
        onSuccess: (location: LatLngLiteral) => void;
        onError: (error: GeolocationError) => void;
      },
      options?: Partial<typeof CONFIG.maps.geolocation>,
    ) => {
      // サービスにロジックを委譲
      GeolocationService.getCurrentPosition(callbacks, options);
    },
    [],
  );

  /**
   * 位置情報の監視を開始する
   */
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

  /**
   * 位置情報の監視を停止する
   */
  const clearWatch = useCallback((watchId: number) => {
    GeolocationService.clearWatch(watchId);
  }, []);

  return {
    getCurrentPosition,
    watchPosition,
    clearWatch,
  };
};
