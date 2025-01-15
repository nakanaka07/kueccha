import React, { useState, useEffect } from 'react';
import type { AreaType, FilterPanelProps } from '../../utils/types';
import { AREAS } from '../../utils/constants';
import { markerConfig } from '../../utils/config';
import './FilterPanel.css';

const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.keys(AREAS).reduce(
  (acc, area) => ({
    ...acc,
    [area]: area !== 'SNACK' && area !== 'PUBLIC_TOILET' && area !== 'PARKING',
  }),
  {} as Record<AreaType, boolean>,
);

export { INITIAL_VISIBILITY };

const FilterPanel: React.FC<FilterPanelProps> = ({
  pois,
  setSelectedPoi,
  setAreaVisibility,
  isFilterPanelOpen,
  onCloseClick,
}) => {
  const [areaVisibility, setLocalAreaVisibility] = useState<
    Record<AreaType, boolean>
  >(() => {
    const savedVisibility = localStorage.getItem('areaVisibility');
    return savedVisibility ? JSON.parse(savedVisibility) : INITIAL_VISIBILITY;
  });

  useEffect(() => {
    localStorage.setItem('areaVisibility', JSON.stringify(areaVisibility));
    setAreaVisibility(areaVisibility);
  }, [areaVisibility, setAreaVisibility]);

  const areaCounts = pois.reduce(
    (acc: Record<AreaType, number>, poi) => ({
      ...acc,
      [poi.area]: (acc[poi.area] || 0) + 1,
    }),
    {} as Record<AreaType, number>,
  );

  const areas = Object.entries(AREAS).map(([area, name]) => ({
    area: area as AreaType,
    name,
    count: areaCounts[area as AreaType] ?? 0,
    isVisible: areaVisibility[area as AreaType],
    color: markerConfig.colors[area as AreaType],
  }));

  return (
    <div className={`filterpanel-container ${isFilterPanelOpen ? 'open' : ''}`}>
      {isFilterPanelOpen && (
        <div
          role="region"
          aria-label="エリアフィルター"
          className="filter-panel"
        >
          <button className="close-button" onClick={onCloseClick}>
            ×
          </button>
          <div>
            <div>表示するエリア（表示数）</div>
            <div>
              {areas.map(({ area, name, count, isVisible, color }) => (
                <label key={area} className="filter-item">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => {
                      setLocalAreaVisibility((prev) => ({
                        ...prev,
                        [area]: e.target.checked,
                      }));
                      setSelectedPoi(null);
                    }}
                    aria-label={`${name}を表示 (${count}件)`}
                  />
                  <span
                    className="custom-checkbox"
                    style={{ borderColor: color }}
                  ></span>
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
      )}
    </div>
  );
};

export default FilterPanel;
