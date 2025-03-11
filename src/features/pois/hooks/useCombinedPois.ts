import { useMemo } from 'react';
import { useCurrentLocation } from '../../../core/hooks/useCurrentLocation';
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

// createCurrentLocationPoi関数は削除し、代わりにuseCurrentLocation.tsのcurrentLocationPoiを使用する
