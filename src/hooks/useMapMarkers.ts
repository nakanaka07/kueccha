import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

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
 * @performance 再レンダリングを最小化するためにuseMemoとuseCallbackを活用
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

  // マーカーの参照を保持するref
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  // クラスタリング設定をメモ化
  const memoizedClusterOptions = useMemo(
    () => ({
      gridSize: clusterOptions.gridSize || DEFAULT_GRID_SIZE,
      minimumClusterSize: clusterOptions.minimumClusterSize || DEFAULT_MIN_CLUSTER_SIZE,
    }),
    [clusterOptions.gridSize, clusterOptions.minimumClusterSize]
  );

  // マーカーのクリーンアップ
  const cleanupMarkers = useCallback(() => {
    // パフォーマンス計測開始
    const startTime = performance.now();

    // クラスタラーをクリーンアップ
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    // マーカーをクリーンアップ
    markersRef.current.forEach(marker => {
      marker.map = null;
    });

    // マーカー配列をクリア
    setMarkers([]);
    markersRef.current = [];

    // パフォーマンス計測終了と記録
    const duration = performance.now() - startTime;
    if (markersRef.current.length > 0) {
      logger.debug('マーカークリーンアップ完了', {
        component: COMPONENT_NAME,
        markerCount: markersRef.current.length,
        durationMs: Math.round(duration),
      });
    }
  }, []);
  // コールバック参照を使って安定性を確保
  const onMarkerClickRef = useRef(onMarkerClick);

  // コールバックが変更されたら参照を更新
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  /**
   * アイコン取得関数をメモ化して再利用性を高める
   * getMarkerIconの実装が変わらない前提
   */
  const getMarkerIconMemo = useCallback((poi: PointOfInterest) => {
    return getMarkerIcon(poi);
  }, []);
  /**
   * マーカーを作成する関数
   * @performance getMarkerIconMemoへの依存関係を明示し、再生成を防止
   */
  const createMarker = useCallback(
    (poi: PointOfInterest, map: google.maps.Map) => {
      try {
        // マーカーの位置
        const position = {
          lat: poi.latitude || poi.lat || 0,
          lng: poi.longitude || poi.lng || 0,
        };

        // 不正な座標の場合はログ出力
        if (!position.lat || !position.lng) {
          logger.warn(`不正な座標: ${poi.id}`, {
            component: COMPONENT_NAME,
            poiId: poi.id,
            lat: position.lat,
            lng: position.lng,
          });
          return null;
        }

        // Advanced Markers API が利用可能か確認
        if ('marker' in google.maps && 'AdvancedMarkerElement' in google.maps.marker) {
          // メモ化した関数を使用してマーカーアイコンを取得
          const iconElement = getMarkerIconMemo(poi);

          // HTMLElement要素を作成
          const content = document.createElement('div');
          content.className = 'advanced-marker';
          content.style.backgroundImage = `url(${iconElement.url})`;
          content.style.width = '32px';
          content.style.height = '32px';
          content.style.backgroundSize = 'contain';
          content.style.backgroundRepeat = 'no-repeat';
          if (iconElement.opacity !== undefined) {
            content.style.opacity = iconElement.opacity.toString();
          }

          // AdvancedMarkerElement を作成 (明示的にマップを設定)
          const marker = new google.maps.marker.AdvancedMarkerElement({
            position,
            map: map, // 明示的にマップを設定
            content,
            title: poi.name || '',
            zIndex: 1, // 情報ウィンドウより下に表示されるように設定
          });

          // クリックイベントを設定
          marker.addListener('click', () => onMarkerClickRef.current(poi));
          return marker;
        } else {
          // 従来のマーカーをフォールバックとして使用
          logger.warn('Advanced Markersが利用できません。従来のマーカーを使用します', {
            component: COMPONENT_NAME,
          });

          const marker = new google.maps.Marker({
            position,
            map: map, // 明示的にマップを設定
            title: poi.name || '',
            icon: getMarkerIconMemo(poi).url,
          });

          // クリックイベントを設定
          marker.addListener('click', () => onMarkerClickRef.current(poi));
          return marker as unknown as google.maps.marker.AdvancedMarkerElement;
        }
      } catch (error) {
        logger.error('マーカー作成エラー', {
          component: COMPONENT_NAME,
          poiId: poi.id,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    },
    [getMarkerIconMemo]
  );

  /**
   * マーカーを作成する関数
   * @performance 必要なパラメータへの依存関係のみを持ち、不要な再生成を防止
   */
  const createMarkers = useCallback(() => {
    const startTime = performance.now();
    const map = mapRef.current;
    if (!map || !pois.length) return;

    // ログ出力は開発環境のみに制限するか、マーカー数が変わった場合のみに行う
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`マーカーを作成: ${pois.length}件`, {
        component: COMPONENT_NAME,
        count: pois.length,
      });
    }

    // 既存のマーカーをクリーンアップ
    cleanupMarkers();

    // 新しいマーカーを作成し、nullの結果をフィルタリング
    const newMarkers = pois
      .filter(poi => (poi.latitude && poi.longitude) || (poi.lat && poi.lng))
      .map(poi => createMarker(poi, map))
      .filter((marker): marker is google.maps.marker.AdvancedMarkerElement => marker !== null);

    // 参照を更新
    markersRef.current = newMarkers;

    // マーカー配列を更新
    setMarkers(newMarkers);

    // マーカー生成失敗時のフォールバック処理
    if (newMarkers.length === 0 && pois.length > 0) {
      logger.warn('マーカーの生成に失敗しました。代替表示を試みます', {
        component: COMPONENT_NAME,
        poiCount: pois.length,
      });

      // 最低限のフォールバック表示（例：最初のPOIに中心を合わせる）
      if (map && pois.length > 0) {
        const firstValidPOI = pois.find(
          poi => (poi.latitude && poi.longitude) || (poi.lat && poi.lng)
        );
        if (firstValidPOI) {
          const lat = firstValidPOI.latitude || firstValidPOI.lat || 0;
          const lng = firstValidPOI.longitude || firstValidPOI.lng || 0;
          if (lat && lng) {
            map.setCenter({ lat, lng });
            map.setZoom(12); // 適切なズームレベルに設定
          }
        }
      }
    }

    // クラスタリングが有効な場合、クラスタリングを設定
    if (enableClustering && newMarkers.length > 0) {
      const { gridSize } = memoizedClusterOptions;
      try {
        // クラスタリングインスタンスを作成
        const algorithm = new GridAlgorithm({
          gridSize,
        });

        // 型キャストを修正：MarkerClustererとの互換性を確保
        clustererRef.current = new MarkerClusterer({
          map,
          markers: newMarkers as unknown as google.maps.Marker[],
          algorithm,
        });

        // パフォーマンス測定データをログに出力
        const duration = performance.now() - startTime;
        logger.debug('マーカークラスタリングを設定しました', {
          component: COMPONENT_NAME,
          markerCount: newMarkers.length,
          durationMs: Math.round(duration),
        });
      } catch (error) {
        logger.error('マーカークラスタリングの設定に失敗しました', {
          component: COMPONENT_NAME,
          error,
        });
      }
    }

    // パフォーマンス計測終了とログ記録
    const duration = performance.now() - startTime;
    if (newMarkers.length > 10) {
      // 多数のマーカーがある場合のみ記録
      logger.debug('マーカー作成完了', {
        component: COMPONENT_NAME,
        markerCount: newMarkers.length,
        durationMs: Math.round(duration),
      });
    }

    return newMarkers;
  }, [mapRef, pois, createMarker, enableClustering, memoizedClusterOptions, cleanupMarkers]); // マップもしくはPOIデータが変更されたらマーカーを更新
  useEffect(() => {
    // マップとPOIデータが両方存在する場合のみマーカーを作成
    if (mapRef.current && pois.length > 0) {
      createMarkers();
    }
  }, [createMarkers, mapRef, pois]);

  // コンポーネントのアンマウント時のみクリーンアップを実行
  useEffect(() => {
    return () => {
      // クリーンアップ処理はアンマウント時のみ実行
      cleanupMarkers();
    };
  }, [cleanupMarkers]);

  return {
    markers,
    clusterer: clustererRef.current,
  };
}
