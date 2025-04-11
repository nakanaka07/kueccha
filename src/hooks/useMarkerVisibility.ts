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
 * 地図の表示領域に基づいてマーカーの表示/非表示を最適化するカスタムフック
 * KISS原則に基づいてシンプル化されています
 */
export function useMarkerVisibility({
  mapRef,
  markers,
  pois,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  visibilityMargin = DEFAULT_VISIBILITY_MARGIN,
  onVisibilityChange,
}: UseMarkerVisibilityParams) {
  // 表示中のマーカー数を保持する状態
  const [visibleCount, setVisibleCount] = useState<number>(0);

  // マーカーとPOIを組み合わせる
  const markersWithPOI = useMemo(() => {
    if (markers.length !== pois.length) {
      logger.warn('マーカー数とPOIデータ数が一致しません', {
        component: 'useMarkerVisibility',
        markersCount: markers.length,
        poisCount: pois.length,
      });
    }

    return markers
      .map((marker, index) => ({
        marker,
        poi: pois[index] || ({ id: `unknown-${index}` } as PointOfInterest),
      }))
      .filter(item => item.marker && item.poi);
  }, [markers, pois]);

  // 表示中のマーカーを更新する関数
  const updateVisibleMarkers = useCallback(
    debounce(() => {
      const map = mapRef.current;
      if (!map) return;

      const bounds = map.getBounds();
      if (!bounds) return;

      // 表示領域を拡張
      const extendedBounds = calculateExtendedBounds(bounds, visibilityMargin);

      // 表示範囲内のマーカーだけを表示
      let newVisibleCount = 0;

      markersWithPOI.forEach(({ marker, poi }) => {
        if (!marker.position) return;

        // マーカーが拡張された表示領域内にあるかチェック
        const isVisible = extendedBounds.contains(marker.position);

        // マーカーの表示/非表示を設定
        if (isVisible) {
          marker.map = map;
          newVisibleCount++;
        } else {
          marker.map = null;
        }
      });

      // 表示数を更新
      setVisibleCount(newVisibleCount);

      // コールバックを呼び出し
      if (onVisibilityChange) {
        onVisibilityChange(newVisibleCount, markersWithPOI.length);
      }

      logger.debug(`表示マーカー: ${newVisibleCount}/${markersWithPOI.length}`, {
        component: 'useMarkerVisibility',
      });
    }, debounceMs),
    [mapRef, markersWithPOI, visibilityMargin, debounceMs, onVisibilityChange]
  );

  // マップの移動やズーム変更時にマーカー表示を更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    // イベントリスナーを登録
    const listeners = [
      map.addListener('idle', updateVisibleMarkers),
      map.addListener('zoom_changed', updateVisibleMarkers),
    ];

    // 初回実行
    updateVisibleMarkers();

    // クリーンアップ関数
    return () => {
      listeners.forEach(listener => google.maps.event.removeListener(listener));
      updateVisibleMarkers.cancel(); // debounceキャンセル
    };
  }, [mapRef, updateVisibleMarkers]);

  return {
    visibleCount,
    totalCount: markersWithPOI.length,
  };
}
