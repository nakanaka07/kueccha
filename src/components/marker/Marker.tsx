import React, { useEffect, useRef } from 'react';
import type { MarkerProps } from '../../utils/types';
import { MARKER_COLORS } from '../../utils/constants';
import './Marker.css'; // スタイルシートをインポート

// マーカーアイコンのURLを定義
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

// Markerコンポーネント
const Marker = React.memo(({ poi, onClick, map }: MarkerProps) => {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    // マーカーアイコンを設定
    const iconUrl = markerIcons[poi.area] || markerIcons.DEFAULT;

    // カスタムアイコンの要素を作成
    const iconElement = document.createElement('div');
    iconElement.style.backgroundImage = `url(${iconUrl})`;
    iconElement.style.backgroundSize = 'contain';
    iconElement.style.width = '32px';
    iconElement.style.height = '32px';

    // ピンのスタイルを設定
    const pin = new google.maps.marker.PinElement({
      glyph: '',
      background: MARKER_COLORS[poi.area as keyof typeof MARKER_COLORS] || MARKER_COLORS.DEFAULT,
      borderColor: '#ffffff',
      scale: 1.0,
    });

    // マーカーを作成
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: poi.location,
      map,
      title: poi.name,
      content: pin.element, // ピンの要素を設定
      zIndex: poi.area === 'RECOMMEND' ? 1000 : 1, // 「おすすめ」のマーカーのzIndexを高く設定
    });

    // マーカークリック時のハンドラーを設定
    marker.addListener('click', () => onClick(poi));
    markerRef.current = marker;

    // 「おすすめ」のマーカーに点滅効果を追加
    if (poi.area === 'RECOMMEND' && marker.content instanceof HTMLElement) {
      marker.content.classList.add('blinking');
    }

    // クリーンアップ関数
    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
        google.maps.event.clearInstanceListeners(markerRef.current);
      }
    };
  }, [map, poi, onClick]);

  // 「おすすめ」のマーカーに点滅効果を追加
  useEffect(() => {
    if (
      poi.area === 'RECOMMEND' &&
      markerRef.current &&
      markerRef.current.content instanceof HTMLElement
    ) {
      markerRef.current.content.classList.add('blinking');
    }
  }, [poi]);

  return null;
});

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
