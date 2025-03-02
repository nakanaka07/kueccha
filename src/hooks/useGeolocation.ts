import { useCallback } from 'react';
import type { LatLngLiteral } from '../utils/types';

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
