import React, { useEffect, useRef, useMemo } from 'react';

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

    if (JSON.stringify(sortedAreaVisibility) !== JSON.stringify(localAreaVisibility)) {
      setAreaVisibility(sortedAreaVisibility);
    }
  }, [localAreaVisibility, setAreaVisibility]);

  const areaCounts = useMemo(
    () =>
      pois.reduce(
        (acc: Record<AreaType, number>, poi) => ({
          ...acc,
          [poi.area]: (acc[poi.area] || 0) + 1,
        }),
        {} as Record<AreaType, number>,
      ),
    [pois],
  );

  const areas = useMemo(
    () =>
      Object.entries(AREAS)
        .filter(([area]) => area !== 'CURRENT_LOCATION')
        .map(([area, name]) => ({
          area: area as AreaType,
          name,
          count: areaCounts[area as AreaType] ?? 0,
          isVisible: localAreaVisibility[area as AreaType],
          color: MARKER_CONFIG.colors[area as AreaType],
          icon: MARKER_CONFIG.icons[area as AreaType],
        })),
    [areaCounts, localAreaVisibility],
  );

  if (!isFilterPanelOpen) {
    return null;
  }

  return (
    <div>
      <div ref={panelRef}>
        <button onClick={onCloseClick} aria-label="閉じる">
          ×
        </button>
        <h2>表示エリア</h2>
        <div>
          {areas.map(({ area, name, count, isVisible, color, icon }) => (
            <label key={area}>
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
              <span />
              <div>
                <img src={icon} alt={`${name}のアイコン`} aria-hidden="true" />
                <span title={name}>{name}</span>
                <span>({count})</span>
              </div>
            </label>
          ))}
          <label>
            <input
              type="checkbox"
              checked={localAreaVisibility.CURRENT_LOCATION}
              onChange={(e) => handleCurrentLocationChange(e.target.checked)}
              aria-label="現在地を表示"
            />
            <span />
            <div>
              <img src={MARKER_CONFIG.icons.CURRENT_LOCATION} alt="現在地のアイコン" aria-hidden="true" />
              <span title="現在地">現在地</span>
            </div>
          </label>
        </div>
        {locationError && <div role="alert">{locationError}</div>}
      </div>
    </div>
  );
};

export default FilterPanel;
