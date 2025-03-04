import React, { useEffect, useRef } from 'react';
import styles from './FilterPanel.module.css';
import { AREAS } from '../../../constants/areas';
import { MARKERS } from '../../../constants/markers';
import type { AreaType, FilterPanelProps } from '../../../types/filter';

const FilterPanel: React.FC<FilterPanelProps> = ({
  pois,
  setAreaVisibility,
  isFilterPanelOpen,
  onCloseClick,
  localAreaVisibility,
  setLocalAreaVisibility,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

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
      color: MARKERS.colors[area as AreaType],
      icon: MARKERS.icons[area as AreaType],
    }));

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

  return (
    <div className={`${styles.filterpanelContainer} ${isFilterPanelOpen ? styles.open : ''}`}>
      {isFilterPanelOpen && (
        <div ref={panelRef} className={styles.filterPanel}>
          <button onClick={onCloseClick} className={styles.closeButton} aria-label="閉じる">
            ×
          </button>
          <h2>表示エリア</h2>
          <div className={styles.filterList}>
            {areas.map(({ area, name, count, isVisible, color, icon }) => (
              <label key={area} className={styles.filterItem}>
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
                <span className={styles.customCheckbox} style={{ borderColor: color }}></span>
                <div className={styles.filterDetails}>
                  <img src={icon} alt={`${name}のアイコン`} className={styles.markerIcon} aria-hidden="true" />
                  <span className={styles.areaName} data-fullname={name} title={name}>
                    {name}
                  </span>
                  <span>({count})</span>
                </div>
              </label>
            ))}
            <label className={styles.filterItem}>
              <input
                type="checkbox"
                checked={localAreaVisibility.CURRENT_LOCATION}
                onChange={() =>
                  setLocalAreaVisibility((prev) => ({
                    ...prev,
                    CURRENT_LOCATION: !prev.CURRENT_LOCATION,
                  }))
                }
                aria-label="現在地を表示"
              />
              <span className={styles.customCheckbox} style={{ borderColor: MARKERS.colors.CURRENT_LOCATION }}></span>
              <div className={styles.filterDetails}>
                <img
                  src={MARKERS.icons.CURRENT_LOCATION}
                  alt="現在地のアイコン"
                  className={styles.markerIcon}
                  aria-hidden="true"
                />
                <span className={styles.areaName} data-fullname="現在地" title="現在地">
                  現在地
                </span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
