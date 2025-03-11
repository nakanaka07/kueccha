import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAreaFiltering } from './useAreaFiltering';
import { AREAS } from '../../../core/constants/areas';
import { INITIAL_VISIBILITY } from '../../../core/constants/areas';
import type { Poi } from '../../../core/types';
import type { AreaType, AreaVisibility } from '../../../core/types/common';

// 後方互換性のためのラッパー
export const useAreaVisibility = (persistToStorage = true, pois: Poi[] = []) => {
  const {
    areaVisibility,
    setAreaVisibility,
    localAreaVisibility,
    setLocalAreaVisibility,
    visibleAreaCount,
    handleAreaChange: toggleArea,
    showAllAreas,
    hideAllAreas,
    resetToDefaults,
    commitChanges,
    discardChanges,
  } = useAreaFiltering(pois, persistToStorage);

  return {
    areaVisibility,
    setAreaVisibility,
    localAreaVisibility,
    setLocalAreaVisibility,
    toggleArea,
    showAllAreas,
    hideAllAreas,
    visibleAreaCount,
    resetToDefaults,
    commitChanges,
    discardChanges,
  };
};
