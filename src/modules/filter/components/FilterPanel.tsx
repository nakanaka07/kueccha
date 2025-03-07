import React, { useRef } from 'react';
import { FilterItem } from './FilterItem';
import styles from './FilterPanel.module.css';
import { useAreaFilters } from '../hooks/useAreaFilters';
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

  // カスタムフックを使用してデータ処理ロジックを分離
  const { areas, currentLocationData } = useAreaFilters(pois, localAreaVisibility, setAreaVisibility);

  // チェックボックス変更のハンドラー
  const handleAreaChange = (area: AreaType, isVisible: boolean) => {
    setLocalAreaVisibility((prev) => ({
      ...prev,
      [area]: isVisible,
    }));
  };

  if (!isFilterPanelOpen) {
    return <div className={styles.filterpanelContainer} />;
  }

  return (
    <div className={`${styles.filterpanelContainer} ${styles.open}`}>
      <div ref={panelRef} className={styles.filterPanel}>
        <button onClick={onCloseClick} className={styles.closeButton} aria-label="閉じる">
          ×
        </button>

        <h2>表示エリア</h2>

        <div className={styles.filterList}>
          {/* エリア一覧をマッピング */}
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

          {/* 現在地のフィルター項目 */}
          <FilterItem
            area="CURRENT_LOCATION"
            label="現在地"
            isVisible={currentLocationData.isVisible}
            color={currentLocationData.color}
            icon={currentLocationData.icon}
            onChange={handleAreaChange}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
