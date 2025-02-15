import React, { useEffect, useRef } from 'react';
import './Marker.css';
import { MARKER_ICONS } from '../../utils/constants';
import { MarkerProps } from '../../utils/types';

const Marker = React.memo(
  ({
    poi,
    onClick,
    map,
    isSelected,
    zIndex,
  }: MarkerProps & { isSelected: boolean; zIndex?: number }) => {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
      null,
    );

    useEffect(() => {
      if (!map || !window.google?.maps) return;

      const iconUrl = MARKER_ICONS[poi.area] || MARKER_ICONS.DEFAULT;

      const iconElement = document.createElement('div');
      iconElement.style.backgroundImage = `url(${iconUrl})`;
      iconElement.style.backgroundSize = 'contain';
      iconElement.style.width = '40px';
      iconElement.style.height = '40px';

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: poi.location,
        map,
        title: poi.name,
        content: iconElement,
        zIndex,
      });

      marker.addListener('click', () => onClick(poi));
      markerRef.current = marker;

      if (poi.area === 'RECOMMEND') {
        iconElement.classList.add('marker-recommendation');
        iconElement.classList.add('marker-blinking');
      } else if (poi.area === 'CURRENT_LOCATION') {
        iconElement.classList.add('marker-blinking');
      }

      return () => {
        if (markerRef.current) {
          markerRef.current.map = null;
          google.maps.event.clearInstanceListeners(markerRef.current);
        }
      };
    }, [map, poi, onClick, zIndex]);

    useEffect(() => {
      if (
        markerRef.current &&
        markerRef.current.content instanceof HTMLElement
      ) {
        if (isSelected) {
          markerRef.current.content.classList.add('marker-selected');
        } else {
          markerRef.current.content.classList.remove('marker-selected');
        }
      }
    }, [isSelected]);

    return null;
  },
);

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
