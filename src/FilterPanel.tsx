import React, { useRef } from 'react';
import { FilterItem } from './FilterItem';
import { useAreaFiltering } from './useAreaFiltering';
import type { FilterPanelProps } from '@core/types/filter';

const FilterPanel: React.FC<FilterPanelProps> = ({ pois, isFilterPanelOpen, onCloseClick }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const { localAreaVisibility, handleAreaChange, areaFilters, commitChanges } = useAreaFiltering(pois);

  // パネルを閉じる時に変更を適用
  const handleClose = () => {
    commitChanges();
    onCloseClick();
  };

  if (!isFilterPanelOpen) {
    return <div className="filterpanelContainer" />;
  }

  return (
    <div className="filterpanelContainer open">
      <div ref={panelRef} className="filterPanel">
        <button onClick={handleClose} className="closeButton" aria-label="閉じる">
          ×
        </button>

        <h2>表示エリア</h2>

        <div className="filterList">
          {areaFilters.areas.map(({ area, name, count, isVisible, color, icon }) => (
            <FilterItem
              key={area}
              area={area}
              label={name}
              count={count}
              isVisible={isVisible}
              color={color}
              icon={icon}
              onChange={handleAreaChange}
            />
          ))}

          <FilterItem
            area="CURRENT_LOCATION"
            label="現在地"
            isVisible={areaFilters.currentLocationData.isVisible}
            color={areaFilters.currentLocationData.color}
            icon={areaFilters.currentLocationData.icon}
            onChange={handleAreaChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
