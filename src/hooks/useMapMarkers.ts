import { useCallback } from 'react';
import type { AreaType } from './common';

export function useMapMarkers() {
  const getMarkerZIndex = useCallback((areaType: AreaType): number => {
    switch (areaType) {
      case 'RECOMMEND':
        return 100;
      case 'CURRENT_LOCATION':
        return 90;
      default:
        return 10;
    }
  }, []);

  return { getMarkerZIndex };
}
