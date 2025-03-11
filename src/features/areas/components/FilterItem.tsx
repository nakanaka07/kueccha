import React, { ChangeEvent } from 'react';
import { useCurrentLocation } from '../../../core/hooks/useCurrentLocation';
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

export function FilterItem({ label, area, count, isVisible, icon, onChange }: FilterItemProps) {
  const { currentLocationPoi } = useCurrentLocation();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (area === 'CURRENT_LOCATION' && e.target.checked) {
      onChange(area, e.target.checked);
    } else {
      onChange(area, e.target.checked);
    }
  };

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
}
