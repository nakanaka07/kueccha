import { useState, useCallback } from 'react';

import { ERROR_MESSAGES } from '../constants/constants';
import type { LatLngLiteral } from '../types/types';

/**
 * 現在位置の取得と管理を行うカスタムフック
 */
const useCurrentLocation = (setShowWarning: (show: boolean) => void) => {
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 現在地の表示/非表示を切り替える
  const handleCurrentLocationChange = useCallback(
    (isChecked: boolean) => {
      if (!isChecked) {
        setCurrentLocation(null);
        setShowWarning(false);
        setLocationError(null);
        return;
      }

      // 位置情報を取得
      navigator.geolocation.getCurrentPosition(
        // 成功時
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setShowWarning(true);
          setLocationError(null);
        },
        // エラー時
        (error) => {
          const errorCode = error.code;
          const errorMessages = ERROR_MESSAGES.GEOLOCATION;

          const errorMap: Record<number, string> = {
            [GeolocationPositionError.PERMISSION_DENIED]: errorMessages.PERMISSION_DENIED,
            [GeolocationPositionError.POSITION_UNAVAILABLE]: errorMessages.POSITION_UNAVAILABLE,
            [GeolocationPositionError.TIMEOUT]: errorMessages.TIMEOUT,
          };

          setLocationError(errorMap[errorCode] || errorMessages.UNKNOWN);
        },
        // オプション
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    },
    [setShowWarning],
  );

  return { currentLocation, locationError, handleCurrentLocationChange };
};

export default useCurrentLocation;
