import { useState, useEffect, useCallback } from 'react';
import { INITIAL_VISIBILITY } from '../utils/constants'; // LOADING_DELAY を削除
import type { Poi, AreaType, LatLngLiteral } from '../utils/types';

export const useAppState = (pois: Poi[]) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [areaVisibility] =
    useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY);
  const [currentLocation] = useState<LatLngLiteral | null>(null);
  const [showWarning] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const handleMapLoad = useCallback(
    (map: google.maps.Map | null) => {
      console.log('Map load handler called:', {
        hasMap: !!map,
        currentIsLoaded: isMapLoaded,
      });

      if (map) {
        setMapInstance(map);
        setIsMapLoaded(true);
      }
    },
    [isMapLoaded],
  );

  const handleSearchResultClick = useCallback((poi: Poi) => {
    setSelectedPoi(poi);
  }, []);

  useEffect(() => {
    if (pois.length > 0) {
      setIsLoaded(true);
    }
  }, [pois]);

  useEffect(() => {
    console.log('Map state updated:', {
      mapInstance,
      isMapLoaded,
    });
  }, [mapInstance, isMapLoaded]);

  useEffect(() => {
    console.log('Map state updated in useAppState:', {
      isMapLoaded,
      mapInstance: !!mapInstance,
    });
  }, [isMapLoaded, mapInstance]);

  // 状態変更を監視するuseEffect追加
  useEffect(() => {
    console.log('Map state updated:', {
      isMapLoaded,
      hasMapInstance: !!mapInstance,
    });
  }, [isMapLoaded, mapInstance]);

  return {
    isLoaded,
    isMapLoaded,
    selectedPoi,
    areaVisibility,
    currentLocation,
    showWarning,
    mapInstance,
    actions: {
      handleMapLoad,
      handleSearchResultClick,
    },
  };
};
