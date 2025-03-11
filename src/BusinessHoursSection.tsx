import React from 'react';
import { INFO_WINDOW_BUSINESS_HOURS } from './ui';
import type { BusinessHourKey } from './common';
import type { Poi } from '../../../core/types/poi';

interface BusinessHoursSectionProps {
  poi: Poi;
}

export const BusinessHoursSection: React.FC<BusinessHoursSectionProps> = ({ poi }) => {
  const hasBusinessHours = INFO_WINDOW_BUSINESS_HOURS.some((hour) => poi[hour.key as BusinessHourKey]);

  if (!hasBusinessHours) return null;

  return (
    <div className="infoSection">
      {INFO_WINDOW_BUSINESS_HOURS.map(
        (hour) =>
          poi[hour.key as BusinessHourKey] && (
            <div key={hour.key}>
              <span className="day">{hour.day}</span>
              <span className="value">{String(poi[hour.key as BusinessHourKey])}</span>
            </div>
          ),
      )}
    </div>
  );
};
