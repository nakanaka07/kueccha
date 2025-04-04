import { useEffect, useCallback, useRef, useMemo } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { logger, LogLevel } from '@/utils/logger';
import { isInViewport } from '@/utils/markerUtils';
import { ENV, getEnv } from '@/utils/env';

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
 *
 * @param map Google Maps インスタンス
 * @param visibilityMargin 表示領域の拡張マージン（ピクセル単位）
 * @returns 拡張された地理的境界
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

  // メモリ使用量と関数呼び出し数を最小化するために、
  // 結果のオブジェクトは呼び出し元で再利用
  return new google.maps.LatLngBounds(
    new google.maps.LatLng(sw.lat() - latMargin, sw.lng() - lngMargin),
    new google.maps.LatLng(ne.lat() + latMargin, ne.lng() + lngMargin)
  );
}

/**
 * 位置情報からGoogle Maps LatLngオブジェクトを取得
 * オブジェクトの生成を最小限に抑えるための最適化関数
 */
function getLatLng(position: google.maps.LatLng | google.maps.LatLngLiteral): {
  lat: number;
  lng: number;
} {
  // 型に応じて適切にlatとlngを取得
  const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
  const lng = typeof position.lng === 'function' ? position.lng() : position.lng;
  return { lat, lng };
}

/**
 * マーカーの可視性をチェックして更新する関数
 *
 * @param map マップインスタンス
 * @param markers マーカーの配列
 * @param pois POI（関心ポイント）の配列
 * @param visibilityMargin 可視性マージン
 * @param visibleCountRef 現在表示されているマーカーの数の参照
 * @param onVisibilityChange 可視性変更時のコールバック
 */
