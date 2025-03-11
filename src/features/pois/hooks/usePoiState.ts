import { useState, useCallback, useEffect } from 'react';
import { useAreaFiltering } from '../../../modules/filter/hooks/useAreaFiltering';
import type { AreaType } from '../../../core/types/common';
import type { Poi } from '../../../core/types/poi';

export function usePoiState(pois: Poi[]) {
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const { filteredPois, areaVisibility } = useAreaFiltering(pois);

  const handleSelectPoi = useCallback((poi: Poi | null) => {
    setSelectedPoi(poi);
  }, []);

  // filterPois関数は後方互換性のために残すが、内部でuseAreaFilteringを使用
  const filterPois = useCallback((visibility: Record<AreaType, boolean>) => {
    // 実際のフィルタリングはuseAreaFilteringで行われるため、
    // このメソッドは何もしない（areaVisibilityを変更するとuseAreaFilteringが処理する）
    console.warn('filterPois は非推奨です。useAreaFiltering を使用してください');
    // 必要に応じて実装を追加
  }, []);

  const clearSelectedPoi = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  return {
    pois,
    filteredPois, // useAreaFilteringからのフィルター済みPOIを使用
    selectedPoi,
    setSelectedPoi: handleSelectPoi,
    clearSelectedPoi,
    filterPois, // 後方互換性のために残す
  };
}
