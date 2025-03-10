import { useMemo } from 'react';
import { CURRENT_LOCATION_POI } from '../../../core/constants/areas';
import type { Poi, LatLngLiteral } from '../../../core/types/poi';

export function useCurrentLocationPoi(currentLocation: LatLngLiteral | null): Poi | null {
  return useMemo(() => {
    if (!currentLocation) return null;

    const isValidLatitude = currentLocation.lat >= -90 && currentLocation.lat <= 90;
    const isValidLongitude = currentLocation.lng >= -180 && currentLocation.lng <= 180;

    if (!isValidLatitude || !isValidLongitude) {
      console.warn('不正な座標データが検出されました:', currentLocation);
      return null;
    }

    return {
      ...CURRENT_LOCATION_POI,
      location: {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      },
    };
  }, [currentLocation?.lat, currentLocation?.lng]);
}