function checkAndUpdateMarkerVisibility(
  map: google.maps.Map,
  markers: google.maps.marker.AdvancedMarkerElement[],
  pois: PointOfInterest[],
  visibilityMargin: number,
  visibleCountRef: React.MutableRefObject<number>,
  onVisibilityChange?: (visibleMarkers: number) => void
): void {
  // 境界データを取得
  const extendedBounds = calculateExtendedBounds(map, visibilityMargin);
  if (!extendedBounds) return;

  // マーカー配列とPOI配列の長さの不一致をチェック
  if (markers.length !== pois.length) {
    logger.warn('マーカー配列とPOI配列の長さが一致しません', {
      component: 'useMarkerVisibility',
      markersLength: markers.length,
      poisLength: pois.length,
    });
  }

  let visibleCount = 0;
  let invisibleCount = 0;

  // マーカーの可視性チェック
  for (let i = 0; i < markers.length; i++) {
    if (i >= pois.length) break; // POIデータが存在する場合のみ処理

    const marker = markers[i];
    // markerが存在しない場合はスキップ
    if (!marker) continue;

    const position = marker.position as google.maps.LatLng | google.maps.LatLngLiteral | undefined;
    // positionが存在しない場合はスキップ
    if (!position) continue;

    // 位置情報を取得
    const { lat, lng } = getLatLng(position);

    // 位置情報から新しいLatLngオブジェクトを作成
    const currentLatLng = new google.maps.LatLng(lat, lng);

    // 拡張された境界内にマーカーがあるか確認
    const isVisible =
      extendedBounds.contains(currentLatLng) || isInViewport({ lat, lng }, map, visibilityMargin);

    // AdvancedMarkerElementでは、setVisibleの代わりにmapプロパティを設定
    marker.map = isVisible ? map : null;

    if (isVisible) {
      visibleCount++;
    } else {
      invisibleCount++;
    }
  }

  // 可視マーカー数が変化した場合のみコールバックを呼び出し
  if (onVisibilityChange && visibleCount !== visibleCountRef.current) {
    onVisibilityChange(visibleCount);
  }

  // 可視マーカー数を更新
  const previousCount = visibleCountRef.current;
  visibleCountRef.current = visibleCount;

  // 可視マーカー数に大きな変化があった場合はINFOレベルでログ記録
  if (previousCount !== visibleCount) {
    const visibilityChange = Math.abs(visibleCount - previousCount);
    const logLevel =
      visibilityChange > markers.length * 0.3
        ? LogLevel.INFO // 30%以上の変化はINFOレベル
        : LogLevel.DEBUG;

    logger.logIf(
      // デバッグモードか重要な変化がある場合のみログ出力
      ENV.env.debug || logLevel === LogLevel.INFO,
      logLevel,
      'マーカー可視性が更新されました',
      {
        component: 'useMarkerVisibility',
        visibleMarkers: visibleCount,
        invisibleMarkers: invisibleCount,
        totalMarkers: markers.length,
        visibilityChange,
        zoomLevel: map.getZoom(),
      }
    );
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
  debounceMs,
  visibilityMargin = 50,
  onVisibilityChange,
}: UseMarkerVisibilityParams): void {
  // 環境変数から設定を読み込み、未設定の場合はデフォルト値を使用
  const configuredDebounceMs = useMemo(() => {
    return (
      debounceMs ??
      getEnv('VITE_MARKER_VISIBILITY_DEBOUNCE_MS', {
        defaultValue: 100,
        transform: value => parseInt(value, 10),
      })
    );
  }, [debounceMs]);

  // 前回の可視マーカー数を追跡
  const visibleCountRef = useRef<number>(0);

  // デバウンスタイマーの参照
  const debounceTimerRef = useRef<number | null>(null);

  // マーカー可視性の更新処理（メモ化）- 依存配列を最適化
  const updateMarkerVisibility = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const measureLogging = ENV.env.debug || ENV.features.verboseLogging;

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
        // デバッグモードまたは詳細ログが有効な場合はDEBUG、それ以外ではログ出力を抑制
        measureLogging ? LogLevel.DEBUG : LogLevel.INFO,
        { component: 'useMarkerVisibility' },
        // 50ms以上かかった場合のみログに記録
        50
      );
    } catch (error: unknown) {
      // エラータイプに基づいて詳細なエラー分類
      if (error instanceof TypeError) {
        // 型エラー - マーカーやマップの型に関する問題
        logger.error('マーカー可視性更新で型エラーが発生しました', {
          component: 'useMarkerVisibility',
          errorType: 'TypeError',
          message: error.message,
        });
      } else if (error instanceof RangeError) {
        // 範囲エラー - 不正なインデックスアクセスなど
        logger.error('マーカー可視性更新で範囲エラーが発生しました', {
          component: 'useMarkerVisibility',
          errorType: 'RangeError',
          message: error.message,
        });
      } else if (error instanceof Error) {
        // その他の標準エラー
        logger.error('マーカー可視性更新エラー', {
          component: 'useMarkerVisibility',
          errorType: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else {
        // 未知のエラー型
        logger.error('マーカー可視性更新で不明なエラーが発生しました', {
          component: 'useMarkerVisibility',
          error: String(error),
        });
      }

      // エラー詳細のコンテキスト追加
      logger.debug('マーカー可視性更新エラー詳細コンテキスト', {
        component: 'useMarkerVisibility',
        markersCount: markers.length,
        poisCount: pois.length,
        mapLoaded: !!map,
        hasBounds: map.getBounds() ? true : false,
        visibilityMargin,
      });
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
    }, configuredDebounceMs); // 環境変数から設定された値を使用
  }, [updateMarkerVisibility, configuredDebounceMs]);

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

    // コンポーネント初期化ログ
    logger.debug('マーカー可視性管理を初期化しました', {
      component: 'useMarkerVisibility',
      initialMarkers: markers.length,
      debounceMs: configuredDebounceMs,
      visibilityMargin,
    });

    // クリーンアップ関数
    return () => {
      // イベントリスナーを削除
      listeners.forEach(listener => google.maps.event.removeListener(listener));

      // 保留中のデバウンスタイマーをクリア
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }

      // クリーンアップログ
      logger.debug('マーカー可視性管理を解放しました', {
        component: 'useMarkerVisibility',
        finalVisibleCount: visibleCountRef.current,
      });
    };
  }, [
    mapRef,
    debouncedUpdateVisibility,
    updateMarkerVisibility,
    markers.length,
    configuredDebounceMs,
    visibilityMargin,
  ]);

  // マーカーまたはPOIリストが変更された時に可視性を更新
  useEffect(() => {
    updateMarkerVisibility();
  }, [markers, pois, updateMarkerVisibility]);
}
