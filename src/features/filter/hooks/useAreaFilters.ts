// useAreaFilters.ts
import { useEffect } from 'react';
import { AREAS } from '../../../constants/areas';
import { MARKERS } from '../../../constants/markers';
import type { Poi, AreaType } from '../../../types/common';

export function useAreaFilters(
  pois: Poi[],
  localAreaVisibility: Record<AreaType, boolean>,
  setAreaVisibility: (visibility: Record<AreaType, boolean>) => void,
) {
  // エリアごとのカウント集計
  const areaCounts = pois.reduce(
    (acc: Record<AreaType, number>, poi) => ({
      ...acc,
      [poi.area]: (acc[poi.area] || 0) + 1,
    }),
    {} as Record<AreaType, number>,
  );

  // 表示用エリアデータの構築
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

  // 親コンポーネントとの状態同期
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