import React, { useEffect, useRef } from 'react';
import type { MarkerProps } from '../../utils/types';
import { MARKER_COLORS } from '../../utils/constants';
import './Marker.css';

const markerIcons: Record<string, string> = {
  RECOMMEND: '/path/to/recommend-icon.png',
  RYOTSU_AIKAWA: '/path/to/ryotsu-aikawa-icon.png',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '/path/to/kanai-sawada-icon.png',
  AKADOMARI_HAMOCHI_OGI: '/path/to/akadomari-hamochi-icon.png',
  SNACK: '/path/to/snack-icon.png',
  PUBLIC_TOILET: '/path/to/public-toilet-icon.png',
  PARKING: '/path/to/parking-icon.png',
  DEFAULT: '/path/to/default-icon.png',
};

const Marker = React.memo(({ poi, onClick, map, isSelected }: MarkerProps & { isSelected: boolean }) => {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    const iconUrl = markerIcons[poi.area] || markerIcons.DEFAULT;

    const iconElement = document.createElement('div');
    iconElement.style.backgroundImage = `url(${iconUrl})`;
    iconElement.style.backgroundSize = 'contain';
    iconElement.style.width = '32px';
    iconElement.style.height = '32px';

    const pin = new google.maps.marker.PinElement({
      glyph: '',
      background: MARKER_COLORS[poi.area as keyof typeof MARKER_COLORS] || MARKER_COLORS.DEFAULT,
      borderColor: '#ffffff',
      scale: 1.0,
    });

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: poi.location,
      map,
      title: poi.name,
      content: pin.element,
      zIndex: poi.area === 'RECOMMEND' ? 1000 : 1,
    });

    marker.addListener('click', () => onClick(poi));
    markerRef.current = marker;

    if (poi.area === 'RECOMMEND' && marker.content instanceof HTMLElement) {
      marker.content.classList.add('blinking');
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
        google.maps.event.clearInstanceListeners(markerRef.current);
      }
    };
  }, [map, poi, onClick]);

  useEffect(() => {
    if (markerRef.current && markerRef.current.content instanceof HTMLElement) {
      if (isSelected) {
        markerRef.current.content.classList.add('selected-marker');
      } else {
        markerRef.current.content.classList.remove('selected-marker');
      }
    }
  }, [isSelected]);

  return null;
});

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
