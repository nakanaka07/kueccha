// hooks/useMarkerElement.ts
import { useMemo } from 'react';
import styles from '../components/Marker.module.css';
import { MARKER_ICONS } from '../../../../constants/markers';
import type { AreaType } from '../../../../types/common';

export function useMarkerElement(area: AreaType, name: string) {
  const createElement = useMemo(() => {
    const iconUrl = MARKER_ICONS[area] || MARKER_ICONS.DEFAULT;
    const element = document.createElement('div');

    // 基本スタイル設定
    element.style.backgroundImage = `url(${iconUrl})`;
    element.style.backgroundSize = 'contain';
    element.style.width = '36px';
    element.style.height = '36px';

    // アクセシビリティ設定
    element.setAttribute('tabindex', '0');
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', area === 'CURRENT_LOCATION' ? '現在地' : name);

    element.classList.add(styles.markerContent);

    // 特殊な状態のクラス追加
    if (area === 'RECOMMEND') {
      element.classList.add(styles.markerRecommendation);
      element.classList.add(styles.markerBlinking);
    } else if (area === 'CURRENT_LOCATION') {
      element.classList.add(styles.markerBlinking);
    }

    return element;
  }, [area, name]);

  return createElement;
}