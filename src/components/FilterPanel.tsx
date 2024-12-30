import React, { useMemo } from 'react';
import { AREAS } from '../types';
import type { AreaType } from '../types';
import { CONFIG } from '../config';

interface FilterPanelProps {
  isVisible: boolean;
  areaCounts: Record<AreaType, number>;
  areaVisibility: Record<AreaType, boolean>;
  onAreaToggle: (area: AreaType, visible: boolean) => void;
}

// デフォルト値の初期化
const defaultAreaCounts: Record<AreaType, number> = Object.keys(AREAS).reduce(
  (acc, key) => ({ ...acc, [key]: 0 }),
  {} as Record<AreaType, number>,
);

const defaultAreaVisibility: Record<AreaType, boolean> = Object.keys(AREAS).reduce(
  (acc, key) => ({ ...acc, [key]: false }),
  {} as Record<AreaType, boolean>,
);

const FilterPanel = React.memo(
  ({
    isVisible,
    areaCounts = defaultAreaCounts,
    areaVisibility = defaultAreaVisibility,
    onAreaToggle,
  }: FilterPanelProps) => {
    const memoizedAreas = useMemo(
      () =>
        Object.entries(AREAS).map(([area, name]) => ({
          area: area as AreaType,
          name,
          count: areaCounts[area as AreaType],
          isVisible: areaVisibility[area as AreaType],
        })),
      [areaCounts, areaVisibility],
    );

    if (!isVisible) return null;

    return (
      <div
        className="absolute top-16 left-4 z-10 p-4 bg-white rounded shadow max-h-[calc(100vh-5rem)] overflow-y-auto"
        role="region"
        aria-label="エリアフィルター"
      >
        {memoizedAreas.map(({ area, name, count, isVisible }) => (
          <label
            key={area}
            className="flex items-center space-x-2 cursor-pointer mb-2 hover:bg-gray-50 p-2 rounded"
          >
            <span
              className="inline-block w-4 h-4 rounded-full border border-white"
              style={{
                backgroundColor: CONFIG.markers.colors.areas[area] || CONFIG.markers.colors.default,
                opacity: isVisible ? 1 : 0.5,
              }}
              aria-hidden="true"
            />
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => onAreaToggle(area, e.target.checked)}
              className="ml-2"
              aria-label={`${name}を表示 (${count}件)`}
            />
            <span>
              {name} ({count})
            </span>
          </label>
        ))}
      </div>
    );
  },
);

FilterPanel.displayName = 'FilterPanel';

export { FilterPanel };
