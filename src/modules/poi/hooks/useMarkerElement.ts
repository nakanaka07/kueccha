import { useMemo } from 'react';
import { MARKER_ICONS } from '../../../core/constants/markers';
import type { AreaType } from '../../../core/types/common';

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

    element.classList.add('markerContent');

    if (area === 'RECOMMEND') {
      element.classList.add('markerRecommendation');
      element.classList.add('markerBlinking');
    } else if (area === 'CURRENT_LOCATION') {
      element.classList.add('markerBlinking');
    }

    return element;
  }, [area, name]);

  return createElement;
}
