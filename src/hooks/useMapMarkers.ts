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
 * 地図上のマーカーとクラスタリングを管理するカスタムフック
 *
 * このフックは、POIデータに基づいて地図上にマーカーを表示し、
 * クラスタリング処理を行います。マーカーは効率的に再利用され、
 * 必要な場合のみ再作成されます。
 *
 * @example
 * ```tsx
 * const { markers, clusterer } = useMapMarkers({
 *   mapRef,
 *   pois: filteredPOIs,
 *   onMarkerClick: handleMarkerClick
 * });
 * ```
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
      try {
        // POI IDの生成（idプロパティがある場合はそれを使用、なければ座標+名前の組み合わせ）
        const poiId = poi.id || `${poi.lat}-${poi.lng}-${poi.name}`;

        // キャッシュからマーカーを取得
        const existingMarker = markerCacheRef.current.get(poiId);

        if (existingMarker) {
          // 既存のマーカーを更新（位置や表示内容が変わっている可能性がある）
          existingMarker.setPosition({ lat: poi.lat, lng: poi.lng });
          existingMarker.setTitle(poi.name);
          existingMarker.setIcon(getMarkerIcon(poi));
          existingMarker.setMap(map);
          return existingMarker;
        }

        // 新しいマーカーを作成
        const marker = new google.maps.Marker({
          position: { lat: poi.lat, lng: poi.lng },
          title: poi.name,
          map,
          icon: getMarkerIcon(poi),
          animation: animateMarkers ? google.maps.Animation.DROP : undefined,
          optimized: true, // パフォーマンスのため
        });

        // マーカークリックイベントの設定
        marker.addListener('click', () => {
          onMarkerClick(poi);
        });

        // キャッシュに保存
        markerCacheRef.current.set(poiId, marker);

        return marker;
      } catch (error) {
        // エラーログ処理
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`マーカー作成エラー (${poi.name}): ${errorMessage}`);
        return null;
      }
    },
    [onMarkerClick, animateMarkers]
  );

  // クラスタリングレンダラーの作成（メモ化）
  const createClustererRenderer = useCallback(() => {
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
  }, []);

  // マーカーとクラスタリングの設定
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 現在のPOIに存在しないマーカーを特定するためのセット
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
      // 新しいマーカーを作成または既存のマーカーを更新
      const newMarkers = pois
        .map(poi => createOrUpdateMarker(poi, map))
        .filter(Boolean) as google.maps.Marker[];

      setMarkers(newMarkers);

      // クラスタリングの設定（有効な場合のみ）
      if (enableClustering) {
        if (clusterer) {
          clusterer.clearMarkers();
          clusterer.addMarkers(newMarkers);
        } else {
          try {
            const newClusterer = new MarkerClusterer({
              map,
              markers: newMarkers,
              renderer: createClustererRenderer(),
            });
            setClusterer(newClusterer);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`クラスタリング初期化エラー: ${errorMessage}`);
          }
        }
      } else if (clusterer) {
        // クラスタリングが無効で、以前のクラスタラーがある場合はクリア
        clusterer.clearMarkers();
        clusterer.setMap(null);
        setClusterer(null);
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
  }, [
    mapRef,
    pois,
    createOrUpdateMarker,
    createClustererRenderer,
    enableClustering,
    markers,
    clusterer,
  ]);

  // コンポーネントアンマウント時のフルクリーンアップ
  useEffect(() => {
    return () => {
      // すべてのマーカーをクリーンアップ
      markerCacheRef.current.forEach(marker => {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });
      markerCacheRef.current.clear();

      if (clusterer) {
        clusterer.clearMarkers();
        clusterer.setMap(null);
      }
    };
  }, []);

  return { markers, clusterer };
}
