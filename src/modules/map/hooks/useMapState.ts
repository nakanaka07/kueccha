import { useState, useCallback, useEffect } from 'react';
import { CONFIG } from '../../../core/constants/config';
import { ERROR_MESSAGES } from '../../../core/constants/messages';
import { LatLngLiteral, AppError } from '../../../core/types/common';

export interface MapState {
  isMapLoaded: boolean;
  isLoading: boolean;
  mapInstance: google.maps.Map | null;
  center: LatLngLiteral;
  zoom: number;
  error: AppError | null;
  handleMapLoad: (map: google.maps.Map) => void;
  setCenter: (center: LatLngLiteral) => void;
  setZoom: (zoom: number) => void;
  resetView: () => void;
}

export const useMapState = (): MapState => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [center, setCenter] = useState<LatLngLiteral>(CONFIG.maps.defaultCenter);
  const [zoom, setZoom] = useState<number>(CONFIG.maps.defaultZoom);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    try {
      setMapInstance(map);
      setIsMapLoaded(true);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setError({
        message: ERROR_MESSAGES.MAP.LOAD_FAILED,
        details: errorMessage,
      });
      setIsLoading(false);
    }
  }, []);

  const resetView = useCallback(() => {
    setCenter(CONFIG.maps.defaultCenter);
    setZoom(CONFIG.maps.defaultZoom);

    if (mapInstance) {
      mapInstance.setCenter(CONFIG.maps.defaultCenter);
      mapInstance.setZoom(CONFIG.maps.defaultZoom);
    }
  }, [mapInstance]);

  useEffect(() => {
    if (mapInstance && isMapLoaded) {
      mapInstance.setCenter(center);
      mapInstance.setZoom(zoom);
    }
  }, [mapInstance, isMapLoaded, center, zoom]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !isMapLoaded) {
        setError({
          message: ERROR_MESSAGES.MAP.LOAD_FAILED,
          details: ERROR_MESSAGES.MAP.RETRY_MESSAGE,
        });
        setIsLoading(false);
      }
    }, 20000);

    return () => clearTimeout(timer);
  }, [isLoading, isMapLoaded]);

  return {
    isMapLoaded,
    isLoading,
    mapInstance,
    center,
    zoom,
    error,
    handleMapLoad,
    setCenter,
    setZoom,
    resetView,
  };
};
