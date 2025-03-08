/*
 * 機能: マーカーのDOM要素を生成するカスタムフック
 * 依存関係:
 *   - React useMemo
 *   - MARKER_ICONS定数 (マーカーアイコンのパス)
 *   - Marker.module.css (スタイリング)
 *   - AreaType型定義
 * 注意点:
 *   - エリアタイプに応じて適切なアイコンとスタイルを適用
 *   - アクセシビリティ対応（tabindex, role, aria-label）を含む
 *   - 現在地や推奨スポットには特別なスタイル（点滅効果など）を適用
 */

import { useMemo } from 'react';
import { MARKER_ICONS } from '../../../../constants/markers';
import styles from '../components/Marker.module.css';
import type { AreaType } from '../../../../types/common';

export function useMarkerElement(area: AreaType, name: string) {
  const createElement = useMemo(() => {
    const iconUrl = MARKER_ICONS[area] || MARKER_ICONS.DEFAULT;
    const element = document.createElement('div');

    element.style.backgroundImage = `url(${iconUrl})`;
    element.style.backgroundSize = 'contain';
    element.style.width = '36px';
    element.style.height = '36px';

    element.setAttribute('tabindex', '0');
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', area === 'CURRENT_LOCATION' ? '現在地' : name);

    element.classList.add(styles.markerContent);

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
