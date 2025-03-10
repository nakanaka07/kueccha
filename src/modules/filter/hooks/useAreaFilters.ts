import { useEffect } from 'react';
import { AREAS } from '../../../core/constants/areas';
import { MARKERS } from '../../../core/constants/markers';
import type { AreaType } from '../../../core/types/common';

interface Poi {
  area: AreaType;
}

export function useAreaFilters(
  pois: Poi[],
  localAreaVisibility: Record<AreaType, boolean>,
  setAreaVisibility: (visibility: Record<AreaType, boolean>) => void,
) {
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
