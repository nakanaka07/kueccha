import React, { createContext, useContext, useMemo } from 'react';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import type { LatLngLiteral, AppError } from '../types/common';

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
  const {
    currentLocation,
    isLocating,
    locationError,
    showWarning,
    setShowWarning,
    getCurrentLocationInfo,
    clearError,
  } = useCurrentLocation();

  // コンテキスト値の変換
  const contextValue = useMemo(
    () => ({
      state: {
        currentLocation,
        isLocating,
        error: locationError
          ? {
              message: locationError.message,
              code: String(locationError.code),
              details: locationError.details,
            }
          : null,
        showWarning,
      },
      getCurrentLocation: async () => {
        getCurrentLocationInfo();
        return currentLocation;
      },
      clearGeolocationError: clearError,
      setShowWarning,
    }),
    [currentLocation, isLocating, locationError, showWarning, getCurrentLocationInfo, clearError],
  );

  return <GeolocationContext.Provider value={contextValue}>{children}</GeolocationContext.Provider>;
};

export const useGeolocationContext = () => {
  const context = useContext(GeolocationContext);
  if (!context) {
    throw new Error('useGeolocationContext must be used within a GeolocationProvider');
  }
  return context;
};
