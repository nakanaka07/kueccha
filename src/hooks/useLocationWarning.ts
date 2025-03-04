import { useState, useCallback } from 'react';
import { useGeolocation } from '../features/map';
import type { LatLngLiteral, GeolocationError } from '../types/common';

export const useLocationWarning = () => {
  const [locationState, setLocationState] = useState({
    currentLocation: null as LatLngLiteral | null,
    error: null as string | null,
    showWarning: false,
  });

  const { getCurrentPosition } = useGeolocation();

  // 成功ハンドラを共通化
  const handleLocationSuccess = useCallback((location: LatLngLiteral) => {
    setLocationState((prev) => ({
      ...prev,
      currentLocation: location,
      showWarning: true,
      error: null,
    }));
  }, []);

  // エラーハンドラをGeolocationError型に対応
  const handleLocationError = useCallback((error: GeolocationError) => {
    console.warn(`位置情報エラー: ${error.message}`);
    setLocationState((prev) => ({
      ...prev,
      error: error.message,
      currentLocation: null,
    }));
  }, []);

  const handleCurrentLocationChange = useCallback(
    (isChecked: boolean) => {
      if (isChecked) {
        getCurrentPosition({
          onSuccess: handleLocationSuccess,
          onError: handleLocationError,
        });
      } else {
        setLocationState({
          currentLocation: null,
          showWarning: false,
          error: null,
        });
      }
    },
    [getCurrentPosition, handleLocationSuccess, handleLocationError],
  );

  const getCurrentLocationInfo = useCallback(() => {
    getCurrentPosition({
      onSuccess: handleLocationSuccess,
      onError: handleLocationError,
    });
  }, [getCurrentPosition, handleLocationSuccess, handleLocationError]);

  // 分割代入で旧インターフェースと互換性を保つ
  const { currentLocation, error: locationError, showWarning } = locationState;
  const setShowWarning = useCallback((show: boolean) => {
    setLocationState((prev) => ({ ...prev, showWarning: show }));
  }, []);

  return {
    currentLocation,
    locationError,
    showWarning,
    setShowWarning,
    handleCurrentLocationChange,
    getCurrentLocationInfo,
  };
};
