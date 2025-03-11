import { useRef, useEffect } from 'react';
import type { LatLngLiteral } from '../../../core/types/common';

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
      if (markerRef.current) {
        markerRef.current.position = position;
        return;
      }

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
