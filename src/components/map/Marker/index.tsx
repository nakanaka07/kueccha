import React, { useEffect, useRef } from 'react';
import type { MarkerProps } from '../../../types';
import { MARKER_COLORS } from '../../../constants';

// Markerコンポーネント
const Marker = React.memo(({ poi, onClick, map }: MarkerProps) => {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    // ピンのスタイルを設定
    const pin = new google.maps.marker.PinElement({
      glyph: '',
      background: MARKER_COLORS[poi.area] || MARKER_COLORS.DEFAULT,
      borderColor: '#ffffff',
      scale: 1.0,
    });

    // マーカーを作成
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: poi.location,
      map,
      title: poi.name,
      content: pin.element,
    });

    // マーカークリック時のハンドラーを設定
    marker.addListener('click', () => onClick(poi));
    markerRef.current = marker;

    // クリーンアップ関数
    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
        google.maps.event.clearInstanceListeners(markerRef.current);
      }
    };
  }, [map, poi, onClick]);

  return null;
});

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
