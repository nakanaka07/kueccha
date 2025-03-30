import { InfoWindow as GoogleInfoWindow } from '@react-google-maps/api';
import React, { useState, useCallback, memo, useMemo } from 'react';

import InfoWindow from '@/components/InfoWindow';
import { useFilteredPOIs } from '@/hooks/useFilteredPOIs';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useMarkerVisibility } from '@/hooks/useMarkerVisibility';
import { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';

// マーカーがAdvancedMarkerElementかどうかを判定する型ガード関数
function isAdvancedMarkerElement(
  marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker
): marker is google.maps.marker.AdvancedMarkerElement {
  return 'content' in marker;
}

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
  enableClustering = true,
}) => {
  // 選択されたPOI（情報ウィンドウに表示するもの）
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);

  // フィルタリングされたPOIリストを取得（カスタムフックに移行）
  const filteredPOIs = useFilteredPOIs(pois, filters);

  // フィルタリング結果を記録（デバッグとパフォーマンス監視）
  useMemo(() => {
    logger.debug('POIフィルタリング結果', {
      total: pois.length,
      filtered: filteredPOIs.length,
      filters: {
        categories: filters.categories?.length ?? 0,
        isOpenFilter: filters.isOpen ?? false,
        hasSearchText: !!filters.searchText,
      },
    });
  }, [filteredPOIs.length, pois.length, filters]);

  // マーカークリック時のハンドラ
  const handleMarkerClick = useCallback(
    (poi: PointOfInterest) => {
      logger.info('マーカークリック', {
        poiId: poi.id,
        poiName: poi.name,
        category: poi.category,
      });
      setSelectedPOI(poi);
      onSelectPOI?.(poi);
    },
    [onSelectPOI]
  );

  // 情報ウィンドウを閉じるハンドラ
  const handleInfoWindowClose = useCallback(() => {
    logger.debug('情報ウィンドウを閉じました');
    setSelectedPOI(null);
  }, []);

  // POI詳細表示ハンドラ
  const handleViewDetails = useCallback(
    (poi: PointOfInterest) => {
      logger.info('POI詳細表示', { poiId: poi.id, poiName: poi.name });
      onViewDetails?.(poi);
    },
    [onViewDetails]
  );

  // マーカーとクラスタリングの管理（カスタムフックに移行）
  const { markers: mixedMarkers } = useMapMarkers({
    mapRef,
    pois: filteredPOIs,
    onMarkerClick: handleMarkerClick,
    animateMarkers,
    enableClustering,
  });

  // AdvancedMarkerElementのみにフィルタリング
  const markers = useMemo(() => {
    return mixedMarkers.filter(isAdvancedMarkerElement);
  }, [mixedMarkers]);

  // マーカー可視性の最適化（カスタムフックに移行）
  useMarkerVisibility({
    mapRef,
    markers,
    pois: filteredPOIs,
    onVisibilityChange: useCallback(
      visibleCount => {
        logger.measureTime('マーカー可視性更新', () => {
          logger.debug(`表示マーカー数: ${visibleCount}/${markers.length}`, {
            visiblePercent: markers.length ? Math.round((visibleCount / markers.length) * 100) : 0,
            totalMarkers: markers.length,
          });
        });
      },
      [markers.length]
    ),
  });

  // 情報ウィンドウのメモ化（パフォーマンス最適化）
  const infoWindowContent = useMemo(() => {
    if (!selectedPOI) return null;

    return (
      <InfoWindow
        poi={selectedPOI}
        onClose={handleInfoWindowClose}
        onViewDetails={handleViewDetails}
      />
    );
  }, [selectedPOI, handleInfoWindowClose, handleViewDetails]);

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
      <div className='info-window-container'>{infoWindowContent}</div>
    </GoogleInfoWindow>
  );
};

// React.memoでコンポーネントをメモ化（不要な再レンダリングを防止）
export default memo(MapMarkers);
