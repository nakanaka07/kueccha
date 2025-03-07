// hooks/useMarkerInstance.ts
import { useRef, useEffect } from 'react';
import type { LatLngLiteral } from '../../../../types/map';

interface UseMarkerInstanceProps {
  position: LatLngLiteral;
  map: google.maps.Map | null;
  title: string;
  zIndex?: number;
  content: HTMLElement;
}

export function useMarkerInstance({ position, map, title, zIndex, content }: UseMarkerInstanceProps) {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    try {
      // 既存マーカーの位置更新
      if (markerRef.current) {
        markerRef.current.position = position;
        return;
      }

      // 新規マーカー作成
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map,
        title,
        zIndex,
        content,
      });

      markerRef.current = marker;
    } catch (error) {
      console.error('マーカー作成中にエラーが発生しました:', error);
    }

    // クリーンアップ
    return () => {
      if (markerRef.current) {
        google.maps.event.clearInstanceListeners(markerRef.current);
        markerRef.current.map = null;
        markerRef.current = null;
      }
    };
  }, [map, position, title, zIndex, content]);

  return markerRef;
}
