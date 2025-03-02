import { useState, useEffect, useCallback } from 'react';
import type { Poi } from '../utils/types';

export const usePoiState = (pois: Poi[]) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  useEffect(() => {
    if (pois.length > 0) {
      setIsLoaded(true);
    }
  }, [pois]);

  const handleSearchResultClick = useCallback((poi: Poi) => {
    setSelectedPoi(poi);
  }, []);

  return { isLoaded, selectedPoi, setSelectedPoi, handleSearchResultClick };
};
