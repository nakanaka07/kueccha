import React, { useEffect, useRef } from 'react';
import type { MarkerProps } from '../../utils/types';
import './Marker.css';

// マーカーアイコンのパスを定義
const markerIcons: Record<string, string> = {
  RECOMMEND: '/src/utils/images/ano_icon03.png',
  RYOTSU_AIKAWA: '/src/utils/images/shi_icon03.png',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '/src/utils/images/shi_icon03.png',
  AKADOMARI_HAMOCHI_OGI: '/src/utils/images/shi_icon03.png',
  SNACK: '/src/utils/images/shi_icon02.png',
  PUBLIC_TOILET: '/src/utils/images/ano_icon01.png',
  PARKING: '/src/utils/images/shi_icon01.png',
  CURRENT_LOCATION: '/src/utils/images/ano_icon02.png', // 現在地マーカーアイコンのパスを追加
  DEFAULT: '/src/utils/images/row2.png', // デフォルトのアイコン画像を追加
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
