import { useState, useCallback } from 'react';

export const useMapState = () => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    setIsMapLoaded(true);
    setIsLoading(false);
  }, []);

  return { isMapLoaded, isLoading, mapInstance, handleMapLoad };
};
