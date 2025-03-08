/*
 * 機能: エリアフィルタリング機能を提供するカスタムフック
 * 依存関係:
 *   - React useEffect
 *   - AREAS, MARKERS 定数
 *   - Poi, AreaType 型定義
 * 注意点:
 *   - このフックはPOIデータをエリアごとにフィルタリングし、UI表示用のデータを生成します
 *   - CURRENT_LOCATIONは特別なエリアとして扱われ、通常のエリア一覧からは除外されます
 *   - 親コンポーネントとの状態同期が自動的に行われます
 */

import { useEffect } from 'react';
import { AREAS } from '../../../core/constants/areas';
import { MARKERS } from '../../../core/constants/markers';
// ここをプロジェクト内の正しい場所から型をインポートするように修正
import type { AreaType } from '../../../core/types/common';

// Poi型をローカルで定義する場合
interface Poi {
  area: AreaType;
  // 他に必要なプロパティがあれば追加
}

export function useAreaFilters(
  pois: Poi[],
  localAreaVisibility: Record<AreaType, boolean>,
  setAreaVisibility: (visibility: Record<AreaType, boolean>) => void,
) {
  // 型アサーションを明示的に行う
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

  useEffect(() => {
    const sortedAreaVisibility = Object.keys(localAreaVisibility)
      .sort((a, b) => (a === 'RECOMMEND' ? 1 : b === 'RECOMMEND' ? -1 : 0))
      .reduce(
        (acc, key) => {
          acc[key as AreaType] = localAreaVisibility[key as AreaType];
          return acc;
        },
        {} as Record<AreaType, boolean>,
      );

    if (JSON.stringify(sortedAreaVisibility) !== JSON.stringify(localAreaVisibility)) {
      setAreaVisibility(sortedAreaVisibility);
    }
  }, [localAreaVisibility, setAreaVisibility]);

  return {
    areas,
    currentLocationData: {
      isVisible: localAreaVisibility.CURRENT_LOCATION,
      color: MARKERS.colors.CURRENT_LOCATION,
      icon: MARKERS.icons.CURRENT_LOCATION,
    },
  };
}
