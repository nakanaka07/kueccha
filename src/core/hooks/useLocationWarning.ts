/**
 * 機能: 位置情報取得とその警告表示を管理するカスタムフック
 * 依存関係:
 *   - React hooks (useState, useCallback)
 *   - useGeolocation（位置情報取得用カスタムフック）
 *   - LatLngLiteral, GeolocationError 型定義
 * 注意点:
 *   - ブラウザの位置情報APIに依存するため、ユーザー許可が必要
 *   - エラー処理を含む（権限拒否、タイムアウトなど）
 *   - モバイルとデスクトップで動作精度が異なる場合あり
 *   - 位置情報の取得状態と表示制御を統合管理
 */
import { useState, useCallback } from 'react';
import { useGeolocation } from '../../modules/map';
import type { LatLngLiteral, GeolocationError } from '../../types/common';

export const useLocationWarning = () => {
  const [locationState, setLocationState] = useState({
    currentLocation: null as LatLngLiteral | null,
    error: null as string | null,
    showWarning: false,
  });

  const { getCurrentPosition } = useGeolocation();

  const handleLocationSuccess = useCallback((location: LatLngLiteral) => {
    setLocationState((prev) => ({
      ...prev,
      currentLocation: location,
      showWarning: true,
      error: null,
    }));
  }, []);

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
