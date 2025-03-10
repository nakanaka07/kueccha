import { useState, useCallback, useEffect } from 'react';
import type { AreaType } from '../../../core/types/common';
import type { Poi } from '../../../core/types/poi';

export function usePoiState(pois: Poi[]) {
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [filteredPois, setFilteredPois] = useState<Poi[]>(pois);

  useEffect(() => {
    setFilteredPois(pois);
  }, [pois]);

  const handleSelectPoi = useCallback((poi: Poi | null) => {
    setSelectedPoi(poi);
  }, []);

  const filterPois = useCallback(
    (areaVisibility: Record<AreaType, boolean>) => {
      const filtered = pois.filter((poi) => {
        if (!poi.area) return true;
        return areaVisibility[poi.area];
      });
      setFilteredPois(filtered);
    },
    [pois],
  );

  const clearSelectedPoi = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  return {
    pois,
    filteredPois,
    selectedPoi,
    setSelectedPoi: handleSelectPoi,
    clearSelectedPoi,
    filterPois,
  };
}
