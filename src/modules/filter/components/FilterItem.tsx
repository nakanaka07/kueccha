/*
 * 機能: フィルター項目コンポーネント - 単一エリアの表示/非表示を切り替えるUI
 * 依存関係:
 *   - React
 *   - FilterPanel.module.css スタイル
 *   - AreaType 型定義
 * 注意点:
 *   - カスタムスタイルのチェックボックスを使用しています
 *   - エリアの色に応じたボーダーカラーが適用されます
 *   - アクセシビリティに配慮したラベルとaria属性を使用しています
 */

import React from 'react';
import styles from './FilterPanel.module.css';
import type { AreaType } from '../../../core/types/common';

interface FilterItemProps {
  label: string;
  area: AreaType;
  count?: number;
  isVisible: boolean;
  color: string;
  icon: string;
  onChange: (area: AreaType, isVisible: boolean) => void;
}

export const FilterItem: React.FC<FilterItemProps> = ({ label, area, count, isVisible, color, icon, onChange }) => {
  const handleChange = () => onChange(area, !isVisible);

  return (
    <label className={styles.filterItem}>
      <input type="checkbox" checked={isVisible} onChange={handleChange} aria-label={`${label}を表示`} />
      <span className={styles.customCheckbox} style={{ borderColor: color }}></span>
      <div className={styles.filterDetails}>
        <img src={icon} alt={`${label}のアイコン`} className={styles.markerIcon} aria-hidden="true" />
        <span className={styles.areaName} data-fullname={label} title={label}>
          {label}
        </span>
        {count !== undefined && <span>({count})</span>}
      </div>
    </label>
  );
};
