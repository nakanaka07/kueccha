import React, { useRef } from 'react';
import { FilterItem } from './FilterItem';
import { useAreaFilters } from '../hooks/useAreaFilters';
import type { AreaType, AreaVisibility } from '../../../core/types/common';
import type { FilterPanelProps } from '../../../core/types/filter';

const FilterPanel: React.FC<FilterPanelProps> = ({
  pois,
  setAreaVisibility,
  isFilterPanelOpen,
  onCloseClick,
  localAreaVisibility,
  setLocalAreaVisibility,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const { areas, currentLocationData } = useAreaFilters(pois, localAreaVisibility, setAreaVisibility);

  const handleAreaChange = (area: AreaType, isVisible: boolean) => {
    setLocalAreaVisibility((prev: AreaVisibility) => ({
      ...prev,
      [area]: isVisible,
    }));
  };

  if (!isFilterPanelOpen) {
    return <div className="filterpanelContainer" />;
  }

  return (
    <div className="filterpanelContainer open">
      <div ref={panelRef} className="filterPanel">
        <button onClick={onCloseClick} className="closeButton" aria-label="閉じる">
          ×
        </button>

        <h2>表示エリア</h2>

        <div className="filterList">
          {areas.map(({ area, name, count, isVisible, color, icon }) => (
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
            isVisible={currentLocationData.isVisible}
            color={currentLocationData.color || ''}
            icon={currentLocationData.icon || ''}
            onChange={handleAreaChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
