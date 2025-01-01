import React, { useMemo } from 'react';
import type { FilterPanelProps, AreaType } from '../../../types';
import { AREAS } from '../../../constants';
import { CONFIG } from '../../../config';

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
      className="absolute top-4 right-4 z-[9999] bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-4 max-h-[calc(100vh-2rem)] overflow-y-auto w-64"
      role="navigation"
      aria-label="エリアフィルター"
    >
      <fieldset>
        <legend className="font-semibold mb-2 text-gray-700">表示するエリアの選択</legend>
        {memoizedAreas.map(({ area, name, count, isVisible }) => (
          <label
            key={area}
            className="flex items-center space-x-2 cursor-pointer mb-2 hover:bg-white/90 p-2 rounded transition-colors"
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
              className="hidden"
              aria-label={`${name}を表示 (${count}件)`}
            />
            <span className="text-gray-800">
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
