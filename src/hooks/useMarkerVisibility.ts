import { debounce } from 'lodash-es';
import { useState, useEffect, useCallback, useMemo } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';

// 定数の外部化
const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_VISIBILITY_MARGIN = 0.5; // 表示領域を50%拡張

/**
 * マーカー可視性管理のパラメータ
 */
interface UseMarkerVisibilityParams {
  /** Google Maps のインスタンスへの参照 */
  mapRef: React.MutableRefObject<google.maps.Map | null>;

  /** 管理対象のマーカー配列 */
  markers: google.maps.marker.AdvancedMarkerElement[];

  /** マーカーに対応するPOIデータ配列 */
  pois: PointOfInterest[];

  /** 可視性チェックの頻度を制限するデバウンス時間（ミリ秒） */
  debounceMs?: number;

  /** 可視性チェックのマージン（表示領域外でも可視とするバッファー率、1.0 = 100%拡張） */
  visibilityMargin?: number;

  /** マーカー可視性変更時のコールバック（オプション） */
  onVisibilityChange?: (visibleCount: number, totalCount: number) => void;
}

/**
 * 表示領域を拡張した境界を計算する
 * @param bounds 元の境界
 * @param margin 拡張マージン (0.5 = 50%拡張)
 * @returns 拡張された境界
 */
function calculateExtendedBounds(
  bounds: google.maps.LatLngBounds,
  margin: number
): google.maps.LatLngBounds {
  if (!margin || margin <= 0) return bounds;

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  // 緯度と経度の差を計算
  const latDiff = ne.lat() - sw.lat();
  const lngDiff = ne.lng() - sw.lng();

  // 境界を拡張
  const extendedBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(sw.lat() - latDiff * margin, sw.lng() - lngDiff * margin),
    new google.maps.LatLng(ne.lat() + latDiff * margin, ne.lng() + lngDiff * margin)
  );

  return extendedBounds;
}

/**
 * マーカーとPOIデータを組み合わせたオブジェクト
 */
interface MarkerWithPOI {
  marker: google.maps.marker.AdvancedMarkerElement;
  poi: PointOfInterest;
}

/**
 * マップの表示領域内のマーカーだけを効率的に表示するためのフック
 * パフォーマンス最適化ガイドラインに沿った実装
 */
export function useMarkerVisibility({
  mapRef,
  markers,
  pois,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  visibilityMargin = DEFAULT_VISIBILITY_MARGIN,
  onVisibilityChange,
}: UseMarkerVisibilityParams) {
  // 表示中のPOI IDのセットを使用することで高速な検索を実現
  const [visiblePOIIds, setVisiblePOIIds] = useState<Set<string>>(new Set());

  // メモリ効率のために計算結果をキャッシュ
  const visiblePOIs = useMemo(() => {
    return pois.filter(poi => visiblePOIIds.has(poi.id));
  }, [pois, visiblePOIIds]);

  // 可視マーカーを更新する関数（YAGNI原則に基づき、シンプル化）
  const updateVisibleMarkers = useCallback(
    debounce(() => {
      const map = mapRef.current;
      if (!map) return;

      const bounds = map.getBounds();
      if (!bounds) return;

      // 表示範囲のバッファリングを計算
      const extendedBounds = calculateExtendedBounds(bounds, visibilityMargin);

      // 表示中のPOI ID集合を効率的に構築
      const newVisibleIds = new Set<string>();
      let visibleCount = 0;

      // マーカーとPOIを対応付けて表示状態を更新
      markers.forEach((marker, index) => {
        if (index >= pois.length) return;

        const poi = pois[index];
        const position = marker.position as google.maps.LatLng;

        // 位置情報があり、表示範囲内の場合のみ表示
        if (position && extendedBounds.contains(position)) {
          newVisibleIds.add(poi.id);
          visibleCount++;

          // マーカーが非表示だった場合のみ表示操作を行う
          if (marker.map !== map) {
            marker.map = map;
          }
        } else {
          // 範囲外のマーカーは地図から外す（描画コストを削減）
          if (marker.map) {
            marker.map = null;
          }
        }
      });

      // 状態を更新（前回と変化がある場合のみ）
      if (!setsAreEqual(visiblePOIIds, newVisibleIds)) {
        setVisiblePOIIds(newVisibleIds);

        // コールバックが提供されている場合は実行
        if (onVisibilityChange) {
          onVisibilityChange(visibleCount, markers.length);
        }

        // 最適化の統計情報をログ
        logger.debug('マーカー可視性を更新しました', {
          component: 'useMarkerVisibility',
          visibleCount,
          totalCount: markers.length,
          visibilityRatio: markers.length > 0 ? visibleCount / markers.length : 0,
        });
      }
    }, debounceMs),
    [mapRef, markers, pois, visibilityMargin, onVisibilityChange, visiblePOIIds, debounceMs]
  );

  // マップイベントのリスナーを設定
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 必要最小限のイベントだけをリッスン
    const listeners = [
      map.addListener('idle', updateVisibleMarkers),
      map.addListener('zoom_changed', updateVisibleMarkers),
    ];

    // 初期実行
    updateVisibleMarkers();

    // クリーンアップ関数
    return () => {
      listeners.forEach(listener => google.maps.event.removeListener(listener));
      updateVisibleMarkers.cancel(); // デバウンス中の処理をキャンセル
    };
  }, [mapRef, updateVisibleMarkers]);

  return { visiblePOIs };
}

/**
 * 2つのSetが等価かどうか比較する関数
 * @param a 比較対象のSet
 * @param b 比較対象のSet
 * @returns 等価かどうか
 */
function setsAreEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
