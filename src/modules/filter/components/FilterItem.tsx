import React from 'react';
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

export const FilterItem: React.FC<FilterItemProps> = ({ label, area, count, isVisible, icon, onChange }) => {
  const handleChange = () => onChange(area, !isVisible);

  return (
    <label>
      <input type="checkbox" checked={isVisible} onChange={handleChange} aria-label={`${label}を表示`} />
      <span></span>
      <div>
        <img src={icon} alt={`${label}のアイコン`} aria-hidden="true" />
        <span data-fullname={label} title={label}>
          {label}
        </span>
        {count !== undefined && <span>({count})</span>}
      </div>
    </label>
  );
};
