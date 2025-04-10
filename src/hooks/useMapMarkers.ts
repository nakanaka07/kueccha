import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { getEnv } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';
import { getMarkerIcon } from '@/utils/markerUtils';

// コンポーネント名の定数を追加 - ロガーで一貫して使用するため
const COMPONENT_NAME = 'MapMarkers';

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
  markers: (google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[];

  /** マーカークラスタリングインスタンス */
  clusterer: MarkerClusterer | null;
}

/**
 * マーカーがAdvancedMarkerElementかどうかを判定する型ガード関数
 */
function isAdvancedMarkerElement(
  marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker
): marker is google.maps.marker.AdvancedMarkerElement {
  return 'content' in marker;
}

/**
 * マーカーがMarkerかどうかを判定する型ガード関数
 */
function isLegacyMarker(
  marker: google.maps.marker.AdvancedMarkerElement | google.maps.Marker
): marker is google.maps.Marker {
  return 'setIcon' in marker;
}

/**
 * Advanced Markerを作成する関数
 * マーカーライブラリが利用可能な場合のみ使用される
 */
function createAdvancedMarker(
  poi: PointOfInterest,
  map: google.maps.Map,
  onMarkerClick: (poi: PointOfInterest) => void
): google.maps.marker.AdvancedMarkerElement {
  // Advanced Marker APIを使用
  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: { lat: poi.lat, lng: poi.lng },
    title: poi.name,
    map,
    content: (() => {
      const iconUrl = getMarkerIcon(poi);
      if (iconUrl.url) {
        // PinElementが利用可能な場合、それを使ってマーカーをカスタマイズ
        if ('PinElement' in google.maps.marker) {
          const pin = new google.maps.marker.PinElement({
            background: iconUrl.url,
            // Advanced Marker専用の機能を活用
            scale: 1.2,
            glyph: poi.isClosed ? '×' : '',
            glyphColor: poi.isClosed ? '#ff0000' : '',
            // nullable boolean valueの警告を修正 - nullではなく空文字列を使用
            borderColor: poi.isRecommended === true ? '#FFD700' : '',
          });
          return pin.element;
        } else {
          // PinElementが利用できない場合のフォールバック
          const div = document.createElement('div');
          div.style.backgroundImage = `url(${iconUrl.url})`;
          div.style.width = '32px';
          div.style.height = '32px';
          div.style.backgroundSize = 'cover';
          return div;
        }
      }
      return null;
    })(),
  });

  // マーカークリックイベントの設定
  marker.addListener('click', () => {
    logger.debug('マーカークリックイベント', {
      component: COMPONENT_NAME,
      action: 'marker_click',
      poiId: poi.id,
      poiName: poi.name,
    });
    onMarkerClick(poi);
  });

  return marker;
}

/**
 * 従来のMarkerを作成する関数
 * Advanced Markerが使用できない場合のフォールバックとして使用
 */
function createLegacyMarker(
  poi: PointOfInterest,
  map: google.maps.Map,
  onMarkerClick: (poi: PointOfInterest) => void,
  animateMarkers: boolean
): google.maps.Marker {
  logger.warn('AdvancedMarkerElementが利用できないため従来のMarkerを使用します', {
    component: COMPONENT_NAME,
    action: 'fallback_marker',
    poiName: poi.name,
    apiVersion: google.maps.version || 'unknown',
    usingLibraries: 'marker ライブラリをロードするには ?libraries=marker パラメータが必要です',
  });

  const iconUrl = getMarkerIcon(poi);
  const marker = new google.maps.Marker({
    position: { lat: poi.lat, lng: poi.lng },
    title: poi.name,
    map,
    // iconプロパティの型安全な処理 - undefined ではなく null を使用
    icon: iconUrl.url
      ? {
          url: iconUrl.url,
          scaledSize: new google.maps.Size(32, 32),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(16, 16),
        }
      : null,
    // 従来のMarker APIでのアニメーション - undefined ではなく null を使用
    animation: animateMarkers ? google.maps.Animation.DROP : null,
  });

  // マーカークリックイベントの設定
  marker.addListener('click', () => {
    logger.debug('マーカークリックイベント', {
      component: COMPONENT_NAME,
      action: 'marker_click',
      poiId: poi.id,
      poiName: poi.name,
    });
    onMarkerClick(poi);
  });

  return marker;
}

