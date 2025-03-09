/**
 * 機能: 位置情報サービスの状態と操作を管理するReactコンテキスト
 * 依存関係:
 *   - React (createContext, useContext, useState, useCallback)
 *   - ../../constants/config からのCONFIG設定
 *   - ../../constants/messages からのERROR_MESSAGES
 *   - ../../types/common からのLatLngLiteral, AppError型
 *   - Geolocation Web API
 * 注意点:
 *   - 位置情報の取得には利用者の許可が必要
 *   - エラーの種類（権限拒否、位置情報取得不可、タイムアウトなど）に応じた処理を提供
 *   - 権限拒否時は警告表示オプションあり
 *   - Geolocation APIがサポートされていない環境ではエラーを返す
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CONFIG } from '../../constants/config';
import { ERROR_MESSAGES } from '../../constants/messages';
import type { LatLngLiteral, AppError } from '../../types/common';

interface GeolocationState {
  currentLocation: LatLngLiteral | null;
  isLocating: boolean;
  error: AppError | null;
  showWarning: boolean;
}

interface GeolocationContextType {
  state: GeolocationState;
  getCurrentLocation: () => Promise<LatLngLiteral | null>;
  clearGeolocationError: () => void;
  setShowWarning: (show: boolean) => void;
}

export const GeolocationContext = createContext<GeolocationContextType | null>(null);

export const GeolocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GeolocationState>({
    currentLocation: null,
    isLocating: false,
    error: null,
    showWarning: false,
  });

  const getCurrentLocation = useCallback(async (): Promise<LatLngLiteral | null> => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: {
          message: ERROR_MESSAGES.GEOLOCATION.UNKNOWN,
          code: 'GEOLOCATION_NOT_SUPPORTED',
        },
      }));
      return null;
    }

    setState((prev) => ({ ...prev, isLocating: true, error: null }));

    const geolocationOptions = {
      timeout: CONFIG.maps.geolocation.timeout,
      maximumAge: CONFIG.maps.geolocation.maxAge,
      enableHighAccuracy: CONFIG.maps.geolocation.highAccuracy,
    };

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, geolocationOptions);
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setState((prev) => ({
        ...prev,
        currentLocation: location,
        isLocating: false,
      }));

      return location;
    } catch (error) {
      let errorMessage = ERROR_MESSAGES.GEOLOCATION.UNKNOWN;
      let errorCode = 'GEOLOCATION_UNKNOWN_ERROR';

      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = ERROR_MESSAGES.GEOLOCATION.PERMISSION_DENIED;
            errorCode = 'GEOLOCATION_PERMISSION_DENIED';
            setState((prev) => ({ ...prev, showWarning: true }));
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = ERROR_MESSAGES.GEOLOCATION.POSITION_UNAVAILABLE;
            errorCode = 'GEOLOCATION_POSITION_UNAVAILABLE';
            break;
          case error.TIMEOUT:
            errorMessage = ERROR_MESSAGES.GEOLOCATION.TIMEOUT;
            errorCode = 'GEOLOCATION_TIMEOUT';
            break;
        }
      }

      setState((prev) => ({
        ...prev,
        isLocating: false,
        error: { message: errorMessage, code: errorCode },
      }));

      return null;
    }
  }, []);

  const clearGeolocationError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const setShowWarning = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showWarning: show }));
  }, []);

  return (
    <GeolocationContext.Provider
      value={{
        state,
        getCurrentLocation,
        clearGeolocationError,
        setShowWarning,
      }}
    >
      {children}
    </GeolocationContext.Provider>
  );
};

export const useGeolocationContext = () => {
  const context = useContext(GeolocationContext);
  if (!context) {
    throw new Error('useGeolocationContext must be used within a GeolocationProvider');
  }
  return context;
};
