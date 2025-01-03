import React from 'react';
import type { FilterPanelProps, AreaType } from '../../../types';
import { AREAS } from '../../../constants';
import { CONFIG } from '../../../config';

const FilterPanel = ({ areaCounts, areaVisibility, onAreaToggle, className }: FilterPanelProps) => {
  const areas = Object.entries(AREAS).map(([area, name]) => ({
    area: area as AreaType,
    name,
    count: areaCounts[area as AreaType] ?? 0,
    isVisible: areaVisibility[area as AreaType] ?? true,
  }));

  return (
    <div className={`gmnoprint ${className}`} role="region" aria-label="エリアフィルター">
      <div
        className="bg-white rounded shadow-lg"
        style={{
          minWidth: '200px',
          maxWidth: '300px',
          backgroundColor: '#fff',
          border: '1px solid #ccc',
        }}
      >
        <div
          className="px-4 py-2 bg-[#fff] border-b border-gray-200 text-sm font-roboto rounded-t"
          style={{
            backgroundColor: '#fff',
            color: '#000',
          }}
        >
          表示するエリア
        </div>
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {areas.map(({ area, name, count, isVisible }) => (
            <label
              key={area}
              className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => onAreaToggle(area, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label={`${name}を表示 (${count}件)`}
              />
              <div className="flex items-center flex-1 ml-3">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: CONFIG.markers.colors[area] || CONFIG.markers.colors.DEFAULT,
                    opacity: isVisible ? 1 : 0.3,
                  }}
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-700 ml-2">{name}</span>
                <span className="text-xs text-gray-500 ml-auto">({count})</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

FilterPanel.displayName = 'FilterPanel';

export { FilterPanel };
export default FilterPanel;
