// FilterItem.tsx
import React from 'react';
import styles from './FilterPanel.module.css';
import type { AreaType } from '../../../types/common';

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
