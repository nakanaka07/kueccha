import { useState, useCallback, useEffect } from 'react';
import { createError } from '../service/errorUtils';
import type { AppError } from '../types/error.types';
import type { Poi } from '../types/poi.types';

export function useAppState() {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<AppError | null>(null);

  const [loading, setLoading] = useState({
    isVisible: true,
    isFading: false,
  });

  const actions = {
    setMapInstance,
    setIsMapLoaded,
    setIsMapLoading,
    setMapError,
  };

  useEffect(() => {}, [isMapLoaded, isMapLoading]);

  return {
    mapInstance,
    isMapLoaded,
    isMapLoading,
    loading,
    error: mapError,
    actions,
  };
}
