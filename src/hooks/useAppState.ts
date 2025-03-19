import { useState, useEffect, useCallback } from 'react';

import { INITIAL_VISIBILITY } from '../constants/constants';

import type { Poi, AreaType, LatLngLiteral } from '../types/types';

export const useAppState = (pois: Poi[]) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [areaVisibility, setAreaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY);
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const handleMapLoad = useCallback((map: google.maps.Map | null) => {
    if (map) {
      setMapInstance(map);
      setIsMapLoaded(true);
    }
  }, []);

  const handleSearchResultClick = useCallback((poi: Poi) => {
    setSelectedPoi(poi);
  }, []);

  useEffect(() => {
    if (pois.length > 0) {
      setIsLoaded(true);
    }
  }, [pois]);

  return {
    isLoaded,
    isMapLoaded,
    selectedPoi,
    setSelectedPoi,
    areaVisibility,
    setAreaVisibility,
    currentLocation,
    setCurrentLocation,
    showWarning,
    setShowWarning,
    mapInstance,
    actions: {
      handleMapLoad,
      handleSearchResultClick,
      setSelectedPoi,
    },
  };
};
