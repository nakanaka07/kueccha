import { useCallback } from 'react';

export const useMapNorthControl = (map: google.maps.Map | null) => {
  const resetNorth = useCallback(() => {
    if (map) {
      map.setHeading(0);
    }
  }, [map]);

  return { resetNorth };
};
