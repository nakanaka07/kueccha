import React, { useEffect, useRef } from 'react';

import { MARKER_ICONS } from '../constants/constants';
import type { MarkerProps } from '../types/types';

export const Marker: React.FC<MarkerProps & { isSelected?: boolean; zIndex?: number }> = React.memo(
  ({ poi, onClick, map, zIndex }) => {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

    useEffect(() => {
      if (!map || !window.google.maps) return;

      const iconUrl = MARKER_ICONS[poi.area] || MARKER_ICONS.DEFAULT;
      const iconElement = document.createElement('div');
      iconElement.style.cssText = `
        background-image: url(${iconUrl});
        background-size: contain;
        width: 36px;
        height: 36px;
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: poi.location,
        map,
        title: poi.name,
        content: iconElement,
        zIndex,
      });

      marker.addListener('click', () => onClick(poi));
      markerRef.current = marker;

      return () => {
        if (markerRef.current) {
          google.maps.event.clearInstanceListeners(markerRef.current);
          markerRef.current.map = null;
          markerRef.current = null;
        }
      };
    }, [map, poi, onClick, zIndex]);

    return null;
  },
);

Marker.displayName = 'Marker';
