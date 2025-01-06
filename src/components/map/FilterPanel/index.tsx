import React from 'react';
import type { FilterPanelProps } from '../../../types';
import { AreaType } from '../../../types';
import { AREAS } from '../../../constants';
import { markerConfig } from '../../../config';
import '../../../App.css';

const FilterPanel = ({
  areaCounts,
  areaVisibility,
  onAreaToggle,
  onAreaClick,
}: FilterPanelProps) => {
  const areas = Object.entries(AREAS).map(([area, name]) => ({
    area: area as AreaType,
    name,
    count: areaCounts[area as AreaType] ?? 0,
    isVisible: areaVisibility[area as AreaType],
    color: markerConfig.colors[area as AreaType],
  }));

  return (
    <div role="region" aria-label="エリアフィルター" className="filter-panel">
      <div>
        <div>表示するエリア（表示数）</div>
        <div>
          {areas.map(({ area, name, count, isVisible, color }) => (
            <label key={area} className="filter-item" onClick={onAreaClick}>
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => onAreaToggle(area, e.target.checked)}
                aria-label={`${name}を表示 (${count}件)`}
              />
              <span className="custom-checkbox" style={{ borderColor: color }}></span>
              <div className="filter-details">
                <span
                  className="marker-color"
                  style={{ backgroundColor: color }}
                  aria-hidden="true"
                />
                <span className="area-name" data-fullname={name}>
                  {name}
                </span>
                <span>({count})</span>
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
