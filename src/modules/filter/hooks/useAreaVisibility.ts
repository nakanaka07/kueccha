/*
 * 機能: エリアの表示/非表示状態を管理するカスタムフック
 * 依存関係:
 *   - React (useCallback, useEffect, useMemo, useState)
 *   - AREAS定数
 *   - INITIAL_VISIBILITY定数
 *   - AreaType, AreaVisibilityタイプ定義
 * 注意点:
 *   - ローカルストレージに設定が保存されるため、異なるコンポーネント間で設定が共有されます
 *   - persistToStorage=falseにすると、ローカルストレージへの保存を無効化できます
 *   - ローカルストレージ読み込み時にエラーが発生した場合、初期値にフォールバックします
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AREAS } from '../../../constants/areas';
import { INITIAL_VISIBILITY } from '../../../constants/areas';
import type { AreaType, AreaVisibility } from '../../../types/filter';

const STORAGE_KEY = 'kueccha_area_visibility';

export const useAreaVisibility = (persistToStorage = true) => {
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

  const [areaVisibility, setAreaVisibility] = useState<AreaVisibility>(getSavedVisibility);
  const [localAreaVisibility, setLocalAreaVisibility] = useState<AreaVisibility>(areaVisibility);

  useEffect(() => {
    if (persistToStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(areaVisibility));
    }
  }, [areaVisibility, persistToStorage]);

  const toggleArea = useCallback((area: AreaType) => {
    setAreaVisibility((prev) => ({
      ...prev,
      [area]: !prev[area],
    }));
  }, []);

  const showAllAreas = useCallback(() => {
    const allVisible = Object.keys(AREAS).reduce((acc, area) => ({ ...acc, [area]: true }), {} as AreaVisibility);
    setAreaVisibility(allVisible);
  }, []);

  const hideAllAreas = useCallback(() => {
    const allHidden = Object.keys(AREAS).reduce((acc, area) => ({ ...acc, [area]: false }), {} as AreaVisibility);
    setAreaVisibility(allHidden);
  }, []);

  const visibleAreaCount = useMemo(() => Object.values(areaVisibility).filter(Boolean).length, [areaVisibility]);

  const resetToDefaults = useCallback(() => {
    setAreaVisibility(INITIAL_VISIBILITY);
    setLocalAreaVisibility(INITIAL_VISIBILITY);
  }, []);

  const commitChanges = useCallback(() => {
    setAreaVisibility(localAreaVisibility);
  }, [localAreaVisibility]);

  const discardChanges = useCallback(() => {
    setLocalAreaVisibility(areaVisibility);
  }, [areaVisibility]);

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
