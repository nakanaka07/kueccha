import { debounce } from 'lodash-es';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useNetworkState } from '@/hooks/useNetworkState';
import type { PointOfInterest } from '@/types/poi';
import { logger, LogLevel } from '@/utils/logger';

// 定数の外部化
const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_VISIBILITY_MARGIN = 0.5; // 表示領域を50%拡張
const COMPONENT_NAME = 'useMarkerVisibility';

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

  /** オフライン時のフォールバック戦略（'show-all' | 'hide-all' | 'last-known'） */
  offlineStrategy?: 'show-all' | 'hide-all' | 'last-known';
}

/**
 * マーカー更新の結果を表す型
 */
interface MarkerUpdateResult {
  visibleIds: Set<string>;
  visibleCount: number;
  errorCount: number;
  isOfflineMode: boolean;
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

/**
 * POI配列から安全にPOIを取得する関数（セキュリティ対策）
 * @param pois POI配列
 * @param index 取得するインデックス
 * @returns POIオブジェクトまたはundefined
 */
function safeGetPOI(pois: PointOfInterest[], index: number): PointOfInterest | undefined {
  if (index < 0 || index >= pois.length) {
    return undefined;
  }
  // セキュリティ警告を回避するため、安全な方法で要素を取得
  return pois.at(index);
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
  offlineStrategy = 'last-known',
}: UseMarkerVisibilityParams) {
  // 表示中のPOI IDのセットを使用することで高速な検索を実現
  const [visiblePOIIds, setVisiblePOIIds] = useState<Set<string>>(new Set());
  // 最後に成功した表示状態を保持（オフライン時のフォールバック用）
  const lastKnownVisibleIds = useRef<Set<string>>(new Set());
  // エラー状態の管理
  const [hasError, setHasError] = useState(false);
  // レンダリングカウントの最適化
  const renderCountRef = useRef(0);
  // ネットワーク状態の取得
  const { isOnline } = useNetworkState();

  // メモリ効率のために計算結果をキャッシュ
  const visiblePOIs = useMemo(() => {
    return pois.filter(poi => visiblePOIIds.has(poi.id));
  }, [pois, visiblePOIIds]);

  // マーカーの個別処理を行う関数（単一責任の原則に基づく分離）
  const processMarker = useCallback(
    (
      marker: google.maps.marker.AdvancedMarkerElement,
      poi: PointOfInterest,
      extendedBounds: google.maps.LatLngBounds,
      map: google.maps.Map | null,
      isDevMode: boolean
    ): boolean => {
      try {
        // 引数の検証強化 - nullチェックを追加
        if (!marker) {
          logger.warn('無効なマーカー（null/undefined）が渡されました', {
            component: COMPONENT_NAME,
            poiId: poi?.id || 'unknown',
          });
          return false;
        }

        // POIのnullチェック追加
        if (!poi || !poi.id) {
          logger.warn('無効なPOI（null/undefined）が渡されました', {
            component: COMPONENT_NAME,
          });
          return false;
        }

        // marker.position が undefined または null の場合の対応
        if (!marker.position) {
          logger.warn('マーカーの位置情報が不正です', {
            component: COMPONENT_NAME,
            poiId: poi.id,
            poiName: poi.name,
          });

          // 位置情報が無効なマーカーは非表示に
          if (marker.map) {
            marker.map = null;
          }
          return false;
        }

        // position の型によって処理を分岐
        let positionLatLng: google.maps.LatLng;

        if (marker.position instanceof google.maps.LatLng) {
          // すでに LatLng オブジェクトの場合
          positionLatLng = marker.position;
        } else {
          // LatLngLiteral オブジェクトの場合
          try {
            positionLatLng = new google.maps.LatLng(
              marker.position.lat || 0,
              marker.position.lng || 0
            );
          } catch (error) {
            logger.warn('マーカー位置の変換に失敗しました', {
              component: COMPONENT_NAME,
              poiId: poi.id,
              position: marker.position,
              error,
            });
            if (marker.map) {
              marker.map = null;
            }
            return false;
          }
        }

        // 表示範囲内かチェック
        try {
          if (extendedBounds.contains(positionLatLng)) {
            // 表示範囲内の場合
            if (marker.map !== map) {
              logger.debug('マーカーを表示範囲内として表示します', {
                component: COMPONENT_NAME,
                poiId: poi.id,
                position: { lat: positionLatLng.lat(), lng: positionLatLng.lng() },
              });
              marker.map = map;
            }
            return true;
          } else {
            // 表示範囲外の場合
            if (isDevMode) {
              // デバッグモードでは表示範囲外でもマーカーを表示
              if (marker.map !== map) {
                logger.debug('デバッグモード: 範囲外ですがマーカーを表示します', {
                  component: COMPONENT_NAME,
                  poiId: poi.id,
                  position: { lat: positionLatLng.lat(), lng: positionLatLng.lng() },
                });
                marker.map = map;
              }
              return true; // デバッグモードでは可視としてカウント
            } else {
              // 本番環境では範囲外のマーカーは地図から外す（描画コストを削減）
              if (marker.map) {
                marker.map = null;
              }
              return false;
            }
          }
        } catch (boundsError) {
          logger.warn('マーカー表示領域チェックでエラーが発生しました', {
            component: COMPONENT_NAME,
            poiId: poi.id,
            error: boundsError,
          });
          // エラー発生時はデフォルトで表示する
          marker.map = map;
          return true;
        }
      } catch (error) {
        logger.error('マーカー処理中にエラーが発生しました', {
          component: COMPONENT_NAME,
          poiId: poi?.id || 'unknown',
          error,
        });
        return false;
      }
    },
    []
  );

  // 可視マーカーを更新する関数
  const updateVisibleMarkers = useCallback((): MarkerUpdateResult => {
    renderCountRef.current += 1;

    // 戻り値の初期状態
    const result: MarkerUpdateResult = {
      visibleIds: new Set<string>(),
      visibleCount: 0,
      errorCount: 0,
      isOfflineMode: !isOnline,
    };

    try {
      const map = mapRef.current;
      if (!map) {
        throw new Error('マップが初期化されていません');
      }

      const bounds = map.getBounds();
      if (!bounds) {
        throw new Error('マップの表示領域が取得できません');
      }

      // 安全チェック - マーカーとPOIの数の検証
      if (markers.length !== pois.length) {
        logger.warn('マーカー数とPOI数が一致しません', {
          component: COMPONENT_NAME,
          markersCount: markers.length,
          poisCount: pois.length,
        });
      }

      // オフライン時の処理
      if (!isOnline) {
        logger.warn('オフラインモードでマーカー表示を調整します', {
          component: COMPONENT_NAME,
          strategy: offlineStrategy,
        });

        switch (offlineStrategy) {
          case 'show-all':
            // すべてのマーカーを表示
            markers.forEach((marker, index) => {
              const poi = safeGetPOI(pois, index);
              if (poi) {
                marker.map = map;
                result.visibleIds.add(poi.id);
                result.visibleCount++;
              }
            });
            break;

          case 'hide-all':
            // すべてのマーカーを非表示
            markers.forEach(marker => {
              marker.map = null;
            });
            break;

          case 'last-known':
          default:
            // 最後に成功した表示状態を使用
            result.visibleIds = new Set(lastKnownVisibleIds.current);
            result.visibleCount = lastKnownVisibleIds.current.size;
            markers.forEach((marker, index) => {
              const poi = safeGetPOI(pois, index);
              if (poi) {
                marker.map = lastKnownVisibleIds.current.has(poi.id) ? map : null;
              }
            });
            break;
        }

        return result;
      }

      // 表示範囲のバッファリングを計算
      const extendedBounds = calculateExtendedBounds(bounds, visibilityMargin);
      const newVisibleIds = new Set<string>();
      const isDevMode = process.env.NODE_ENV === 'development';

      // マーカーとPOIを対応付けて表示状態を更新 - アレイインデックスではなく、安全なイテレーションを使用
      const validPairs: Array<{
        marker: google.maps.marker.AdvancedMarkerElement;
        poi: PointOfInterest;
      }> = [];

      // 各マーカーに対して対応するPOIを見つける
      for (let i = 0; i < markers.length; i++) {
        // サイズの範囲チェック
        if (i >= 0 && i < pois.length) {
          // 安全なアクセス方法を使用
          const marker = markers.at(i);
          const poi = pois.at(i);

          if (marker && poi && poi.id) {
            validPairs.push({ marker, poi });
          } else {
            result.errorCount++;
            if (isDevMode) {
              logger.debug('マーカーまたはPOIが無効です', {
                component: COMPONENT_NAME,
                index: i,
                hasMarker: !!marker,
                hasPoi: !!poi,
                hasPoiId: !!(poi && poi.id),
              });
            }
          }
        } else {
          result.errorCount++;
        }
      }

      // 有効なペアだけを処理
      validPairs.forEach(({ marker, poi }) => {
        const isVisible = processMarker(marker, poi, extendedBounds, map, isDevMode);
        if (isVisible) {
          newVisibleIds.add(poi.id);
          result.visibleCount++;
        }
      });

      result.visibleIds = newVisibleIds;

      // 成功時に最後の状態を保存
      lastKnownVisibleIds.current = new Set(newVisibleIds);
      return result;
    } catch (error) {
      setHasError(true);
      logger.error('マーカー可視性更新中にエラーが発生しました', {
        component: COMPONENT_NAME,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : String(error),
        renderCount: renderCountRef.current,
      });

      // マーカーをすべて表示する緊急フォールバック
      // ユーザーエクスペリエンスを確保するため
      const fallbackVisibleIds = new Set<string>();
      if (mapRef.current) {
        try {
          markers.forEach((marker, idx) => {
            if (idx >= 0 && idx < pois.length) {
              const poi = pois.at(idx);
              if (marker && poi && poi.id) {
                marker.map = mapRef.current;
                fallbackVisibleIds.add(poi.id);
              }
            }
          });

          result.visibleIds = fallbackVisibleIds;
          result.visibleCount = fallbackVisibleIds.size;
        } catch (fallbackError) {
          logger.warn('緊急フォールバック処理中にエラーが発生しました', {
            component: COMPONENT_NAME,
            error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          });
        }
      }

      // エラー時はオフラインモードの戦略を適用
      result.isOfflineMode = true;
      return result;
    }
  }, [mapRef, markers, pois, visibilityMargin, isOnline, offlineStrategy, processMarker]);

  // 可視性状態の更新処理
  const handleVisibilityUpdate = useCallback(() => {
    // パフォーマンス計測を統合
    return logger.measureTime(
      'マーカー可視性の更新',
      () => {
        const result = updateVisibleMarkers();

        // 状態を更新（前回と変化がある場合のみ）
        if (!setsAreEqual(visiblePOIIds, result.visibleIds)) {
          setVisiblePOIIds(result.visibleIds);

          // コールバックが提供されている場合は実行
          if (onVisibilityChange) {
            onVisibilityChange(result.visibleCount, markers.length);
          }

          // 最適化の統計情報をログ
          logger.debug('マーカー可視性を更新しました', {
            component: COMPONENT_NAME,
            visibleCount: result.visibleCount,
            totalCount: markers.length,
            errorCount: result.errorCount,
            visibilityRatio: markers.length > 0 ? result.visibleCount / markers.length : 0,
            isOfflineMode: result.isOfflineMode,
            renderCount: renderCountRef.current,
          });
        }

        return result;
      },
      LogLevel.DEBUG
    );
  }, [updateVisibleMarkers, visiblePOIIds, onVisibilityChange, markers.length]);

  // デバウンスされた更新関数
  const debouncedUpdateVisibleMarkers = useMemo(
    () => debounce(handleVisibilityUpdate, debounceMs),
    [handleVisibilityUpdate, debounceMs]
  );

  // マップイベントのリスナーを設定
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 必要最小限のイベントだけをリッスン
    const listeners = [
      map.addListener('idle', debouncedUpdateVisibleMarkers),
      map.addListener('zoom_changed', debouncedUpdateVisibleMarkers),
    ];

    // 初期実行
    debouncedUpdateVisibleMarkers();

    // クリーンアップ関数
    return () => {
      listeners.forEach(listener => google.maps.event.removeListener(listener));
      debouncedUpdateVisibleMarkers.cancel(); // デバウンス中の処理をキャンセル
    };
  }, [mapRef, debouncedUpdateVisibleMarkers]);

  // ネットワーク状態が変化した場合に強制的に更新
  useEffect(() => {
    if (mapRef.current) {
      logger.info('ネットワーク状態が変更されました、マーカーを再評価します', {
        component: COMPONENT_NAME,
        isOnline,
      });

      // ネットワーク状態変更時は即時に更新（デバウンスなし）
      handleVisibilityUpdate();
    }
  }, [isOnline, handleVisibilityUpdate, mapRef]);

  return {
    visiblePOIs,
    hasError,
    isOffline: !isOnline,
  };
}