/**
 * 単一マーカーを作成する関数
 * マーカーライブラリが利用可能な場合はAdvancedMarkerを使用し、
 * そうでない場合は従来のMarkerへのフォールバックを提供
 */
function createMarker(
  poi: PointOfInterest,
  map: google.maps.Map,
  onMarkerClick: (poi: PointOfInterest) => void,
  animateMarkers: boolean
): google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null {
  try {
    // Advanced Marker APIが利用可能かどうかをチェック（シンプルかつ型安全な条件式）
    const useAdvancedMarker =
      typeof google.maps.marker !== 'undefined' &&
      'AdvancedMarkerElement' in google.maps.marker &&
      typeof google.maps.marker.AdvancedMarkerElement === 'function';

    if (useAdvancedMarker) {
      return createAdvancedMarker(poi, map, onMarkerClick);
    } else {
      // 非推奨APIの使用に関する明示的なコメント
      // @deprecated Markerは非推奨。将来的なバージョンでAdvancedMarkerElementに置き換えられる予定
      return createLegacyMarker(poi, map, onMarkerClick, animateMarkers);
    }
  } catch (error) {
    // エラーログ処理の改善 - より詳細なコンテキスト情報を提供
    logger.error(`マーカー作成エラー (${poi.name || 'unknown'})`, {
      component: COMPONENT_NAME,
      action: 'create_marker_error',
      poiId: poi.id,
      lat: poi.lat,
      lng: poi.lng,
      apiVersion: google.maps.version || 'unknown',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
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
    return logger.measureTime(
      'マーカークラスタリング管理',
      () => {
        if (enableClustering) {
          if (clusterer) {
            clusterer.clearMarkers();
            clusterer.addMarkers(markers);
            logger.debug('既存クラスタラーを更新', {
              component: COMPONENT_NAME,
              action: 'update_clusterer',
              markerCount: markers.length,
            });
            return clusterer;
          } else {
            const newClusterer = new MarkerClusterer({
              map,
              markers,
              renderer: createClustererRenderer(),
            });
            logger.info('新規クラスタラーを作成', {
              component: COMPONENT_NAME,
              action: 'create_clusterer',
              markerCount: markers.length,
            });
            return newClusterer;
          }
        } else if (clusterer) {
          // クラスタリングが無効で、以前のクラスタラーがある場合はクリア
          clusterer.clearMarkers();
          clusterer.setMap(null);
          logger.debug('クラスタラーを無効化', {
            component: COMPONENT_NAME,
            action: 'disable_clusterer',
          });
          return null;
        }
        return clusterer;
      },
      LogLevel.DEBUG,
      { component: COMPONENT_NAME }
    );
  } catch (error) {
    // エラーログ処理の改善 - より詳細なコンテキスト情報を提供
    logger.error('クラスタリング管理エラー', {
      component: COMPONENT_NAME,
      action: 'clusterer_error',
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
  markers: (google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[],
  clusterer: MarkerClusterer | null
): void {
  // 表示中のマーカーのみマップから削除（キャッシュには残す）
  markers.forEach(marker => {
    if (isAdvancedMarkerElement(marker)) {
      marker.map = null;
    } else if (isLegacyMarker(marker)) {
      marker.setMap(null);
    }
  });

  if (clusterer) {
    clusterer.clearMarkers();
  }
}

/**
 * マーカーの完全なクリーンアップを行うヘルパー関数
 */
function fullCleanupMarkers(
  markers: Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>,
  clusterer: MarkerClusterer | null
): void {
  logger.info('マーカー管理のクリーンアップを実行', {
    component: COMPONENT_NAME,
    action: 'cleanup_markers',
    markerCount: markers.size,
    hasClusterer: !!clusterer,
  });

  // マーカーのイベントリスナーとマーカー自体を削除
  markers.forEach(marker => {
    google.maps.event.clearInstanceListeners(marker);
    if (isAdvancedMarkerElement(marker)) {
      marker.map = null;
    } else if (isLegacyMarker(marker)) {
      marker.setMap(null);
    }
  });

  // クラスタラーをクリーンアップ
  if (clusterer) {
    clusterer.clearMarkers();
    clusterer.setMap(null);
  }
}

/**
 * マーカー更新処理を実行する関数
 */
function updateMarkersProcess(
  map: google.maps.Map,
  pois: PointOfInterest[],
  createOrUpdateMarker: (
    poi: PointOfInterest,
    map: google.maps.Map
  ) => google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null,
  currentPoiIdSet: Set<string>,
  markerCacheRef: React.MutableRefObject<
    Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>
  >,
  clusterer: MarkerClusterer | null,
  enableClustering: boolean,
  setMarkers: React.Dispatch<
    React.SetStateAction<(google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[]>
  >,
  setClusterer: React.Dispatch<React.SetStateAction<MarkerClusterer | null>>
): void {
  // 不要なマーカーをキャッシュから削除
  const removedMarkers: string[] = [];

  markerCacheRef.current.forEach((marker, id) => {
    if (!currentPoiIdSet.has(id)) {
      google.maps.event.clearInstanceListeners(marker);
      if (isAdvancedMarkerElement(marker)) {
        marker.map = null;
      } else if (isLegacyMarker(marker)) {
        marker.setMap(null);
      }
      markerCacheRef.current.delete(id);
      removedMarkers.push(id);
    }
  });

  if (removedMarkers.length > 0) {
    logger.debug('未使用マーカーを削除', {
      component: COMPONENT_NAME,
      action: 'remove_unused_markers',
      count: removedMarkers.length,
    });
  }

  try {
    // パフォーマンス計測を追加
    const newMarkers = logger.measureTime(
      'マーカー生成/更新',
      () => {
        return pois.map(poi => createOrUpdateMarker(poi, map)).filter(Boolean) as (
          | google.maps.marker.AdvancedMarkerElement
          | google.maps.Marker
        )[];
      },
      // 処理時間が100ms未満の場合はDEBUGレベルで、それ以上の場合はINFOレベルでログ出力
      LogLevel.DEBUG,
      {
        component: COMPONENT_NAME,
        action: 'generate_markers',
        threshold: '100ms以上の場合のみINFOレベルで出力',
      },
      100
    );

    setMarkers(newMarkers);
    logger.debug('マーカー更新完了', {
      component: COMPONENT_NAME,
      action: 'update_markers_complete',
      markerCount: newMarkers.length,
    });

    // AdvancedMarkerElementだけをクラスタリング
    const advancedMarkers = newMarkers.filter(isAdvancedMarkerElement);

    // クラスタリング管理を実行（AdvancedMarkerElementの配列を渡す）
    const newClusterer = manageClusterer(map, advancedMarkers, clusterer, enableClustering);
    if (newClusterer !== clusterer) {
      setClusterer(newClusterer);
    }
  } catch (error) {
    logger.error('マーカー管理エラー', {
      component: COMPONENT_NAME,
      action: 'marker_management_error',
      poisCount: pois.length,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
  }
}

/**
 * マーカー更新のためのEffect処理を実装する関数
 * useEffectを直接使用するのではなく、ロジックを分離し再利用性を向上
 */
function useMarkerUpdateEffect(
  mapRef: React.MutableRefObject<google.maps.Map | null>,
  pois: PointOfInterest[],
  createOrUpdateMarker: (
    poi: PointOfInterest,
    map: google.maps.Map
  ) => google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null,
  currentPoiIdSet: Set<string>,
  markerCacheRef: React.MutableRefObject<
    Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>
  >,
  clusterer: MarkerClusterer | null,
  enableClustering: boolean,
  setMarkers: React.Dispatch<
    React.SetStateAction<(google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[]>
  >,
  setClusterer: React.Dispatch<React.SetStateAction<MarkerClusterer | null>>
): void {
  // 実際のエフェクトをuseEffectで実装
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 現在の参照値をキャプチャ
    const currentClusterer = clusterer;
    const markerCache = markerCacheRef.current;

    logger.debug('マーカー更新を開始', {
      component: COMPONENT_NAME,
      action: 'start_marker_update',
      poisCount: pois.length,
    });

    // 別関数に分割したマーカー更新処理を呼び出し
    updateMarkersProcess(
      map,
      pois,
      createOrUpdateMarker,
      currentPoiIdSet,
      markerCacheRef,
      currentClusterer,
      enableClustering,
      setMarkers,
      setClusterer
    );

    // クリーンアップ（コンポーネントがアンマウントされる場合や依存配列の値が変わる場合）
    return () => {
      // キャプチャした値を使用する
      const markersToCleanup = Array.from(markerCache.values());
      cleanupMarkers(markersToCleanup, currentClusterer);
    };
  }, [
    mapRef,
    pois,
    currentPoiIdSet,
    createOrUpdateMarker,
    enableClustering,
    clusterer,
    markerCacheRef,
    setMarkers,
    setClusterer,
  ]);
}

/**
 * クリーンアップ用のEffect処理を実装する関数
 */
function useCleanupEffect(
  clusterer: MarkerClusterer | null,
  markerCacheRef: React.MutableRefObject<
    Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>
  >
): void {
  useEffect(() => {
    // effect実行時に値をキャプチャ
    const currentClusterer = clusterer;

    // currentの値を直接キャプチャするため、新しいMapオブジェクトを作成
    const capturedMarkers = new Map(markerCacheRef.current);

    return () => {
      fullCleanupMarkers(capturedMarkers, currentClusterer);
    };
  }, [clusterer, markerCacheRef]);
}

/**
 * 地図上のマーカーとクラスタリングを管理するカスタムフック
 */
export function useMapMarkers({
  mapRef,
  pois,
  onMarkerClick,
  animateMarkers = true,
  // 環境変数を使ってマーカークラスタリングの設定を取得（getEnv関数を使用）
  enableClustering = getEnv<boolean>('VITE_ENABLE_MARKER_CLUSTERING', {
    defaultValue: false,
    transform: value => value === 'true' || value === '1',
  }),
}: UseMapMarkersParams): UseMapMarkersResult {
  // マーカーインスタンスの管理
  const [markers, setMarkers] = useState<
    (google.maps.marker.AdvancedMarkerElement | google.maps.Marker)[]
  >([]);

  // マーカークラスタラーの参照
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);

  // マーカーキャッシュ（POI ID → マーカー）
  const markerCacheRef = useRef<
    Map<string, google.maps.marker.AdvancedMarkerElement | google.maps.Marker>
  >(new Map());

  // POIのIDを一貫して取得するヘルパー関数（メモ化によるパフォーマンス向上）
  const getPoiId = useCallback((poi: PointOfInterest): string => {
    return poi.id || `${poi.lat}-${poi.lng}-${poi.name}`;
  }, []);

  // 単一マーカーを作成または更新する関数（メモ化）
  const createOrUpdateMarker = useCallback(
    (
      poi: PointOfInterest,
      map: google.maps.Map
    ): google.maps.marker.AdvancedMarkerElement | google.maps.Marker | null => {
      const poiId = getPoiId(poi);
      const existingMarker = markerCacheRef.current.get(poiId);

      if (existingMarker) {
        // マーカーの種類に応じて適切にプロパティを更新
        if (isAdvancedMarkerElement(existingMarker)) {
          // AdvancedMarkerElement の場合
          existingMarker.position = { lat: poi.lat, lng: poi.lng };
          existingMarker.title = poi.name;
          const iconUrl = getMarkerIcon(poi);
          if (iconUrl.url && 'PinElement' in google.maps.marker) {
            const pin = new google.maps.marker.PinElement({
              background: iconUrl.url,
            });
            existingMarker.content = pin.element;
          }
          existingMarker.map = map;
        } else if (isLegacyMarker(existingMarker)) {
          // 従来の Marker の場合
          existingMarker.setPosition({ lat: poi.lat, lng: poi.lng });
          existingMarker.setTitle(poi.name);
          const iconUrl = getMarkerIcon(poi);
          if (iconUrl.url) {
            existingMarker.setIcon({
              url: iconUrl.url,
              scaledSize: new google.maps.Size(32, 32),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(16, 16),
            });
          }
          existingMarker.setMap(map);
        }
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

  // マーカー更新のエフェクトを別関数に分離
  useMarkerUpdateEffect(
    mapRef,
    pois,
    createOrUpdateMarker,
    currentPoiIdSet,
    markerCacheRef,
    clusterer,
    enableClustering,
    setMarkers,
    setClusterer
  );

  // クリーンアップエフェクトを別関数に分離
  useCleanupEffect(clusterer, markerCacheRef);

  // マーカー更新処理後にまとめてログ出力（必要時のみ出力）
  logger.debug('マーカーアイコン生成完了', {
    component: COMPONENT_NAME,
    action: 'marker_generation_complete',
    totalMarkers: pois.length,
    restaurantCount: pois.filter(p => p.type === 'restaurant').length,
  });

  return { markers, clusterer };
}
