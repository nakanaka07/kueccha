import React from 'react';
import { useMarkerElement } from '../hooks/useMarkerElement';
import { useMarkerInstance } from '../hooks/useMarkerInstance';
import { useMarkerInteraction } from '../hooks/useMarkerInteraction';
import type { MarkerProps } from '../../../types/poi';

const Marker = React.memo(
  ({ poi, onClick, map, isSelected, zIndex }: MarkerProps & { isSelected: boolean; zIndex?: number }) => {
    // マーカー要素の作成
    const markerElement = useMarkerElement(poi.area, poi.name);

    // マーカーインスタンスの管理
    const markerRef = useMarkerInstance({
      position: poi.location,
      map,
      title: poi.name,
      zIndex,
      content: markerElement,
    });

    // イベントとインタラクションの処理
    useMarkerInteraction({
      marker: markerRef.current,
      poi,
      onClick,
      isSelected,
    });

    // このコンポーネントはDOM要素をレンダリングしない
    return null;
  },
);

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
