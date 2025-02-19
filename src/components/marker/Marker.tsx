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

      marker.addListener('click', () => {
        console.log('Marker clicked:', poi); // ログ出力を追加
        onClick(poi);
      });
      markerRef.current = marker;

      console.log('Marker added:', poi); // ログ出力を追加

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
          markerRef.current = null;
          console.log('Marker removed:', poi); // ログ出力を追加
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
          console.log('Marker selected:', poi); // ログ出力を追加
        } else {
          markerRef.current.content.classList.remove('marker-selected');
          console.log('Marker deselected:', poi); // ログ出力を追加
        }
      }
    }, [isSelected, poi]);

    return null;
  },
);

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
