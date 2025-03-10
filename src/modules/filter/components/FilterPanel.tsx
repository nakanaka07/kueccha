/*
 * 機能: フィルターパネルコンポーネント - エリア表示/非表示の操作UIを提供
 * 依存関係:
 *   - React
 *   - FilterItem コンポーネント
 *   - useAreaFilters フック
 *   - FilterPanel.module.css スタイル
 *   - AreaType, FilterPanelProps 型定義
 * 注意点:
 *   - isFilterPanelOpenプロパティによって表示/非表示が切り替わります
 *   - 各エリアの表示状態はlocalAreaVisibilityで管理し、setAreaVisibilityで親コンポーネントに伝達します
 *   - レスポンシブデザインに対応しています
 */

import React, { useRef } from 'react';
import { FilterItem } from './FilterItem';
import styles from './FilterPanel.module.css';
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
