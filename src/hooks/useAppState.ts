import { useState, useEffect, useCallback } from 'react';
import { INITIAL_VISIBILITY } from '../constants/constants';
import type { Poi, AreaType, LatLngLiteral } from '../types/types';

export const useAppState = (pois: Poi[]) => {
  // マップと状態の管理
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [areaVisibility, setAreaVisibility] = useState<Record<AreaType, boolean>>(INITIAL_VISIBILITY);
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // マップロード時のハンドラー
  const handleMapLoad = useCallback((map: google.maps.Map | null) => {
    if (map) {
      setMapInstance(map);
      setIsMapLoaded(true);
    }
  }, []);

  // 検索結果クリック時のハンドラー
  const handleSearchResultClick = useCallback((poi: Poi) => {
    setSelectedPoi(poi);
  }, []);

  // POIデータがロードされたかを監視
  useEffect(() => {
    if (pois.length > 0) {
      setIsLoaded(true);
    }
  }, [pois]);

  // 状態とアクションをオブジェクトとして返す
  return {
    // 状態
    isLoaded,
    isMapLoaded,
    selectedPoi,
    areaVisibility,
    currentLocation,
    showWarning,
    mapInstance,
    
    // 状態更新関数
    setSelectedPoi,
    setAreaVisibility,
    setCurrentLocation,
    setShowWarning,
    
    // アクション
    actions: {
      handleMapLoad,
      handleSearchResultClick,
    },
  };
};