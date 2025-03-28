import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useState, useEffect, useCallback, useRef } from 'react';

import { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';
import { getMarkerIcon } from '@/utils/markerUtils';

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

  /** マーカーにアニメーションを適用するか（オプション） */
  animateMarkers?: boolean;

  /** マーカークラスタリングを有効にするか（オプション） */
  enableClustering?: boolean;
}

/**
 * マーカー管理フックの戻り値
 */
interface UseMapMarkersResult {
  /** 作成されたマーカーの配列 */
  markers: google.maps.Marker[];

  /** マーカークラスタリングインスタンス */
  clusterer: MarkerClusterer | null;
}

/**
 * 単一マーカーを作成する関数
 */
function createMarker(
  poi: PointOfInterest,
  map: google.maps.Map,
  onMarkerClick: (poi: PointOfInterest) => void,
  animateMarkers: boolean
): google.maps.Marker | null {
  try {
    // 新しいマーカーを作成
    const marker = new google.maps.Marker({
      position: { lat: poi.lat, lng: poi.lng },
      title: poi.name,
      map,
      icon: getMarkerIcon(poi),
      animation: animateMarkers ? google.maps.Animation.DROP : null,
      optimized: true, // パフォーマンスのため
    });

    // マーカークリックイベントの設定
    marker.addListener('click', () => {
      onMarkerClick(poi);
    });

    return marker;
  } catch (error) {
    // エラーログ処理
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`マーカー作成エラー (${poi.name}): ${errorMessage}`);
    return null;
  }
}

/**
 * クラスタリングレンダラーを作成する関数
 */
function createClustererRenderer() {
  return {
    render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
      return new google.maps.Marker({
        position,
        label: {
          text: String(count),
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4285F4',
          fillOpacity: 0.9,
          strokeWeight: 1.5,
          strokeColor: '#FFFFFF',
          scale: 18,
        },
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
      });
    },
  };
}

/**
 * クラスタリングを管理する関数
 */
function manageClusterer(
  map: google.maps.Map,
  markers: google.maps.Marker[],
  clusterer: MarkerClusterer | null,
  enableClustering: boolean
): MarkerClusterer | null {
  try {
    if (enableClustering) {
      if (clusterer) {
        clusterer.clearMarkers();
        clusterer.addMarkers(markers);
        return clusterer;
      } else {
        return new MarkerClusterer({
          map,
          markers,
          renderer: createClustererRenderer(),
        });
      }
    } else if (clusterer) {
      // クラスタリングが無効で、以前のクラスタラーがある場合はクリア
      clusterer.clearMarkers();
      clusterer.setMap(null);
      return null;
    }
    return clusterer;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`クラスタリング管理エラー: ${errorMessage}`);
    return clusterer;
  }
}

/**
 * 地図上のマーカーとクラスタリングを管理するカスタムフック
 */
export function useMapMarkers({
  mapRef,
  pois,
  onMarkerClick,
  animateMarkers = true,
  enableClustering = true,
}: UseMapMarkersParams): UseMapMarkersResult {
  // マーカーインスタンスの管理
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // マーカークラスタラーの参照
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);

  // マーカーキャッシュ（POI ID → マーカー）
  const markerCacheRef = useRef<Map<string, google.maps.Marker>>(new Map());

  // 単一マーカーを作成または更新する関数（メモ化）
  const createOrUpdateMarker = useCallback(
    (poi: PointOfInterest, map: google.maps.Map): google.maps.Marker | null => {
      const poiId = poi.id || `${poi.lat}-${poi.lng}-${poi.name}`;
      const existingMarker = markerCacheRef.current.get(poiId);

      if (existingMarker) {
        existingMarker.setPosition({ lat: poi.lat, lng: poi.lng });
        existingMarker.setTitle(poi.name);
        existingMarker.setIcon(getMarkerIcon(poi));
        existingMarker.setMap(map);
        return existingMarker;
      }

      const marker = createMarker(poi, map, onMarkerClick, animateMarkers);

      if (marker) {
        markerCacheRef.current.set(poiId, marker);
      }

      return marker;
    },
    [onMarkerClick, animateMarkers]
  );

  // マーカー更新のeffect
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentPoiIds = new Set(pois.map(poi => poi.id || `${poi.lat}-${poi.lng}-${poi.name}`));

    // 不要なマーカーをキャッシュから削除
    markerCacheRef.current.forEach((marker, id) => {
      if (!currentPoiIds.has(id)) {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
        markerCacheRef.current.delete(id);
      }
    });

    try {
      const newMarkers = pois
        .map(poi => createOrUpdateMarker(poi, map))
        .filter(Boolean) as google.maps.Marker[];

      setMarkers(newMarkers);

      // クラスタリング管理を別関数に移動
      const newClusterer = manageClusterer(map, newMarkers, clusterer, enableClustering);
      if (newClusterer !== clusterer) {
        setClusterer(newClusterer);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`マーカー管理エラー: ${errorMessage}`);
    }

    // クリーンアップ（コンポーネントがアンマウントされる場合や依存配列の値が変わる場合）
    return () => {
      // 表示中のマーカーのみマップから削除（キャッシュには残す）
      markers.forEach(marker => {
        marker.setMap(null);
      });

      if (clusterer) {
        clusterer.clearMarkers();
      }
    };
  }, [mapRef, pois, createOrUpdateMarker, enableClustering, markers, clusterer]);

  // コンポーネントアンマウント時のフルクリーンアップ
  useEffect(() => {
    // effect実行時の値をキャプチャ
    const currentClusterer = clusterer;
    // refを直接キャプチャするのではなく、現在のMap内容をキャプチャ
    const currentMarkers = new Map(markerCacheRef.current);

    return () => {
      // キャプチャした値を使用してクリーンアップ
      currentMarkers.forEach(marker => {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });

      // キャプチャしたクラスタラーを使用
      if (currentClusterer) {
        currentClusterer.clearMarkers();
        currentClusterer.setMap(null);
      }
    };
  }, [clusterer]);

  return { markers, clusterer };
}
