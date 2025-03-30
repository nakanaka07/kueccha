import { useEffect, useCallback, useRef } from 'react';

import { PointOfInterest } from '@/types/poi';
import { logger, LogLevel } from '@/utils/logger';
import { isInViewport } from '@/utils/markerUtils';

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

  /** 可視性チェックのマージン（表示領域外でも可視とするピクセル数） */
  visibilityMargin?: number;

  /** マーカー可視性変更時のコールバック（オプション） */
  onVisibilityChange?: (visibleMarkers: number) => void;
}

/**
 * 地図表示領域に基づいて拡張された境界を計算する
 */
function calculateExtendedBounds(
  map: google.maps.Map,
  visibilityMargin: number
): google.maps.LatLngBounds | null {
  const bounds = map.getBounds();
  if (!bounds) return null;

  // 画面サイズを取得（マージン計算用）
  const mapDiv = map.getDiv();
  const mapWidth = mapDiv.clientWidth;
  const mapHeight = mapDiv.clientHeight;

  // 拡張された境界を計算（ビューポート外のマージンも含める）
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const latMargin = (ne.lat() - sw.lat()) * (visibilityMargin / mapHeight);
  const lngMargin = (ne.lng() - sw.lng()) * (visibilityMargin / mapWidth);

  return new google.maps.LatLngBounds(
    new google.maps.LatLng(sw.lat() - latMargin, sw.lng() - lngMargin),
    new google.maps.LatLng(ne.lat() + latMargin, ne.lng() + lngMargin)
  );
}

/**
 * マーカーの可視性をチェックして更新する関数
 */
function checkAndUpdateMarkerVisibility(
  map: google.maps.Map,
  markers: google.maps.marker.AdvancedMarkerElement[],
  pois: PointOfInterest[],
  visibilityMargin: number,
  visibleCountRef: React.MutableRefObject<number>,
  onVisibilityChange?: (visibleMarkers: number) => void
): void {
  const extendedBounds = calculateExtendedBounds(map, visibilityMargin);
  if (!extendedBounds) return;

  let visibleCount = 0;
  let invisibleCount = 0;

  // マーカーの可視性チェック
  markers.forEach((marker, index) => {
    if (index < pois.length) {
      const position = marker.position as google.maps.LatLng | google.maps.LatLngLiteral;

      // 位置情報を取得
      const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
      const lng = typeof position.lng === 'function' ? position.lng() : position.lng;

      // 拡張された境界内にマーカーがあるか確認
      const isVisible =
        extendedBounds.contains(new google.maps.LatLng(lat, lng)) ||
        isInViewport({ lat, lng }, map, visibilityMargin);

      // AdvancedMarkerElementでは、setVisibleの代わりにmapプロパティを設定
      marker.map = isVisible ? map : null;

      if (isVisible) {
        visibleCount++;
      } else {
        invisibleCount++;
      }
    }
  });

  // 可視マーカー数が変化した場合のみコールバックを呼び出し
  if (onVisibilityChange && visibleCount !== visibleCountRef.current) {
    onVisibilityChange(visibleCount);
  }

  // 可視マーカー数を更新
  const previousCount = visibleCountRef.current;
  visibleCountRef.current = visibleCount;

  // 可視マーカー数に変化があった場合にのみログを出力
  if (previousCount !== visibleCount) {
    logger.debug('マーカー可視性が更新されました', {
      visibleMarkers: visibleCount,
      invisibleMarkers: invisibleCount,
      totalMarkers: markers.length,
      zoomLevel: map.getZoom(),
      componentName: 'useMarkerVisibility',
    });
  }
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

  // マーカー可視性の更新処理（メモ化）
  const updateMarkerVisibility = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      logger.measureTime(
        'マーカー可視性更新',
        () => {
          checkAndUpdateMarkerVisibility(
            map,
            markers,
            pois,
            visibilityMargin,
            visibleCountRef,
            onVisibilityChange
          );
        },
        LogLevel.DEBUG,
        { component: 'useMarkerVisibility' },
        // 50ms以上かかった場合のみログに記録
        50
      );
    } catch (error: unknown) {
      // エラーオブジェクトを型安全に渡す
      if (error instanceof Error) {
        logger.error('マーカー可視性更新エラー', error);
      } else {
        logger.error('マーカー可視性更新エラー', new Error(String(error)));
      }

      // エラー詳細のコンテキスト追加
      const errorContext = {
        markersCount: markers.length,
        poisCount: pois.length,
        mapLoaded: !!map,
        hasBounds: map.getBounds() ? true : false,
        visibilityMargin,
        component: 'useMarkerVisibility',
      };

      logger.debug('マーカー可視性更新エラー詳細コンテキスト', errorContext);
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
      listeners.forEach(listener => google.maps.event.removeListener(listener));

      // 保留中のデバウンスタイマーをクリア
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [mapRef, debouncedUpdateVisibility, updateMarkerVisibility]);

  // マーカーまたはPOIリストが変更された時に可視性を更新
  useEffect(() => {
    updateMarkerVisibility();
  }, [markers, pois, updateMarkerVisibility]);
}
