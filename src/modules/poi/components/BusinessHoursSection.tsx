/*
 * 機能: POIの営業時間情報を表示するコンポーネント
 * 依存関係:
 *   - React
 *   - InfoWindow.module.css (スタイリング)
 *   - INFO_WINDOW_BUSINESS_HOURS定数 (曜日と表示名のマッピング)
 *   - Poi, BusinessHourKey型定義
 * 注意点:
 *   - 営業時間情報が存在しない場合は何も表示しない
 *   - 存在する営業時間情報のみ表示
 */

import React from 'react';
import styles from './InfoWindow.module.css';
import { INFO_WINDOW_BUSINESS_HOURS } from '../../../constants/ui';
import type { Poi, BusinessHourKey } from '../../../types/poi';

interface BusinessHoursSectionProps {
  poi: Poi;
}

export const BusinessHoursSection: React.FC<BusinessHoursSectionProps> = ({ poi }) => {
  const hasBusinessHours = INFO_WINDOW_BUSINESS_HOURS.some((hour) => poi[hour.key as BusinessHourKey]);

  if (!hasBusinessHours) return null;

  return (
    <div className={styles.infoSection}>
      {INFO_WINDOW_BUSINESS_HOURS.map(
        (hour) =>
          poi[hour.key as BusinessHourKey] && (
            <div key={hour.key}>
              <span className={styles.day}>{hour.day}</span>
              <span className={styles.value}>{poi[hour.key as BusinessHourKey]}</span>
            </div>
          ),
      )}
    </div>
  );
};
