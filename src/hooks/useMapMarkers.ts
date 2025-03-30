import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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
  markers: google.maps.marker.AdvancedMarkerElement[];

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
  _animateMarkers: boolean
): google.maps.marker.AdvancedMarkerElement | null {
  try {
    // 新しいマーカーを作成
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: { lat: poi.lat, lng: poi.lng },
      title: poi.name,
      map,
      // icon プロパティは AdvancedMarkerElementOptions に存在しないため、
      // 必要に応じて content プロパティでアイコンを設定する
      content: (() => {
        const iconUrl = getMarkerIcon(poi);
        if (iconUrl.url) {
          const pin = new google.maps.marker.PinElement({
            background: iconUrl.url,
          });
          return pin.element;
        }
        return null;
      })(),
    });

    // アニメーションが必要な場合は別の方法で実装する必要があります
    // 例: カスタムアニメーションロジックをここに追加

    // マーカークリックイベントの設定
    marker.addListener('click', () => {
      logger.debug('マーカークリックイベント', { poiId: poi.id, poiName: poi.name });
      onMarkerClick(poi);
    });

    return marker;
  } catch (error) {
    // エラーログ処理の改善 - より詳細なコンテキスト情報を提供
    logger.error(`マーカー作成エラー (${poi.name || 'unknown'})`, {
      poiId: poi.id,
      lat: poi.lat,
      lng: poi.lng,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * クラスタリングレンダラーを作成する関数
 */
function createClustererRenderer() {
  return {
    render: ({ count, position }: { count: number; position: google.maps.LatLng }) => {
      return new google.maps.marker.AdvancedMarkerElement({
        position,
        content: createClusterIcon(count),
      });
    },
  };
}

/**
 * クラスタアイコンを作成する関数
 */
function createClusterIcon(count: number): HTMLElement {
  const div = document.createElement('div');
  div.style.width = '36px';
  div.style.height = '36px';
  div.style.borderRadius = '50%';
  div.style.backgroundColor = '#4285F4';
  div.style.border = '1.5px solid #FFFFFF';
  div.style.color = '#FFFFFF';
  div.style.textAlign = 'center';
  div.style.fontWeight = 'bold';
  div.style.fontSize = '12px';
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.innerText = String(count);
  return div;
}

/**
 * クラスタリングを管理する関数
 */
function manageClusterer(
  map: google.maps.Map,
  markers: google.maps.marker.AdvancedMarkerElement[],
  clusterer: MarkerClusterer | null,
  enableClustering: boolean
): MarkerClusterer | null {
  try {
    return logger.measureTime('マーカークラスタリング管理', () => {
      if (enableClustering) {
        if (clusterer) {
          clusterer.clearMarkers();
          clusterer.addMarkers(markers);
          logger.debug('既存クラスタラーを更新', { markerCount: markers.length });
          return clusterer;
        } else {
          const newClusterer = new MarkerClusterer({
            map,
            markers,
            renderer: createClustererRenderer(),
          });
          logger.info('新規クラスタラーを作成', { markerCount: markers.length });
          return newClusterer;
        }
      } else if (clusterer) {
        // クラスタリングが無効で、以前のクラスタラーがある場合はクリア
        clusterer.clearMarkers();
        clusterer.setMap(null);
        logger.debug('クラスタラーを無効化');
        return null;
      }
      return clusterer;
    });
  } catch (error) {
    // エラーログ処理の改善 - より詳細なコンテキスト情報を提供
    logger.error('クラスタリング管理エラー', {
      markersCount: markers.length,
      enableClustering,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return clusterer;
  }
}

/**
 * マーカーとクラスタラーのクリーンアップを行うヘルパー関数
 */
function cleanupMarkers(
  markers: google.maps.marker.AdvancedMarkerElement[],
  clusterer: MarkerClusterer | null
): void {
  // 表示中のマーカーのみマップから削除（キャッシュには残す）
  markers.forEach(marker => {
    marker.map = null;
  });

  if (clusterer) {
    clusterer.clearMarkers();
  }
}

/**
 * マーカーの完全なクリーンアップを行うヘルパー関数
 */
function fullCleanupMarkers(
  markers: Map<string, google.maps.marker.AdvancedMarkerElement>,
  clusterer: MarkerClusterer | null
): void {
  logger.info('マーカー管理のクリーンアップを実行', {
    markerCount: markers.size,
    hasClusterer: !!clusterer,
  });

  // マーカーのイベントリスナーとマーカー自体を削除
  markers.forEach(marker => {
    google.maps.event.clearInstanceListeners(marker);
    marker.map = null;
  });

  // クラスタラーをクリーンアップ
  if (clusterer) {
    clusterer.clearMarkers();
    clusterer.setMap(null);
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
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);

  // マーカークラスタラーの参照
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);

  // マーカーキャッシュ（POI ID → マーカー）
  const markerCacheRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  // POIのIDを一貫して取得するヘルパー関数（メモ化によるパフォーマンス向上）
  const getPoiId = useCallback((poi: PointOfInterest): string => {
    return poi.id || `${poi.lat}-${poi.lng}-${poi.name}`;
  }, []);

  // 単一マーカーを作成または更新する関数（メモ化）
  const createOrUpdateMarker = useCallback(
    (
      poi: PointOfInterest,
      map: google.maps.Map
    ): google.maps.marker.AdvancedMarkerElement | null => {
      const poiId = getPoiId(poi);
      const existingMarker = markerCacheRef.current.get(poiId);

      if (existingMarker) {
        existingMarker.position = { lat: poi.lat, lng: poi.lng };
        existingMarker.title = poi.name;
        // アイコンの更新（オプショナルチェーン演算子を使用）
        const iconUrl = getMarkerIcon(poi);
        if (iconUrl.url) {
          const pin = new google.maps.marker.PinElement({
            background: iconUrl.url,
          });
          existingMarker.content = pin.element;
        }
        existingMarker.map = map;
        return existingMarker;
      }

      const marker = createMarker(poi, map, onMarkerClick, animateMarkers);

      if (marker) {
        markerCacheRef.current.set(poiId, marker);
      }

      return marker;
    },
    [onMarkerClick, animateMarkers, getPoiId]
  );

  // POIのIDセットを生成（現在のPOIのIDセット）- パフォーマンス最適化
  const currentPoiIdSet = useMemo(() => {
    return new Set(pois.map(getPoiId));
  }, [pois, getPoiId]);

  // マーカー更新のeffect
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    logger.debug('マーカー更新を開始', { poisCount: pois.length });

    const updateMarkers = () => {
      // 不要なマーカーをキャッシュから削除
      const removedMarkers: string[] = [];

      markerCacheRef.current.forEach((marker, id) => {
        if (!currentPoiIdSet.has(id)) {
          google.maps.event.clearInstanceListeners(marker);
          marker.map = null;
          markerCacheRef.current.delete(id);
          removedMarkers.push(id);
        }
      });

      if (removedMarkers.length > 0) {
        logger.debug('未使用マーカーを削除', { count: removedMarkers.length });
      }

      try {
        // パフォーマンス計測を追加
        const newMarkers = logger.measureTime('マーカー生成/更新', () => {
          return pois
            .map(poi => createOrUpdateMarker(poi, map))
            .filter(Boolean) as google.maps.marker.AdvancedMarkerElement[];
        });

        setMarkers(newMarkers);
        logger.debug('マーカー更新完了', { markerCount: newMarkers.length });

        // クラスタリング管理を実行
        const newClusterer = manageClusterer(map, newMarkers, clusterer, enableClustering);
        if (newClusterer !== clusterer) {
          setClusterer(newClusterer);
        }
      } catch (error) {
        logger.error('マーカー管理エラー', {
          poisCount: pois.length,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        });
      }
    };

    updateMarkers();

    // クリーンアップ（コンポーネントがアンマウントされる場合や依存配列の値が変わる場合）
    return () => {
      cleanupMarkers(markers, clusterer);
    };
  }, [mapRef, pois, currentPoiIdSet, createOrUpdateMarker, enableClustering, markers, clusterer]);

  // コンポーネントアンマウント時のフルクリーンアップ
  useEffect(() => {
    // effect実行時の値をキャプチャ
    const currentClusterer = clusterer;
    // refを直接キャプチャするのではなく、現在のMap内容をキャプチャ
    const currentMarkers = new Map(markerCacheRef.current);

    return () => {
      fullCleanupMarkers(currentMarkers, currentClusterer);
    };
  }, [clusterer]);

  return { markers, clusterer };
}
