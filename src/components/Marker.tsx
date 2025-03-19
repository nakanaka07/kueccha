import React, { useEffect, useRef } from 'react';
import { MARKER_ICONS } from '../constants/constants';
import { MarkerProps } from '../types/types';

const Marker = React.memo(
  ({ poi, onClick, map, isSelected, zIndex }: MarkerProps & { isSelected: boolean; zIndex?: number }) => {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

    useEffect(() => {
      if (!map || !window.google.maps) return;

      const iconUrl = MARKER_ICONS[poi.area] || MARKER_ICONS.DEFAULT;
      const iconElement = document.createElement('div');
      iconElement.style.backgroundImage = `url(${iconUrl})`;
      iconElement.style.backgroundSize = 'contain';
      iconElement.style.width = '36px';
      iconElement.style.height = '36px';

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: poi.location,
        map,
        title: poi.name,
        content: iconElement,
        zIndex,
      });

      const handleClick = () => {
        onClick(poi);
      };

      marker.addListener('click', handleClick);
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
export { Marker };
export default Marker;
