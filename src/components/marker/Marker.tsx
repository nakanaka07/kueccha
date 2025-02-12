import React, { useEffect, useRef } from 'react';
import type { MarkerProps, Poi } from '../../utils/types';
import './Marker.css';
import recommendIcon from '../../utils/images/ano_icon_recommend.png';
import ryotsuAikawaIcon from '../../utils/images/icon_map01.png';
import kanaiSawadaNiiboHatanoManoIcon from '../../utils/images/icon_map02.png';
import akadomariHamochiOgiIcon from '../../utils/images/icon_map03.png';
import snackIcon from '../../utils/images/shi_icon02.png';
import publicToiletIcon from '../../utils/images/ano_icon01.png';
import parkingIcon from '../../utils/images/shi_icon01.png';
import currentLocationIcon from '../../utils/images/shi_icon04.png';
import defaultIcon from '../../utils/images/row2.png';

const markerIcons: Record<string, string> = {
  RECOMMEND: recommendIcon,
  RYOTSU_AIKAWA: ryotsuAikawaIcon,
  KANAI_SAWADA_NIIBO_HATANO_MANO: kanaiSawadaNiiboHatanoManoIcon,
  AKADOMARI_HAMOCHI_OGI: akadomariHamochiOgiIcon,
  SNACK: snackIcon,
  PUBLIC_TOILET: publicToiletIcon,
  PARKING: parkingIcon,
  CURRENT_LOCATION: currentLocationIcon,
  DEFAULT: defaultIcon,
};

const Marker = React.memo(
  ({
    poi,
    onClick,
    map,
    isSelected,
    zIndex, // zIndexプロパティを追加
  }: MarkerProps & { isSelected: boolean; zIndex?: number }) => {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
      null,
    );

    useEffect(() => {
      if (!map || !window.google?.maps) return;

      const iconUrl = markerIcons[poi.area] || markerIcons.DEFAULT;

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
        zIndex, // zIndexを設定
      });

      marker.addListener('click', () => onClick(poi));
      markerRef.current = marker;

      if (poi.area === 'RECOMMEND' || poi.area === 'CURRENT_LOCATION') {
        iconElement.classList.add('blinking');
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
          markerRef.current.content.classList.add('selected-marker');
        } else {
          markerRef.current.content.classList.remove('selected-marker');
        }
      }
    }, [isSelected]);

    return null;
  },
);

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
