import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useState, useEffect, useCallback, useRef } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';
import { getMarkerIcon } from '@/utils/markerUtils';

// コンポーネント名の定数
const COMPONENT_NAME = 'useMapMarkers';

// マーカークラスタリングのデフォルト設定
const DEFAULT_GRID_SIZE = 60;
const DEFAULT_MIN_CLUSTER_SIZE = 3;

/**
 * マーカー管理フックの入力パラメータ
 */
interface UseMapMarkersParams {
  /** Google Maps インスタンスへの参照 */
  mapRef: React.MutableRefObject<google.maps.Map | null>;

  /** 表示対象のPOIデータ配列 */
  pois: PointOfInterest[];

  /** マーカークリック時のコールバック */
  onMarkerClick: (poi: PointOfInterest) => void;

  /** マーカークラスタリングを有効にするか（オプション） */
  enableClustering?: boolean;
  /** クラスタリング設定（オプション） */
  clusterOptions?: {
    gridSize?: number;
    minimumClusterSize?: number;
  };
}

/**
 * マーカー管理フックの戻り値
 */
interface UseMapMarkersResult {
  /** 作成されたマーカーの配列 */
  markers: google.maps.marker.AdvancedMarkerElement[];

  /** マーカークラスタリングインスタンス */
  clusterer: MarkerClusterer | null;
}

/**
 * Google Mapsのマーカー管理を行うカスタムフック
 * KISS原則に基づいてシンプル化されています
 */
export function useMapMarkers({
  mapRef,
  pois,
  onMarkerClick,
  enableClustering = true,
  clusterOptions = {},
}: UseMapMarkersParams): UseMapMarkersResult {
  // マーカー配列の状態
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);

  // クラスタリングインスタンスの参照
  const clustererRef = useRef<MarkerClusterer | null>(null);

  // マーカーのクリーンアップ
  const cleanupMarkers = useCallback(() => {
    // クラスタラーをクリーンアップ
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    // マーカーをクリーンアップ
    markers.forEach(marker => {
      marker.map = null;
    });

    // マーカー配列をクリア
    setMarkers([]);
  }, [markers]);

  /**
   * マーカーを作成する関数
   */
  const createMarker = useCallback(
    (poi: PointOfInterest, map: google.maps.Map): google.maps.marker.AdvancedMarkerElement => {
      // マーカーの位置
      const position = {
        lat: poi.latitude || 0,
        lng: poi.longitude || 0,
      };

      // 不正な座標の場合はログ出力
      if (!position.lat || !position.lng) {
        logger.warn(`不正な座標: ${poi.id}`, {
          component: COMPONENT_NAME,
          poiId: poi.id,
          lat: position.lat,
          lng: position.lng,
        });
      }

      // マーカーアイコンを取得
      const iconElement = getMarkerIcon(poi);
      const content = iconElement as unknown as HTMLElement;

      // マーカーを作成
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map,
        content,
        title: poi.name || '',
      });

      // クリックイベントを設定
      marker.addListener('click', () => onMarkerClick(poi));

      return marker;
    },
    [onMarkerClick]
  );

  // マーカーを作成
  const createMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !pois.length) return;

    logger.debug(`マーカーを作成: ${pois.length}件`, {
      component: COMPONENT_NAME,
      count: pois.length,
    });

    // 既存のマーカーをクリーンアップ
    cleanupMarkers();

    // 新しいマーカーを作成
    const newMarkers = pois
      .filter(poi => poi.latitude && poi.longitude)
      .map(poi => createMarker(poi, map));

    // マーカー配列を更新
    setMarkers(newMarkers); // クラスタリングが有効な場合、クラスタリングを設定
    if (enableClustering && newMarkers.length > 0) {
      const { gridSize = DEFAULT_GRID_SIZE, minimumClusterSize = DEFAULT_MIN_CLUSTER_SIZE } =
        clusterOptions;

      try {
        // クラスタリングインスタンスを作成（シンプル化）
        clustererRef.current = new MarkerClusterer({
          map,
          markers: newMarkers,
          gridSize,
          minimumClusterSize,
          renderer: {
            render: ({ count, position }) => {
              // クラスターマーカーの外観をカスタマイズ
              const cluster = document.createElement('div');
              cluster.className = 'cluster-marker';
              cluster.innerHTML = `<div class="cluster-text">${count}</div>`;
              cluster.style.width = '40px';
              cluster.style.height = '40px';
              cluster.style.borderRadius = '20px';
              cluster.style.backgroundColor = '#4285F4';
              cluster.style.display = 'flex';
              cluster.style.justifyContent = 'center';
              cluster.style.alignItems = 'center';
              cluster.style.color = 'white';
              cluster.style.fontWeight = 'bold';

              return new google.maps.marker.AdvancedMarkerElement({
                position,
                content: cluster,
              });
            },
          },
        });
        logger.debug('マーカークラスタリングを設定しました', {
          component: COMPONENT_NAME,
          markerCount: newMarkers.length,
          gridSize,
          minimumClusterSize,
        });
      } catch (error) {
        logger.error('マーカークラスタリングの設定に失敗しました', {
          component: COMPONENT_NAME,
          error,
        });
      }
    }

    return newMarkers;
  }, [mapRef, pois, createMarker, enableClustering, clusterOptions, cleanupMarkers]);

  // マップもしくはPOIデータが変更されたらマーカーを更新
  useEffect(() => {
    createMarkers();
    return cleanupMarkers;
  }, [mapRef, pois, createMarkers, cleanupMarkers]);

  return {
    markers,
    clusterer: clustererRef.current,
  };
}
