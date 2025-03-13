import { useState } from 'react';
import { ERROR_MESSAGES } from '../utils/constants';

const useCurrentLocation = (setShowWarning: (show: boolean) => void) => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleCurrentLocationChange = (isChecked: boolean) => {
    if (isChecked) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          setShowWarning(true);
          setLocationError(null);
        },
        (error) => {
          let errorMessage: string = ERROR_MESSAGES.GEOLOCATION.UNKNOWN;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = ERROR_MESSAGES.GEOLOCATION.PERMISSION_DENIED;
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = ERROR_MESSAGES.GEOLOCATION.POSITION_UNAVAILABLE;
              break;
            case error.TIMEOUT:
              errorMessage = ERROR_MESSAGES.GEOLOCATION.TIMEOUT;
              break;
            default:
              errorMessage = ERROR_MESSAGES.GEOLOCATION.UNKNOWN;
              break;
          }
          setLocationError(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    } else {
      setCurrentLocation(null);
      setShowWarning(false);
      setLocationError(null);
    }
  };

  return { currentLocation, locationError, handleCurrentLocationChange };
};

export default useCurrentLocation;
