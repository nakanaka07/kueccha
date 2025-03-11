// src/modules/filter/hooks/useAreaFiltering.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import { AREAS, INITIAL_VISIBILITY } from '@core/constants/areas';
import { MARKERS } from '@core/constants/markers';
import type { AreaType, AreaVisibility, Poi } from '@core/types';

const STORAGE_KEY = 'kueccha_area_visibility';

export function useAreaFiltering(pois: Poi[], persistToStorage = true) {
  // 保存された表示設定の復元
  const getSavedVisibility = useCallback((): AreaVisibility => {
    if (!persistToStorage) return INITIAL_VISIBILITY;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const allKeysExist = Object.keys(AREAS).every((area) => typeof parsed[area] === 'boolean');
        if (allKeysExist) return parsed as AreaVisibility;
      }
    } catch (error) {
      console.error('エリア表示設定の復元に失敗しました:', error);
    }

    return INITIAL_VISIBILITY;
  }, [persistToStorage]);

  // メインの表示設定状態
  const [areaVisibility, setAreaVisibility] = useState<AreaVisibility>(getSavedVisibility());

  // フィルターパネルで一時的に使用する表示設定状態
  const [localAreaVisibility, setLocalAreaVisibility] = useState<AreaVisibility>(areaVisibility);

  // 設定をLocalStorageに保存
  useEffect(() => {
    if (persistToStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(areaVisibility));
      } catch (error) {
        console.error('エリア表示設定の保存に失敗しました:', error);
      }
    }
  }, [areaVisibility, persistToStorage]);

  // フィルタリングされたPOI
  const filteredPois = useMemo(() => {
    return pois.filter((poi) => {
      if (!poi.area) return true;
      return areaVisibility[poi.area];
    });
  }, [pois, areaVisibility]);

  // 個別のエリア表示切替
  const handleAreaChange = useCallback((area: AreaType, isVisible: boolean) => {
    setLocalAreaVisibility((prev) => ({
      ...prev,
      [area]: isVisible,
    }));
  }, []);

  // フィルターパネルでの変更を適用
  const commitChanges = useCallback(() => {
    setAreaVisibility(localAreaVisibility);
  }, [localAreaVisibility]);

  // フィルターパネルでの変更を破棄
  const discardChanges = useCallback(() => {
    setLocalAreaVisibility(areaVisibility);
  }, [areaVisibility]);

  // すべてのエリアを表示
  const showAllAreas = useCallback(() => {
    const allVisible = Object.keys(AREAS).reduce((acc, area) => ({ ...acc, [area]: true }), {} as AreaVisibility);
    setLocalAreaVisibility(allVisible);
  }, []);

  // すべてのエリアを非表示
  const hideAllAreas = useCallback(() => {
    const allHidden = Object.keys(AREAS).reduce((acc, area) => ({ ...acc, [area]: false }), {} as AreaVisibility);
    setLocalAreaVisibility(allHidden);
  }, []);

  // デフォルト設定にリセット
  const resetToDefaults = useCallback(() => {
    setAreaVisibility(INITIAL_VISIBILITY);
    setLocalAreaVisibility(INITIAL_VISIBILITY);
  }, []);

  // 表示エリア数
  const visibleAreaCount = useMemo(() => Object.values(areaVisibility).filter(Boolean).length, [areaVisibility]);

  // フィルターUI用のエリア情報
  const areaFilters = useMemo(() => {
    // エリア別POI数集計
    const areaCounts = pois.reduce<Record<AreaType, number>>(
      (acc, poi) => ({
        ...acc,
        [poi.area]: (acc[poi.area] || 0) + 1,
      }),
      {} as Record<AreaType, number>,
    );

    // エリア情報の整形（現在地以外）
    const areas = Object.entries(AREAS)
      .filter(([area]) => area !== 'CURRENT_LOCATION')
      .map(([area, name]) => ({
        area: area as AreaType,
        name,
        count: areaCounts[area as AreaType] ?? 0,
        isVisible: localAreaVisibility[area as AreaType],
        color: MARKERS.colors[area as AreaType],
        icon: MARKERS.icons[area as AreaType],
      }));

    // 現在地情報
    const currentLocationData = {
      isVisible: localAreaVisibility.CURRENT_LOCATION,
      color: MARKERS.colors.CURRENT_LOCATION,
      icon: MARKERS.icons.CURRENT_LOCATION,
    };

    return { areas, currentLocationData };
  }, [pois, localAreaVisibility]);

  return {
    // 状態
    areaVisibility,
    setAreaVisibility,
    localAreaVisibility,
    setLocalAreaVisibility,
    filteredPois,
    areaFilters,
    visibleAreaCount,

    // アクション
    handleAreaChange,
    showAllAreas,
    hideAllAreas,
    resetToDefaults,
    commitChanges,
    discardChanges,
  };
}
