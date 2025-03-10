/*
 * 機能: POI（Points of Interest）の状態管理を行うカスタムフック
 * 依存関係:
 *   - React (useState, useCallback, useEffect)
 *   - Poi型定義
 * 注意点:
 *   - POIの選択状態とフィルタリング機能を提供
 *   - アプリケーション全体でのPOI状態の一貫性を保証
 *   - PoiContextの機能をコンテキストなしで使用するためのフック
 */

import { useState, useCallback, useEffect } from 'react';
import type { AreaType } from '../../../core/types/common';
import type { Poi } from '../../../core/types/poi';

export function usePoiState(pois: Poi[]) {
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);
  const [filteredPois, setFilteredPois] = useState<Poi[]>(pois);

  // POIリストが変更された場合は、フィルター結果も更新
  useEffect(() => {
    setFilteredPois(pois);
  }, [pois]);

  // POI選択処理
  const handleSelectPoi = useCallback((poi: Poi | null) => {
    setSelectedPoi(poi);
  }, []);

  // POIフィルタリング処理
  const filterPois = useCallback(
    (areaVisibility: Record<AreaType, boolean>) => {
      const filtered = pois.filter((poi) => {
        if (!poi.area) return true;
        return areaVisibility[poi.area];
      });
      setFilteredPois(filtered);
    },
    [pois],
  );

  // 選択POIのクリア
  const clearSelectedPoi = useCallback(() => {
    setSelectedPoi(null);
  }, []);

  return {
    pois,
    filteredPois,
    selectedPoi,
    setSelectedPoi: handleSelectPoi,
    clearSelectedPoi,
    filterPois,
  };
}
