import { InfoWindow as GoogleInfoWindow } from '@react-google-maps/api';
import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';

import InfoWindow from '@/components/InfoWindow';
import { useFilteredPOIs } from '@/hooks/useFilteredPOIs';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useMarkerVisibility } from '@/hooks/useMarkerVisibility';
import type { PointOfInterest } from '@/types/poi';
import { ENV } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';

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
   * @default ENV.features.markerAnimation
   */
  animateMarkers?: boolean;

  /**
   * マーカークラスタリングを有効にするか
   * @default ENV.features.markerClustering
   */
  enableClustering?: boolean;
}

const COMPONENT_NAME = 'MapMarkers';

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
  animateMarkers = ENV.features.markerAnimation ?? true,
  enableClustering = ENV.features.markerClustering ?? true,
}) => {
  // コンポーネントのマウント/アンマウントを記録
  useEffect(() => {
    logger.info('マーカー管理コンポーネントが初期化されました', {
      component: COMPONENT_NAME,
      action: 'init',
      poisCount: pois.length,
    });

    return () => {
      logger.info('マーカー管理コンポーネントがクリーンアップされました', {
        component: COMPONENT_NAME,
        action: 'cleanup',
      });
    };
  }, [pois.length]);

  // 選択されたPOI（情報ウィンドウに表示するもの）
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);

  // フィルタリングされたPOIリストを取得（カスタムフックに移行）
  const filteredPOIs = useFilteredPOIs(pois, filters);

  // フィルタリング結果を記録（デバッグとパフォーマンス監視）
  useEffect(() => {
    // パフォーマンス測定を追加
    logger.measureTime(
      'POIフィルタリング処理',
      () => {
        logger.debug('POIフィルタリング結果', {
          component: COMPONENT_NAME,
          action: 'filter_pois',
          total: pois.length,
          filtered: filteredPOIs.length,
          filterRatio: pois.length ? Math.round((filteredPOIs.length / pois.length) * 100) : 0,
          filters: {
            categories: filters.categories?.length ?? 0,
            isOpenFilter: filters.isOpen ?? false,
            hasSearchText: !!filters.searchText,
          },
        });
      },
      // 処理時間が100ms超の場合はINFOレベルでログ出力
      LogLevel.DEBUG,
      { component: COMPONENT_NAME },
      100
    );
  }, [filteredPOIs.length, pois.length, filters.categories, filters.isOpen, filters.searchText]);

  // マーカークリック時のハンドラ
  const handleMarkerClick = useCallback(
    (poi: PointOfInterest) => {
      try {
        logger.info('マーカークリック', {
          component: COMPONENT_NAME,
          action: 'marker_click',
          entityId: poi.id,
          entityName: poi.name,
          category: poi.category,
        });
        setSelectedPOI(poi);
        onSelectPOI?.(poi);
      } catch (error) {
        logger.error('マーカークリック処理でエラーが発生しました', {
          component: COMPONENT_NAME,
          action: 'marker_click_error',
          error,
          poiId: poi.id,
        });
      }
    },
    [onSelectPOI]
  );

  // 情報ウィンドウを閉じるハンドラ
  const handleInfoWindowClose = useCallback(() => {
    logger.debug('情報ウィンドウを閉じました', {
      component: COMPONENT_NAME,
      action: 'close_info_window',
      entityId: selectedPOI?.id,
    });
    setSelectedPOI(null);
  }, [selectedPOI?.id]);

  // POI詳細表示ハンドラ
  const handleViewDetails = useCallback(
    (poi: PointOfInterest) => {
      try {
        logger.info('POI詳細表示', {
          component: COMPONENT_NAME,
          action: 'view_details',
          entityId: poi.id,
          entityName: poi.name,
        });
        onViewDetails?.(poi);
      } catch (error) {
        logger.error('POI詳細表示処理でエラーが発生しました', {
          component: COMPONENT_NAME,
          action: 'view_details_error',
          error,
          poiId: poi.id,
        });
      }
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
            component: COMPONENT_NAME,
            action: 'update_visibility',
            visibleCount,
            totalMarkers: markers.length,
            visiblePercent: markers.length ? Math.round((visibleCount / markers.length) * 100) : 0,
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

  // 情報ウィンドウが表示されていない場合は何もレンダリングしない
  if (!selectedPOI) return null;

  // 情報ウィンドウのレンダリング
  try {
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
  } catch (error) {
    logger.error('情報ウィンドウのレンダリングでエラーが発生しました', {
      component: COMPONENT_NAME,
      action: 'render_info_window_error',
      error,
      poiId: selectedPOI?.id,
    });
    return null;
  }
};

// React.memoでコンポーネントをメモ化（不要な再レンダリングを防止）
export default memo(MapMarkers);
