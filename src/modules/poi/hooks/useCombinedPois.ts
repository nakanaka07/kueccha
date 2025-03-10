import { useMemo } from 'react';
import { CURRENT_LOCATION_POI } from '../../../core/constants/areas';
import type { Poi } from '../../../core/types/poi';

export function useCombinedPois(
  pois: Poi[] | null | undefined,
  currentLocationPoi: Poi | null | undefined,
  showCurrentLocation = true,
): Poi[] {
  return useMemo(() => {
    if (!pois || pois.length === 0) {
      return showCurrentLocation && currentLocationPoi ? [currentLocationPoi] : [];
    }

    if (!showCurrentLocation || !currentLocationPoi) {
      return [...pois];
    }

    const hasCurrentLocationId = pois.some((poi) => poi.id === currentLocationPoi.id);

    if (hasCurrentLocationId) {
      return pois.map((poi) => (poi.id === currentLocationPoi.id ? currentLocationPoi : poi));
    }

    return [currentLocationPoi, ...pois];
  }, [pois, currentLocationPoi, showCurrentLocation]);
}

export function createCurrentLocationPoi(location: { lat: number; lng: number }): Poi {
  return {
    ...CURRENT_LOCATION_POI,
    location: {
      lat: location.lat,
      lng: location.lng,
    },
  };
}
