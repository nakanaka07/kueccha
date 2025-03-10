import { useState, useCallback } from 'react';
import { useCurrentLocation } from './useCurrentLocation';
import { useGeolocation } from '../../modules/map';
import type { LatLngLiteral, GeolocationError } from '../../core/types/common';

// 後方互換性のために既存のフック名を維持
export function useLocationWarning() {
  const { showWarning, setShowWarning, locationError, clearError } = useCurrentLocation();
  return {
    showWarning,
    setShowWarning,
    locationError,
    clearError,
  };
}
