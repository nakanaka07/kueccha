import React, { useEffect, useRef } from 'react';
import type { MarkerProps } from '../../utils/types';
import './Marker.css';

import recommendIcon from '../../utils/images/ano_icon03.png';
import ryotsuAikawaIcon from '../../utils/images/shi_icon03.png';
import kanaiSawadaNiiboHatanoManoIcon from '../../utils/images/shi_icon03.png';
import akadomariHamochiOgiIcon from '../../utils/images/shi_icon03.png';
import snackIcon from '../../utils/images/shi_icon02.png';
import publicToiletIcon from '../../utils/images/ano_icon01.png';
import parkingIcon from '../../utils/images/shi_icon01.png';
import currentLocationIcon from '../../utils/images/ano_icon02.png';
import defaultIcon from '../../utils/images/row2.png';

// マーカーアイコンのパスを定義
const markerIcons: Record<string, string> = {
  RECOMMEND: recommendIcon,
  RYOTSU_AIKAWA: ryotsuAikawaIcon,
  KANAI_SAWADA_NIIBO_HATANO_MANO: kanaiSawadaNiiboHatanoManoIcon,
  AKADOMARI_HAMOCHI_OGI: akadomariHamochiOgiIcon,
  SNACK: snackIcon,
  PUBLIC_TOILET: publicToiletIcon,
  PARKING: parkingIcon,
  CURRENT_LOCATION: currentLocationIcon, // 現在地マーカーアイコンのパスを追加
  DEFAULT: defaultIcon, // デフォルトのアイコン画像を追加
};

const Marker = React.memo(
  ({
    poi,
    onClick,
    map,
    isSelected,
  }: MarkerProps & { isSelected: boolean }) => {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
      null,
    );

    useEffect(() => {
      if (!map || !window.google?.maps) return;

      const iconUrl = markerIcons[poi.area] || markerIcons.DEFAULT;

      // カスタムアイコンを設定
      const iconElement = document.createElement('div');
      iconElement.style.backgroundImage = `url(${iconUrl})`;
      iconElement.style.backgroundSize = 'contain';
      iconElement.style.width = '32px';
      iconElement.style.height = '32px';

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: poi.location,
        map,
        title: poi.name,
        content: iconElement,
        zIndex:
          poi.area === 'CURRENT_LOCATION'
            ? 2000
            : poi.area === 'RECOMMEND'
              ? 1000
              : 1,
      });

      marker.addListener('click', () => onClick(poi));
      markerRef.current = marker;

      // 'RECOMMEND' または 'CURRENT_LOCATION' の場合に 'blinking' クラスを追加
      if (poi.area === 'RECOMMEND' || poi.area === 'CURRENT_LOCATION') {
        iconElement.classList.add('blinking');
      }

      return () => {
        if (markerRef.current) {
          markerRef.current.map = null;
          google.maps.event.clearInstanceListeners(markerRef.current);
        }
      };
    }, [map, poi, onClick]);

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
