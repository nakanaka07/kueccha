import React, { useEffect, useRef } from 'react';
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
  localAreaVisibility,
  setLocalAreaVisibility,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAreaVisibility(localAreaVisibility);
  }, [localAreaVisibility, setAreaVisibility]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onCloseClick();
      }
    };

    if (isFilterPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterPanelOpen, onCloseClick]);

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
    isVisible: localAreaVisibility[area as AreaType],
    color: markerConfig.colors[area as AreaType],
  }));

  return (
    <div ref={panelRef} className={`filterpanel-container ${isFilterPanelOpen ? 'open' : ''}`}>
      {isFilterPanelOpen && (
        <div
          role="region"
          aria-label="エリアフィルター"
          className="filter-panel"
        >
          <button
            className="close-button"
            onClick={onCloseClick}
            title="閉じます。"
          >
            ×
          </button>
          <div>
            <div>表示エリア（表示数）</div>
            <div>
              {areas.map(({ area, name, count, isVisible, color }) => (
                <label key={area} className="filter-item">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => {
                      setLocalAreaVisibility((prev: Record<AreaType, boolean>) => ({
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
                    <span className="area-name" data-fullname={name} title={name}>
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
