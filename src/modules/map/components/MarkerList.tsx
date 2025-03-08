/*
 * 機能: マップ上にPOI（Point Of Interest）マーカーのリストを表示するコンポーネント
 * 依存関係:
 *   - React (memo)
 *   - Markerコンポーネント
 *   - useMapMarkers（マーカーのz-index管理フック）
 *   - 型定義: Poi
 * 注意点:
 *   - マップインスタンスがnullの場合は何も表示しない
 *   - POIリストが空の場合も何も表示しない
 *   - 選択中のマーカーを視覚的に区別するための状態管理
 *   - パフォーマンス向上のためにmemoで最適化
 */

import React, { memo } from 'react';
import { Marker } from '../../poi/components/Marker';
import { useMapMarkers } from '../hooks/useMapMarkers';
import type { Poi } from '../../../types/poi';

interface MarkerListProps {
  pois: Poi[];
  map: google.maps.Map | null;
  selectedPoi: Poi | null;
  onMarkerClick: (poi: Poi) => void;
}

const MarkerList: React.FC<MarkerListProps> = ({ pois, map, selectedPoi, onMarkerClick }) => {
  const { getMarkerZIndex } = useMapMarkers();

  if (!map || pois.length === 0) return null;

  return (
    <>
      {pois.map((poi) => (
        <Marker
          key={poi.id}
          poi={poi}
          map={map}
          onClick={onMarkerClick}
          isSelected={selectedPoi?.id === poi.id}
          zIndex={getMarkerZIndex(poi.area)}
        />
      ))}
    </>
  );
};

export default memo(MarkerList);
