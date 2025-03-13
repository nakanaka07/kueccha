import { useState, useCallback, useMemo, useEffect } from 'react';
import { AREAS, INITIAL_VISIBILITY } from '../constants/area.constants';
import { MARKERS } from '../constants/markers.constants';
import type { AreaType, AreaVisibility } from '../types/common.types';
import type { Poi } from '../types/poi.types';

const STORAGE_KEY = 'kueccha_area_visibility';

export function useAreaFiltering(pois: Poi[] = [], persistToStorage = true) {
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

  const [areaVisibility, setAreaVisibility] = useState<AreaVisibility>(getSavedVisibility());

  const [localAreaVisibility, setLocalAreaVisibility] = useState<AreaVisibility>(areaVisibility);

  useEffect(() => {
    if (persistToStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(areaVisibility));
      } catch (error) {
        console.error('エリア表示設定の保存に失敗しました:', error);
      }
    }
  }, [areaVisibility, persistToStorage]);

  const filteredPois = useMemo(() => {
    return pois.filter((poi) => {
      if (!poi.area) return true;
      return areaVisibility[poi.area];
    });
  }, [pois, areaVisibility]);

  const handleAreaChange = useCallback((area: AreaType, isVisible: boolean) => {
    setLocalAreaVisibility((prev) => ({
      ...prev,
      [area]: isVisible,
    }));
  }, []);

  const commitChanges = useCallback(() => {
    setAreaVisibility(localAreaVisibility);
  }, [localAreaVisibility]);

  const discardChanges = useCallback(() => {
    setLocalAreaVisibility(areaVisibility);
  }, [areaVisibility]);

  const showAllAreas = useCallback(() => {
    const allVisible = Object.keys(AREAS).reduce((acc, area) => ({ ...acc, [area]: true }), {} as AreaVisibility);
    setLocalAreaVisibility(allVisible);
  }, []);

  const hideAllAreas = useCallback(() => {
    const allHidden = Object.keys(AREAS).reduce((acc, area) => ({ ...acc, [area]: false }), {} as AreaVisibility);
    setLocalAreaVisibility(allHidden);
  }, []);

  const resetToDefaults = useCallback(() => {
    setAreaVisibility(INITIAL_VISIBILITY);
    setLocalAreaVisibility(INITIAL_VISIBILITY);
  }, []);

  const visibleAreaCount = useMemo(() => Object.values(areaVisibility).filter(Boolean).length, [areaVisibility]);

  const areaFilters = useMemo(() => {
    const areaCounts = pois.reduce<Record<AreaType, number>>(
      (acc, poi) => ({
        ...acc,
        [poi.area]: (acc[poi.area] || 0) + 1,
      }),
      {} as Record<AreaType, number>,
    );

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

    const currentLocationData = {
      isVisible: localAreaVisibility.CURRENT_LOCATION,
      color: MARKERS.colors.CURRENT_LOCATION,
      icon: MARKERS.icons.CURRENT_LOCATION,
    };

    return { areas, currentLocationData };
  }, [pois, localAreaVisibility]);

  return {
    areaVisibility,
    setAreaVisibility,
    localAreaVisibility,
    setLocalAreaVisibility,
    filteredPois,
    areaFilters,
    visibleAreaCount,

    handleAreaChange,
    showAllAreas,
    hideAllAreas,
    resetToDefaults,
    commitChanges,
    discardChanges,
  };
}
