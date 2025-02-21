import { useState, useEffect, useCallback } from 'react';
import {
  INITIAL_VISIBILITY,
  LOADING_DELAY,
  BACKGROUND_HIDE_DELAY,
} from '../utils/constants';
import { Poi, AreaType, LatLngLiteral } from '../utils/types';

export const useAppState = (pois: Poi[]) => {
  const [state, setState] = useState({
    isLoaded: false,
    isMapLoaded: false,
    selectedPoi: null as Poi | null,
    areaVisibility: INITIAL_VISIBILITY,
    currentLocation: null as LatLngLiteral | null,
    showWarning: false,
  });

  useEffect(() => {
    const timer = setTimeout(
      () => setState((prev) => ({ ...prev, isLoaded: true })),
      LOADING_DELAY,
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (state.isLoaded && state.isMapLoaded) {
      const backgroundElement = document.querySelector('.initial-background');
      if (backgroundElement) {
        const timer = setTimeout(() => {
          backgroundElement.classList.add('hidden');
        }, BACKGROUND_HIDE_DELAY);
        return () => clearTimeout(timer);
      }
    }
  }, [state.isLoaded, state.isMapLoaded]);

  useEffect(() => {
    setState((prev) => ({ ...prev, selectedPoi: null }));
  }, [pois]);

  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setState((prev) => ({ ...prev, isMapLoaded: !!mapInstance }));
  }, []);

  const handleSearchResultClick = (poi: Poi) => {
    setState((prev) => ({ ...prev, selectedPoi: poi }));
  };

  return {
    ...state,
    actions: {
      setSelectedPoi: (poi: Poi | null) =>
        setState((prev) => ({ ...prev, selectedPoi: poi })),
      setAreaVisibility: (visibility: Record<AreaType, boolean>) =>
        setState((prev) => ({ ...prev, areaVisibility: visibility })),
      setCurrentLocation: (location: LatLngLiteral | null) =>
        setState((prev) => ({ ...prev, currentLocation: location })),
      setShowWarning: (show: boolean) =>
        setState((prev) => ({ ...prev, showWarning: show })),
      handleMapLoad,
      handleSearchResultClick,
    },
  };
};
