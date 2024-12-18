// src/AdvancedMarker.tsx
import React, { useEffect, useRef } from 'react';
import type { Poi } from './types';

interface AdvancedMarkerProps {
  position: google.maps.LatLngLiteral;
  map: google.maps.Map | null;
  title: string;
  color: string;
  onClick: (poi: Poi) => void;
  poi: Poi;
}

const AdvancedMarker: React.FC<AdvancedMarkerProps> = ({ position, map, title, color, onClick, poi }) => {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    // mapがない場合は早期リターン
    if (!map) return;

    // マーカーの作成
    markerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      title,
      icon: {
        url: `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%98%85|${color}`,
        scaledSize: new google.maps.Size(30, 30),
      },
    });

    // クリックリスナーを追加
    const listener = markerRef.current.addListener("click", () => onClick(poi));

    // クリーンアップ関数: コンポーネントがアンマウントされる際に、マーカーとリスナーを削除
    return () => {
      if (markerRef.current) {
        google.maps.event.removeListener(listener);
        markerRef.current.setMap(null);
      }
    };

    // 依存配列: 全てのpropsを指定することで、propsが変更された際にuseEffectが再実行される
    // これにより、マーカーの位置、タイトル、色などが更新された際に、マーカーが再描画される
  }, [map, position, title, color, onClick, poi]);

  return null; // AdvancedMarkerはラッパーコンポーネントなので、JSXを返さない
};

export default AdvancedMarker;

