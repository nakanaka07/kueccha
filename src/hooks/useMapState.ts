import { useState, useCallback, useEffect } from 'react';
import { CONFIG } from '../utils/config';
import { ERROR_MESSAGES } from '../utils/constants';
import { LatLngLiteral, AppError } from '../utils/types';

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

  // マップロード時の処理
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

  // マップのビューをリセットする
  const resetView = useCallback(() => {
    setCenter(CONFIG.maps.defaultCenter);
    setZoom(CONFIG.maps.defaultZoom);

    // マップインスタンスが存在する場合は直接更新
    if (mapInstance) {
      mapInstance.setCenter(CONFIG.maps.defaultCenter);
      mapInstance.setZoom(CONFIG.maps.defaultZoom);
    }
  }, [mapInstance]);

  // マップインスタンスが変更されたときに中心とズームを適用
  useEffect(() => {
    if (mapInstance && isMapLoaded) {
      mapInstance.setCenter(center);
      mapInstance.setZoom(zoom);
    }
  }, [mapInstance, isMapLoaded, center, zoom]);

  // 読み込みが長引いた場合のタイムアウト処理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !isMapLoaded) {
        setError({
          message: ERROR_MESSAGES.MAP.LOAD_FAILED,
          details: ERROR_MESSAGES.MAP.RETRY_MESSAGE,
        });
        setIsLoading(false);
      }
    }, 20000); // 20秒のタイムアウト

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
