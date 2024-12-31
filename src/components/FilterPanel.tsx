import React, { useMemo } from 'react';
import { AREAS } from '../constants';
import type { AreaType } from '../types';
import { CONFIG } from '../config';

interface FilterPanelProps {
  areaCounts: Record<AreaType, number>;
  areaVisibility: Record<AreaType, boolean>;
  onAreaToggle: (area: AreaType, visible: boolean) => void;
}

const FilterPanel = React.memo(({ areaCounts, areaVisibility, onAreaToggle }: FilterPanelProps) => {
  const memoizedAreas = useMemo(
    () =>
      Object.entries(AREAS).map(([area, name]) => ({
        area: area as AreaType,
        name,
        count: areaCounts[area as AreaType] ?? 0,
        isVisible: areaVisibility[area as AreaType] ?? true,
      })),
    [areaCounts, areaVisibility],
  );

  return (
    <nav
      className="p-4 bg-white rounded shadow max-h-[calc(100vh-5rem)] overflow-y-auto"
      role="navigation"
      aria-label="エリアフィルター"
    >
      <fieldset>
        <legend className="sr-only">表示するエリアの選択</legend>
        {memoizedAreas.map(({ area, name, count, isVisible }) => (
          <label
            key={area}
            className="flex items-center space-x-2 cursor-pointer mb-2 hover:bg-gray-50 p-2 rounded"
          >
            <span
              className="inline-block w-4 h-4 rounded-full border border-white"
              style={{
                backgroundColor: CONFIG.markers.colors[area] || CONFIG.markers.colors.DEFAULT,
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
      </fieldset>
    </nav>
  );
});

FilterPanel.displayName = 'FilterPanel';

export { FilterPanel };
export default FilterPanel;
