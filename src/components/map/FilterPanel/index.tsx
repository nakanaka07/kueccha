import React from 'react';
import type { FilterPanelProps, AreaType } from '../../../types';
import { AREAS } from '../../../constants';

// FilterPanelコンポーネント
const FilterPanel = ({ areaCounts, areaVisibility, onAreaToggle }: FilterPanelProps) => {
  // エリア情報を取得し、表示用のオブジェクトに変換
  const areas = Object.entries(AREAS).map(([area, name]) => ({
    area: area as AreaType,
    name,
    count: areaCounts[area as AreaType] ?? 0,
    isVisible: areaVisibility[area as AreaType] ?? true,
  }));

  return (
    <div role="region" aria-label="エリアフィルター">
      <div>
        <div>表示するエリア</div>
        <div>
          {areas.map(({ area, name, count, isVisible }) => (
            <label key={area}>
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => onAreaToggle(area, e.target.checked)}
                aria-label={`${name}を表示 (${count}件)`}
              />
              <div>
                <span aria-hidden="true" />
                <span>{name}</span>
                <span>({count})</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

// コンポーネントの表示名を設定
FilterPanel.displayName = 'FilterPanel';

export { FilterPanel };
export default FilterPanel;
