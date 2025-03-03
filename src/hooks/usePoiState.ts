import { useState, useEffect, useCallback, useMemo } from 'react';
import { CURRENT_LOCATION_POI, ERROR_MESSAGES } from '../utils/constants';
import type { Poi, AreaType } from '../utils/types';

/**
 * POI（地点情報）の状態を管理するカスタムフック
 */
export const usePoiState = (pois: Poi[], initialSelectedPoi?: Poi | null) => {
  // POIデータのロード状態を管理
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 選択中のPOIを管理
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(initialSelectedPoi || null);

  // 現在地POIの状態
  const [showCurrentLocation, setShowCurrentLocation] = useState(false);

  // POIデータの読み込み状態を監視
  useEffect(() => {
    try {
      if (Array.isArray(pois)) {
        if (pois.length > 0) {
          setIsLoaded(true);
          setIsLoading(false);
        } else {
          setIsLoading(false); // データは空だが読み込みは完了
        }
      } else {
        throw new Error(ERROR_MESSAGES.DATA.LOADING_FAILED);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    }
  }, [pois]);

  // 検索結果クリックのハンドラ
  const handleSearchResultClick = useCallback((poi: Poi) => {
    setSelectedPoi(poi);
  }, []);

  // 選択解除のハンドラ
  const clearSelectedPoi = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  // 指定エリアに属するPOIのみをフィルタリング
  const filterPoisByArea = useCallback(
    (areaType: AreaType | AreaType[]) => {
      if (!pois || pois.length === 0) return [];

      const areas = Array.isArray(areaType) ? areaType : [areaType];
      return pois.filter((poi) => areas.includes(poi.area));
    },
    [pois],
  );

  // 現在地POIの表示/非表示を切り替え
  const toggleCurrentLocationPoi = useCallback(() => {
    setShowCurrentLocation((prev) => !prev);

    // 現在地POIが表示され、選択されていない場合は選択状態にする
    if (!showCurrentLocation && (!selectedPoi || selectedPoi.id !== CURRENT_LOCATION_POI.id)) {
      setSelectedPoi(CURRENT_LOCATION_POI);
    }
  }, [showCurrentLocation, selectedPoi]);

  // 全てのPOI（現在地POIを含む場合がある）
  const allPois = useMemo(() => {
    if (showCurrentLocation) {
      return [...pois, CURRENT_LOCATION_POI];
    }
    return pois;
  }, [pois, showCurrentLocation]);

  // 次/前のPOIを選択する関数
  const selectNextPoi = useCallback(() => {
    if (!selectedPoi || allPois.length <= 1) return;

    const currentIndex = allPois.findIndex((poi) => poi.id === selectedPoi.id);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % allPois.length;
    setSelectedPoi(allPois[nextIndex]);
  }, [selectedPoi, allPois]);

  const selectPrevPoi = useCallback(() => {
    if (!selectedPoi || allPois.length <= 1) return;

    const currentIndex = allPois.findIndex((poi) => poi.id === selectedPoi.id);
    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + allPois.length) % allPois.length;
    setSelectedPoi(allPois[prevIndex]);
  }, [selectedPoi, allPois]);

  return {
    isLoading,
    isLoaded,
    error,
    selectedPoi,
    setSelectedPoi,
    clearSelectedPoi,
    handleSearchResultClick,
    filterPoisByArea,
    showCurrentLocation,
    toggleCurrentLocationPoi,
    allPois,
    selectNextPoi,
    selectPrevPoi,
  };
};
