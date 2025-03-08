/*
 * 機能: Google Mapsのマーカーインスタンスを作成・管理するフック
 * 依存関係:
 *   - React useRef, useEffect
 *   - Google Maps JavaScript API (marker.AdvancedMarkerElement)
 *   - LatLngLiteral型定義
 * 注意点:
 *   - Google Maps APIが初期化されていることが前提
 *   - マーカーのライフサイクル管理（生成・更新・削除）を担当
 *   - マウント解除時にマーカーの参照を適切にクリーンアップ
 */

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
