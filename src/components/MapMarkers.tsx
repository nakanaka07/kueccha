import { InfoWindow as GoogleInfoWindow } from '@react-google-maps/api';
import React, { useState, useCallback } from 'react';

import InfoWindow from '@/components/InfoWindow';
import { useFilteredPOIs } from '@/hooks/useFilteredPOIs';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useMarkerVisibility } from '@/hooks/useMarkerVisibility';
import { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';



interface MapMarkersProps {
  /**
   * 表示するPOIデータの配列
   */
  pois: PointOfInterest[];

  /**
   * マップの参照
   */
  mapRef: React.MutableRefObject<google.maps.Map | null>;

  /**
   * フィルタリング条件
   */
  filters?: {
    categories?: string[];
    isOpen?: boolean;
    searchText?: string;
  };

  /**
   * POI選択時のコールバック
   */
  onSelectPOI?: (poi: PointOfInterest) => void;

  /**
   * POI詳細表示時のコールバック
   */
  onViewDetails?: (poi: PointOfInterest) => void;
  
  /**
   * マーカーアニメーションを有効にするか
   */
  animateMarkers?: boolean;
  
  /**
   * マーカークラスタリングを有効にするか
   */
  enableClustering?: boolean;
}

/**
 * 地図上のマーカーを管理するコンポーネント
 * POIデータをもとにマーカーの表示と管理、クラスタリングを行います
 */
const MapMarkers: React.FC<MapMarkersProps> = ({
  pois,
  mapRef,
  filters = {},
  onSelectPOI,
  onViewDetails,
  animateMarkers = true,
  enableClustering = true
}) => {
  // 選択されたPOI（情報ウィンドウに表示するもの）
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);

  // フィルタリングされたPOIリストを取得（カスタムフックに移行）
  const filteredPOIs = useFilteredPOIs(pois, filters);

  // マーカークリック時のハンドラ
  const handleMarkerClick = useCallback((poi: PointOfInterest) => {
    logger.debug('マーカークリック', { poiName: poi.name });
    setSelectedPOI(poi);
    onSelectPOI?.(poi);
  }, [onSelectPOI]);

  // 情報ウィンドウを閉じるハンドラ
  const handleInfoWindowClose = useCallback(() => {
    setSelectedPOI(null);
  }, []);

  // POI詳細表示ハンドラ
  const handleViewDetails = useCallback((poi: PointOfInterest) => {
    onViewDetails?.(poi);
  }, [onViewDetails]);

  // マーカーとクラスタリングの管理（カスタムフックに移行）
  const { markers, clusterer } = useMapMarkers({
    mapRef,
    pois: filteredPOIs,
    onMarkerClick: handleMarkerClick,
    animateMarkers,
    enableClustering
  });

  // マーカー可視性の最適化（カスタムフックに移行）
  useMarkerVisibility({
    mapRef,
    markers,
    pois: filteredPOIs,
    onVisibilityChange: (visibleCount) => {
      logger.debug(`表示マーカー数: ${visibleCount}/${markers.length}`);
    }
  });

  // 情報ウィンドウが表示されている場合のみレンダリング（パフォーマンス最適化）
  if (!selectedPOI) return null;

  return (
    <GoogleInfoWindow
      position={{ lat: selectedPOI.lat, lng: selectedPOI.lng }}
      onCloseClick={handleInfoWindowClose}
      options={{
        pixelOffset: new google.maps.Size(0, -40), // マーカーの高さを考慮
        maxWidth: 320, // モバイル画面でも見やすい幅
        disableAutoPan: false, // 情報ウィンドウが見えるように地図を自動調整
      }}
    >
      <div className="info-window-container">
        <InfoWindow
          poi={selectedPOI}
          onClose={handleInfoWindowClose}
          onViewDetails={handleViewDetails}
        />
      </div>
    </GoogleInfoWindow>
  );
};

export default MapMarkers;