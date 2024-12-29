// components/FilterPanel.tsx
import React from 'react';
import { AREAS } from '../types';
import type { AreaType } from '../types';
import { CONFIG } from '../config';

interface FilterPanelProps {
  isVisible: boolean;
  areaCounts: Record<AreaType, number>;
  areaVisibility: Record<AreaType, boolean>;
  onAreaToggle: (area: AreaType, visible: boolean) => void;
}

const FilterPanel = React.memo(
  ({ isVisible, areaCounts, areaVisibility, onAreaToggle }: FilterPanelProps) => {
    // 型注釈を追加
    if (!isVisible) return null;

    return (
      <div className="absolute top-16 left-4 z-10 p-4 bg-white rounded shadow max-h-[calc(100vh-5rem)] overflow-y-auto">
        {Object.entries(AREAS).map(([area, name]) => (
          <label
            key={area}
            className="flex items-center space-x-2 cursor-pointer mb-2 hover:bg-gray-50 p-2 rounded"
          >
            <span
              className="inline-block w-4 h-4 rounded-full border border-white"
              style={{
                backgroundColor:
                  CONFIG.markers.colors.areas[area as AreaType] || CONFIG.markers.colors.default,
                opacity: areaVisibility[area as AreaType] ? 1 : 0.5,
              }}
            />
            <input
              type="checkbox"
              checked={areaVisibility[area as AreaType]}
              onChange={(e) => {
                console.log('Toggling area:', area, e.target.checked); // ログを追加
                onAreaToggle(area as AreaType, e.target.checked);
              }}
              className="ml-2"
            />
            <span>
              {name} ({areaCounts[area as AreaType] || 0})
            </span>
          </label>
        ))}
      </div>
    );
  },
);

FilterPanel.displayName = 'FilterPanel';

export { FilterPanel };
