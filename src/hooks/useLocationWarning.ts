import { useState } from 'react';
import { useGeolocation } from './useGeolocation';
import type { LatLngLiteral } from '../utils/types';

export const useLocationWarning = () => {
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const { getCurrentPosition } = useGeolocation();

  const handleCurrentLocationChange = (isChecked: boolean) => {
    if (isChecked) {
      getCurrentPosition({
        onSuccess: (location) => {
          setCurrentLocation(location);
          setShowWarning(true);
          setLocationError(null);
        },
        onError: (errorMessage) => {
          setLocationError(errorMessage);
          setCurrentLocation(null);
        },
      });
    } else {
      setCurrentLocation(null);
      setShowWarning(false);
      setLocationError(null);
    }
  };

  const getCurrentLocationInfo = () => {
    getCurrentPosition({
      onSuccess: (location) => {
        setCurrentLocation(location);
        setShowWarning(true);
        setLocationError(null);
      },
      onError: (errorMessage) => {
        setLocationError(errorMessage);
        setCurrentLocation(null);
      },
    });
  };

  return {
    currentLocation,
    locationError,
    showWarning,
    setShowWarning,
    handleCurrentLocationChange,
    getCurrentLocationInfo,
  };
};
