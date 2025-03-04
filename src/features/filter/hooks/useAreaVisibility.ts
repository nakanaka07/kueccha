import { useCallback, useEffect, useMemo, useState } from 'react';
import { AREAS } from '../../../constants/areas';
import { INITIAL_VISIBILITY } from '../../../constants/areas';
import type { AreaType, AreaVisibility } from '../../../types/filter';

const STORAGE_KEY = 'kueccha_area_visibility';

/**
 * エリアの表示/非表示状態を管理するカスタムフック
 * @param persistToStorage - ローカルストレージに状態を保存するかどうか (default: true)
 * @returns エリア表示管理のための状態と関数群
 */
export const useAreaVisibility = (persistToStorage = true) => {
  // ローカルストレージから保存された設定を取得または初期値を使用
  const getSavedVisibility = useCallback((): AreaVisibility => {
    if (!persistToStorage) return INITIAL_VISIBILITY;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        // AreaTypeの全キーが含まれているか検証
        const allKeysExist = Object.keys(AREAS).every((area) => typeof parsed[area] === 'boolean');

        if (allKeysExist) return parsed as AreaVisibility;
      }
    } catch (error) {
      console.error('エリア表示設定の復元に失敗しました:', error);
    }

    return INITIAL_VISIBILITY;
  }, [persistToStorage]);

  // 状態の初期化
  const [areaVisibility, setAreaVisibility] = useState<AreaVisibility>(getSavedVisibility);
  const [localAreaVisibility, setLocalAreaVisibility] = useState<AreaVisibility>(areaVisibility);

  // ローカルストレージへの保存
  useEffect(() => {
    if (persistToStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(areaVisibility));
    }
  }, [areaVisibility, persistToStorage]);

  // 特定エリアの表示/非表示を切り替える関数
  const toggleArea = useCallback((area: AreaType) => {
    setAreaVisibility((prev) => ({
      ...prev,
      [area]: !prev[area],
    }));
  }, []);

  // すべてのエリアを表示する関数
  const showAllAreas = useCallback(() => {
    const allVisible = Object.keys(AREAS).reduce((acc, area) => ({ ...acc, [area]: true }), {} as AreaVisibility);
    setAreaVisibility(allVisible);
  }, []);

  // すべてのエリアを非表示にする関数
  const hideAllAreas = useCallback(() => {
    const allHidden = Object.keys(AREAS).reduce((acc, area) => ({ ...acc, [area]: false }), {} as AreaVisibility);
    setAreaVisibility(allHidden);
  }, []);

  // 可視エリアの数をカウント
  const visibleAreaCount = useMemo(() => Object.values(areaVisibility).filter(Boolean).length, [areaVisibility]);

  // デフォルト状態に戻す関数
  const resetToDefaults = useCallback(() => {
    setAreaVisibility(INITIAL_VISIBILITY);
    setLocalAreaVisibility(INITIAL_VISIBILITY);
  }, []);

  // 変更をコミットする関数（ローカル変更を確定する場合に使用）
  const commitChanges = useCallback(() => {
    setAreaVisibility(localAreaVisibility);
  }, [localAreaVisibility]);

  // 変更を破棄する関数（ローカル変更をキャンセルする場合に使用）
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
