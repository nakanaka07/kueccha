import React, { useEffect, useRef } from 'react';
import type { MarkerProps } from '../../../types';
import { MARKER_COLORS } from '../../../constants';
import '../../../App.css'; // スタイルシートをインポート

// Markerコンポーネント
const Marker = React.memo(({ poi, onClick, map }: MarkerProps) => {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

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
      content: pin.element,
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
