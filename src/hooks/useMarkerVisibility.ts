import { useEffect, useCallback, useRef } from 'react';

import { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';
import { isInViewport } from '@/utils/markerUtils';

/**
 * マーカー可視性管理のパラメータ
 */
interface UseMarkerVisibilityParams {
  /** Google Maps のインスタンスへの参照 */
  mapRef: React.MutableRefObject<google.maps.Map | null>;

  /** 管理対象のマーカー配列 */
  markers: google.maps.Marker[];

  /** マーカーに対応するPOIデータ配列 */
  pois: PointOfInterest[];

  /** 可視性チェックの頻度を制限するデバウンス時間（ミリ秒） */
  debounceMs?: number;

  /** 可視性チェックのマージン（表示領域外でも可視とするピクセル数） */
  visibilityMargin?: number;

  /** マーカー可視性変更時のコールバック（オプション） */
  onVisibilityChange?: (visibleMarkers: number) => void;
}

/**
 * 地図の表示領域に基づいてマーカーの可視性を最適化するカスタムフック
 *
 * このフックは、現在の地図表示領域内に存在するマーカーのみを表示し、
 * 表示範囲外のマーカーを非表示にすることでパフォーマンスを最適化します。
 *
 * @example
 * ```tsx
 * useMarkerVisibility({
 *   mapRef,
 *   markers,
 *   pois: filteredPOIs,
 *   debounceMs: 150
 * });
 * ```
 */
export function useMarkerVisibility({
  mapRef,
  markers,
  pois,
  debounceMs = 100,
  visibilityMargin = 50,
  onVisibilityChange,
}: UseMarkerVisibilityParams): void {
  // 前回の可視マーカー数を追跡
  const visibleCountRef = useRef<number>(0);

  // デバウンスタイマーの参照
  const debounceTimerRef = useRef<number | null>(null);

  // イベントリスナーの参照（クリーンアップ用）
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null);

  // マーカー可視性の更新処理（メモ化）
  const updateMarkerVisibility = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const bounds = map.getBounds();
      if (!bounds) return;

      // 画面サイズを取得（マージン計算用）
      const mapDiv = map.getDiv();
      const mapWidth = mapDiv.clientWidth;
      const mapHeight = mapDiv.clientHeight;

      // 拡張された境界を計算（ビューポート外のマージンも含める）
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latMargin = (ne.lat() - sw.lat()) * (visibilityMargin / mapHeight);
      const lngMargin = (ne.lng() - sw.lng()) * (visibilityMargin / mapWidth);

      const extendedBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(sw.lat() - latMargin, sw.lng() - lngMargin),
        new google.maps.LatLng(ne.lat() + latMargin, ne.lng() + lngMargin)
      );

      let visibleCount = 0;

      // マーカーの可視性チェック
      markers.forEach((marker, index) => {
        if (index < pois.length) {
          const position = marker.getPosition();
          if (position) {
            // 拡張された境界内にマーカーがあるか確認
            const isVisible =
              extendedBounds.contains(position) ||
              isInViewport({ lat: position.lat(), lng: position.lng() }, map, visibilityMargin);

            marker.setVisible(isVisible);

            if (isVisible) {
              visibleCount++;
            }
          }
        }
      });

      // 可視マーカー数が変化した場合のみコールバックを呼び出し
      if (onVisibilityChange && visibleCount !== visibleCountRef.current) {
        onVisibilityChange(visibleCount);
      }

      // 可視マーカー数を更新
      visibleCountRef.current = visibleCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`マーカー可視性更新エラー: ${errorMessage}`);
    }
  }, [mapRef, markers, pois, visibilityMargin, onVisibilityChange]);

  // デバウンス処理を適用した可視性更新
  const debouncedUpdateVisibility = useCallback(() => {
    // 既存のタイマーをクリア
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // 新しいタイマーを設定
    debounceTimerRef.current = window.setTimeout(() => {
      updateMarkerVisibility();
      debounceTimerRef.current = null;
    }, debounceMs);
  }, [updateMarkerVisibility, debounceMs]);

  // 地図イベント監視の設定・クリーンアップ
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // イベントリスナーの設定
    const events = ['idle', 'zoom_changed', 'dragend'];
    const listeners = events.map(eventName =>
      map.addListener(eventName, debouncedUpdateVisibility)
    );

    // 初回実行
    updateMarkerVisibility();

    // クリーンアップ関数
    return () => {
      // イベントリスナーを削除
      listeners.forEach(listener => {
        google.maps.event.removeListener(listener);
      });

      // 保留中のデバウンスタイマーをクリア
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [mapRef, debouncedUpdateVisibility, updateMarkerVisibility]);

  // マーカーまたはPOIリストが変更された時に可視性を更新
  useEffect(() => {
    updateMarkerVisibility();
  }, [markers, pois, updateMarkerVisibility]);
}
