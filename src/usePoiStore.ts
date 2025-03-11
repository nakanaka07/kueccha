import { useCurrentLocation } from '@/useCurrentLocation';
import { useSheetData } from '@/sheets';
import { useAreaFiltering } from '@/useAreaFiltering';
import { useState, useCallback, useMemo } from 'react';
import type { Poi } from '@/index';
import type { AreaType } from '@/index';

/**
 * POI関連の状態を一元管理するフック
 */
export function usePoiStore() {
  // データソース
  const { data: sheetPois, status: poisStatus } = useSheetData();
  const { currentLocationPoi } = useCurrentLocation();

  // POI選択状態
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  // 統合POIデータ
  const allPois = useMemo(() => {
    if (!sheetPois?.length) return currentLocationPoi ? [currentLocationPoi] : [];
    return currentLocationPoi ? [currentLocationPoi, ...sheetPois] : sheetPois;
  }, [sheetPois, currentLocationPoi]);

  // エリアフィルタリング
  const {
    filteredPois,
    areaVisibility,
    setAreaVisibility,
    areaFilters,
    visibleAreaCount,
    // その他のエリアフィルタリング関連の値
  } = useAreaFiltering(allPois || []);

  // POI選択ハンドラ
  const handleSelectPoi = useCallback((poi: Poi | null) => {
    setSelectedPoi(poi);
  }, []);

  const clearSelectedPoi = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  return {
    // データ状態
    rawPois: sheetPois || [],
    allPois,
    filteredPois,
    selectedPoi,
    currentLocationPoi,
    poisStatus,

    // フィルター状態
    areaVisibility,
    setAreaVisibility,
    areaFilters,
    visibleAreaCount,

    // アクション
    setSelectedPoi: handleSelectPoi,
    clearSelectedPoi,
  };
}
