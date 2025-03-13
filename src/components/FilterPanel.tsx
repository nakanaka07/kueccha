import React, { useEffect, useRef } from 'react';
import './FilterPanel.module.css';
import useCurrentLocation from '../../hooks/useCurrentLocation';
import { MARKER_CONFIG, AREAS } from '../../utils/constants';
import type { AreaType, FilterPanelProps } from '../../utils/types';

const FilterPanel: React.FC<FilterPanelProps> = ({
  pois,
  setAreaVisibility,
  isFilterPanelOpen,
  onCloseClick,
  localAreaVisibility,
  setLocalAreaVisibility,
  setShowWarning,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const { locationError, handleCurrentLocationChange } = useCurrentLocation(setShowWarning);

  useEffect(() => {
    const sortedAreaVisibility = Object.keys(localAreaVisibility)
      .sort((a, b) => (a === 'RECOMMEND' ? 1 : b === 'RECOMMEND' ? -1 : 0))
      .reduce(
        (acc, key) => {
          acc[key as AreaType] = localAreaVisibility[key as AreaType];
          return acc;
        },
        {} as Record<AreaType, boolean>,
      );

    // 条件付きでsetAreaVisibilityを呼び出す
    if (JSON.stringify(sortedAreaVisibility) !== JSON.stringify(localAreaVisibility)) {
      setAreaVisibility(sortedAreaVisibility);
    }
  }, [localAreaVisibility, setAreaVisibility]);

  const areaCounts = pois.reduce(
    (acc: Record<AreaType, number>, poi) => ({
      ...acc,
      [poi.area]: (acc[poi.area] || 0) + 1,
    }),
    {} as Record<AreaType, number>,
  );

  const areas = Object.entries(AREAS)
    .filter(([area]) => area !== 'CURRENT_LOCATION')
    .map(([area, name]) => ({
      area: area as AreaType,
      name,
      count: areaCounts[area as AreaType] ?? 0,
      isVisible: localAreaVisibility[area as AreaType],
      color: MARKER_CONFIG.colors[area as AreaType],
      icon: MARKER_CONFIG.icons[area as AreaType],
    }));

  return (
    <div className={`filterpanel-container ${isFilterPanelOpen ? 'open' : ''}`}>
      {isFilterPanelOpen && (
        <div ref={panelRef} className="filter-panel">
          <button onClick={onCloseClick} className="close-button" aria-label="閉じる">
            ×
          </button>
          <h2>表示エリア</h2>
          <div className="filter-list">
            {areas.map(({ area, name, count, isVisible, color, icon }) => (
              <label key={area} className="filter-item">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() =>
                    setLocalAreaVisibility((prev) => ({
                      ...prev,
                      [area]: !prev[area],
                    }))
                  }
                  aria-label={`${name}を表示`}
                />
                <span className="custom-checkbox" style={{ borderColor: color }}></span>
                <div className="filter-details">
                  <img src={icon} alt={`${name}のアイコン`} className="marker-icon" aria-hidden="true" />
                  <span className="area-name" data-fullname={name} title={name}>
                    {name}
                  </span>
                  <span>({count})</span>
                </div>
              </label>
            ))}
            <label className="filter-item">
              <input
                type="checkbox"
                checked={localAreaVisibility.CURRENT_LOCATION}
                onChange={(e) => handleCurrentLocationChange(e.target.checked)}
                aria-label="現在地を表示"
              />
              <span className="custom-checkbox" style={{ borderColor: MARKER_CONFIG.colors.CURRENT_LOCATION }}></span>
              <div className="filter-details">
                <img
                  src={MARKER_CONFIG.icons.CURRENT_LOCATION}
                  alt="現在地のアイコン"
                  className="marker-icon"
                  aria-hidden="true"
                />
                <span className="area-name" data-fullname="現在地" title="現在地">
                  現在地
                </span>
              </div>
            </label>
          </div>
          {locationError && (
            <div className="error-message" role="alert">
              {locationError}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
