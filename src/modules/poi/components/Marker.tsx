/*
 * 機能: Google Maps上にPOIマーカーを表示するReactコンポーネント
 * 依存関係:
 *   - React
 *   - useMarkerElement, useMarkerInstance, useMarkerInteractionフック
 *   - MarkerProps型定義
 * 注意点:
 *   - React.memoでパフォーマンス最適化
 *   - このコンポーネントはDOM要素を直接レンダリングしない
 *   - 選択状態やz-indexをプロパティとして受け取る
 */

import React from 'react';
import { useMarkerElement } from '../hooks/useMarkerElement';
import { useMarkerInstance } from '../hooks/useMarkerInstance';
import { useMarkerInteraction } from '../hooks/useMarkerInteraction';
import type { MarkerProps } from '../../../core/types/poi';

const Marker = React.memo(
  ({ poi, onClick, map, isSelected, zIndex }: MarkerProps & { isSelected: boolean; zIndex?: number }) => {
    const markerElement = useMarkerElement(poi.area, poi.name);

    const markerRef = useMarkerInstance({
      position: poi.location,
      map,
      title: poi.name,
      zIndex,
      content: markerElement,
    });

    useMarkerInteraction({
      marker: markerRef.current,
      poi,
      onClick,
      isSelected,
    });

    return null;
  },
);

Marker.displayName = 'Marker';

export { Marker };
export default Marker;
