import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import type { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';
import { getMarkerIcon } from '@/utils/markerUtils';
// 拡張型定義の読み込み（2025年対応）
import '../types/google-maps-poi-extensions';
// POI型拡張の読み込み
import '../types/poi-extensions';

// コンポーネント名の定数
const COMPONENT_NAME = 'useMapMarkers';

// マーカークラスタリングのデフォルト設定
const DEFAULT_GRID_SIZE = 60;
const DEFAULT_MIN_CLUSTER_SIZE = 3;

/**
 * Google Maps Advanced Marker API機能のサポート状況を検出する関数
 * @since 1.4.0 - 2025年4月追加
 */
const detectAdvancedMarkerFeatures = () => {
  try {
    // 基本的なAdvanced Marker APIのサポートチェック
    const hasBasicSupport =
      typeof google?.maps?.marker !== 'undefined' && 'AdvancedMarkerElement' in google.maps.marker;

    if (!hasBasicSupport) {
      return {
        isSupported: false,
        features: {
          basic: false,
          pinElement: false,
          gmpClickable: false,
          gmpDraggable: false,
          collisionBehavior: false,
        },
      };
    }

    // 2025年の新機能サポートチェック
    const hasPinElement = 'PinElement' in google.maps.marker;
    const prototype = google.maps.marker.AdvancedMarkerElement.prototype;

    // 個別機能のサポートチェック
    return {
      isSupported: true,
      features: {
        basic: true,
        pinElement: hasPinElement,
        gmpClickable: 'gmpClickable' in prototype,
        gmpDraggable: 'gmpDraggable' in prototype,
        collisionBehavior: 'collisionBehavior' in prototype,
      },
    };
  } catch (error) {
    logger.warn('Advanced Marker API検出中にエラーが発生しました', {
      component: COMPONENT_NAME,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      isSupported: false,
      features: {
        basic: false,
        pinElement: false,
        gmpClickable: false,
        gmpDraggable: false,
        collisionBehavior: false,
      },
    };
  }
};

/**
 * マーカーアイコンのカスタム設定（既存のgetMarkerIcon関数の戻り値と互換性を持たせる）
 * @since 1.4.0 - 2025年4月追加
 */
interface MarkerIconConfig {
  url: string;
  opacity?: number;
  scaledSize?: google.maps.Size;
  anchor?: google.maps.Point;
  origin?: google.maps.Point;
}

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
  // LRUキャッシュの最大サイズ
  const MAX_CACHE_SIZE = 500;

  // マーカーアイコンのキャッシュを保持するためのrefオブジェクト
  const markerIconCacheRef = useRef<Map<string, MarkerIconConfig>>(new Map());

  // キャッシュのアクセス順を追跡するための配列
  const cacheAccessOrderRef = useRef<string[]>([]);

  /**
   * アイコン取得関数をメモ化して再利用性を高める
   * @performance キャッシング強化とLRU（Least Recently Used）方式による管理
   * @since 1.4.0 - キャッシング改善と2025年最適化ガイドライン適用
   */
  const getMarkerIconMemo = useCallback(
    (poi: PointOfInterest) => {
      // より詳細なキャッシュキーを生成（ズームレベルとデバイスピクセル比も考慮）
      const map = mapRef.current;
      const zoomLevel = map ? map.getZoom() : 15;
      const pixelRatio = window.devicePixelRatio || 1;
      const cacheKey = `${poi.id}-${poi.category || 'default'}-z${zoomLevel}-r${pixelRatio.toFixed(1)}`;

      // キャッシュに存在する場合は、アクセス順を更新して返す
      if (markerIconCacheRef.current.has(cacheKey)) {
        // 既存のキーをアクセス順リストから削除
        cacheAccessOrderRef.current = cacheAccessOrderRef.current.filter(key => key !== cacheKey);
        // 最新アクセスとして末尾に追加
        cacheAccessOrderRef.current.push(cacheKey);

        return markerIconCacheRef.current.get(cacheKey)!;
      }

      // 基本のマーカーアイコン取得
      const iconConfig = getMarkerIcon(poi);

      // キャッシュが最大サイズに達した場合、最も古いエントリを削除
      if (
        markerIconCacheRef.current.size >= MAX_CACHE_SIZE &&
        cacheAccessOrderRef.current.length > 0
      ) {
        const oldestKey = cacheAccessOrderRef.current.shift()!;
        markerIconCacheRef.current.delete(oldestKey);

        if (process.env.NODE_ENV === 'development') {
          logger.debug('マーカーアイコンキャッシュからLRUエントリを削除', {
            component: COMPONENT_NAME,
            removedKey: oldestKey,
            newCacheSize: markerIconCacheRef.current.size,
          });
        }
      }

      // キャッシュに保存し、アクセス順を更新
      markerIconCacheRef.current.set(cacheKey, iconConfig);
      cacheAccessOrderRef.current.push(cacheKey);

      return iconConfig;
    },
    [mapRef]
  );
  /**
   * マーカーを作成する関数
   * @performance getMarkerIconMemoへの依存関係を明示し、再生成を防止
   */ // 従来のマーカーを作成するヘルパー関数
  const createLegacyMarker = useCallback(
    (poi: PointOfInterest, map: google.maps.Map) => {
      const position = {
        lat: poi.latitude || poi.lat || 0,
        lng: poi.longitude || poi.lng || 0,
      };

      const marker = new google.maps.Marker({
        position,
        map: map,
        title: poi.name || '',
        icon: getMarkerIconMemo(poi).url,
      });

      // クリックイベントを設定
      marker.addListener('click', () => onMarkerClickRef.current(poi));
      return marker as unknown as google.maps.marker.AdvancedMarkerElement;
    },
    [getMarkerIconMemo]
  );
  /**
   * アクセシビリティに対応したマーカーのHTML要素を作成する関数
   * @since 1.4.0 - 2025年4月アクセシビリティ強化
   */
  const createAccessibleMarkerContent = useCallback(
    (poi: PointOfInterest, iconUrl: string, opacity?: number) => {
      // コンテナ要素の作成
      const container = document.createElement('div');
      container.className = 'advanced-marker-container';

      // マーカー要素の作成
      const content = document.createElement('div');
      content.className = 'advanced-marker';

      // 背景画像の設定
      content.style.backgroundImage = `url(${iconUrl})`;

      // レスポンシブなサイズ設定（デバイスピクセル比に基づく調整）
      const baseSize = 32;
      const pixelRatio = window.devicePixelRatio || 1;
      const adjustedSize = Math.max(baseSize, Math.round(baseSize * (pixelRatio > 1 ? 1.2 : 1)));

      content.style.width = `${adjustedSize}px`;
      content.style.height = `${adjustedSize}px`;
      content.style.backgroundSize = 'contain';
      content.style.backgroundRepeat = 'no-repeat';

      // 透明度の設定
      if (opacity !== undefined) {
        content.style.opacity = opacity.toString();
      }

      // アクセシビリティ属性の追加
      container.setAttribute('role', 'button');
      container.setAttribute('aria-label', `${poi.name || 'マーカー'} - クリックで詳細を表示`);
      container.setAttribute('tabindex', '0'); // キーボードフォーカス可能に

      // キーボード操作のサポート
      container.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onMarkerClickRef.current(poi);
        }
      });

      // 高コントラストモード対応
      content.style.filter = 'contrast(1.1)';

      // Focusスタイルの追加
      container.addEventListener('focus', () => {
        content.style.outline = '2px solid #4285F4';
        content.style.boxShadow = '0 0 8px rgba(66, 133, 244, 0.8)';
      });

      container.addEventListener('blur', () => {
        content.style.outline = 'none';
        content.style.boxShadow = 'none';
      });

      container.appendChild(content);
      return container;
    },
    []
  );

  /**
   * マーカーを作成する関数
   * @performance 2025年の最新機能を活用し、アクセシビリティを強化
   * @since 1.4.0 - 2025年のAdvanced Marker APIの新機能対応
   */
  const createMarker = useCallback(
    (poi: PointOfInterest, map: google.maps.Map) => {
      try {
        // マーカーの位置を検証
        const position = {
          lat: poi.latitude || poi.lat || 0,
          lng: poi.longitude || poi.lng || 0,
        };

        // 不正な座標の場合は早期リターン
        if (!position.lat || !position.lng) {
          logger.warn(`不正な座標: ${poi.id}`, {
            component: COMPONENT_NAME,
            poiId: poi.id,
            coordinates: position,
          });
          return null;
        }

        // Advanced Marker APIの機能検出
        const markerFeatures = detectAdvancedMarkerFeatures();

        if (markerFeatures.isSupported) {
          // APIバージョンに応じたログ出力
          if (markerFeatures.features.pinElement || markerFeatures.features.collisionBehavior) {
            logger.debug('2025年の拡張Advanced Marker機能を使用します', {
              component: COMPONENT_NAME,
              poiId: poi.id,
              supportedFeatures: markerFeatures.features,
            });
          } else {
            logger.debug('基本的なAdvanced Marker APIを使用します', {
              component: COMPONENT_NAME,
              poiId: poi.id,
            });
          }

          try {
            // メモ化した関数を使用してマーカーアイコンを取得
            const iconElement = getMarkerIconMemo(poi);

            // アクセシビリティ対応のマーカーコンテンツを作成
            const content = createAccessibleMarkerContent(
              poi,
              iconElement.url,
              iconElement.opacity
            );

            // マーカーオプションの設定
            const markerOptions: google.maps.marker.AdvancedMarkerElementOptions = {
              position,
              map: map,
              content,
              title: poi.name || '',
              zIndex: 'isPriority' in poi && poi.isPriority ? 2 : 1, // 優先度に応じたzIndex（安全にチェック）
            };

            // 拡張プロパティを含む最終オプションオブジェクトを作成
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const finalOptions: any = { ...markerOptions };

            if (markerFeatures.features.gmpClickable) {
              finalOptions.gmpClickable = true;
            }

            if (markerFeatures.features.collisionBehavior) {
              // POIの優先度に応じて衝突時の振る舞いを設定
              finalOptions.collisionBehavior =
                'isPriority' in poi && poi.isPriority
                  ? 'REQUIRED' // 重要なPOIは常に表示
                  : 'OPTIONAL_AND_HIDES_LOWER_PRIORITY'; // それ以外は必要に応じて非表示
            }

            // AdvancedMarkerElementを作成
            const marker = new google.maps.marker.AdvancedMarkerElement(finalOptions);

            // マーカーが正しく地図にセットされていることを確認
            if (!marker.map) {
              logger.warn('マーカーに地図が設定されていません。再設定を試みます', {
                component: COMPONENT_NAME,
                poiId: poi.id,
              });
              marker.map = map;
            }

            // クリックイベントを設定
            marker.addListener('gmp-click', () => onMarkerClickRef.current(poi));

            return marker;
          } catch (advancedMarkerError) {
            // エラー詳細をより詳しく記録
            logger.warn('Advanced Markersの作成に失敗しました。従来のマーカーを使用します', {
              component: COMPONENT_NAME,
              poiId: poi.id,
              featureSupport: markerFeatures.features,
              error:
                advancedMarkerError instanceof Error
                  ? {
                      name: advancedMarkerError.name,
                      message: advancedMarkerError.message,
                      stack: advancedMarkerError.stack,
                    }
                  : String(advancedMarkerError),
            });

            // フォールバックとして従来のマーカーを使用
            return createLegacyMarker(poi, map);
          }
        } else {
          // Advanced Markersが利用できない場合は従来のマーカーを使用
          logger.info('Advanced Markersが利用できません。従来のマーカーを使用します', {
            component: COMPONENT_NAME,
            browserInfo: navigator.userAgent,
          });

          return createLegacyMarker(poi, map);
        }
      } catch (error) {
        // 包括的なエラーハンドリング
        logger.error('マーカー作成処理中に予期しないエラーが発生しました', {
          component: COMPONENT_NAME,
          poiId: poi.id,
          position: poi.latitude && poi.longitude ? `${poi.latitude},${poi.longitude}` : '不明',
          error:
            error instanceof Error
              ? { name: error.name, message: error.message, stack: error.stack }
              : String(error),
        });
        return null;
      }
    },
    [getMarkerIconMemo, createLegacyMarker, createAccessibleMarkerContent]
  );
  // バッチ処理のための定数
  const BATCH_SIZE = 50; // 1バッチあたりのマーカー数
  const BATCH_DELAY = 10; // バッチ間の遅延（ミリ秒）
  const LARGE_POI_THRESHOLD = 100; // バッチ処理を開始するPOI数の閾値

  /**
   * マーカーを作成する関数
   * @performance 大量のPOIデータがある場合のバッチ処理とパフォーマンス最適化
   * @since 1.4.0 - 2025年4月バッチ処理最適化
   */
  const createMarkers = useCallback(() => {
    const startTime = performance.now();
    const map = mapRef.current;
    if (!map || !pois.length) return;

    // ログ出力はログレベルと環境に応じて最適化
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`マーカーを作成: ${pois.length}件`, {
        component: COMPONENT_NAME,
        count: pois.length,
      });
    }

    // 既存のマーカーをクリーンアップ
    cleanupMarkers();

    // 有効な座標を持つPOIだけをフィルタリング
    const validPois = pois.filter(poi => (poi.latitude && poi.longitude) || (poi.lat && poi.lng));

    // Advanced Marker API機能のサポート状況を確認
    const markerFeatures = detectAdvancedMarkerFeatures();

    if (validPois.length > LARGE_POI_THRESHOLD) {
      // 大量のPOIがある場合はバッチ処理を適用
      logger.info(`大量のマーカーを作成中（${validPois.length}件）- バッチ処理を使用`, {
        component: COMPONENT_NAME,
        supportedFeatures: markerFeatures.features,
      });

      // メトリクス追跡用の変数
      let processedCount = 0;
      let successCount = 0;

      // 初期バッチを処理（すぐに表示するため）
      const initialBatch = validPois.slice(0, BATCH_SIZE);
      const initialMarkers = initialBatch
        .map(poi => createMarker(poi, map))
        .filter((marker): marker is google.maps.marker.AdvancedMarkerElement => marker !== null);

      processedCount += initialBatch.length;
      successCount += initialMarkers.length;

      // 参照と状態を更新
      markersRef.current = initialMarkers;
      setMarkers(initialMarkers);

      // クラスタリングも最初のバッチで設定
      if (enableClustering && initialMarkers.length > 0) {
        setupClustering(map, initialMarkers);
      }

      // 残りのマーカーは非同期で追加するためのバッチ処理関数
      const processBatch = () => {
        if (processedCount >= validPois.length) {
          // 全バッチ処理完了
          const duration = performance.now() - startTime;
          logCompletionMetrics(duration, validPois.length, successCount);
          return;
        }

        const nextBatchIndex = Math.min(processedCount + BATCH_SIZE, validPois.length);
        const currentBatch = validPois.slice(processedCount, nextBatchIndex);

        // このバッチのマーカーを生成
        const batchMarkers = currentBatch
          .map(poi => createMarker(poi, map))
          .filter((marker): marker is google.maps.marker.AdvancedMarkerElement => marker !== null);

        // 成功数と処理数を更新
        processedCount += currentBatch.length;
        successCount += batchMarkers.length;

        if (batchMarkers.length > 0) {
          // 既存のマーカーと新しいバッチを結合
          const updatedMarkers = [...markersRef.current, ...batchMarkers];
          markersRef.current = updatedMarkers;
          setMarkers(updatedMarkers);

          // クラスタリングを更新
          if (enableClustering && clustererRef.current) {
            clustererRef.current.clearMarkers();
            clustererRef.current.addMarkers(updatedMarkers as unknown as google.maps.Marker[]);
          }

          // 進捗状況をログ（開発環境のみ）
          if (process.env.NODE_ENV === 'development') {
            logger.debug(
              `マーカーバッチ処理進捗: ${Math.round((processedCount / validPois.length) * 100)}%`,
              {
                component: COMPONENT_NAME,
                processed: processedCount,
                total: validPois.length,
              }
            );
          }
        }

        // 次のバッチを処理（UI応答性を維持するために遅延を設定）
        setTimeout(processBatch, BATCH_DELAY);
      };

      // 最初のバッチ後に残りのバッチ処理を開始
      setTimeout(processBatch, BATCH_DELAY);
    } else {
      // 少量のマーカーは一度に処理
      const newMarkers = validPois
        .map(poi => createMarker(poi, map))
        .filter((marker): marker is google.maps.marker.AdvancedMarkerElement => marker !== null);

      // 参照と状態を更新
      markersRef.current = newMarkers;
      setMarkers(newMarkers);

      // マーカー生成結果をログに記録
      logger.info('マーカー作成完了', {
        component: COMPONENT_NAME,
        totalPOIs: pois.length,
        validPOIs: validPois.length,
        createdMarkers: newMarkers.length,
        advancedMarkersSupported: markerFeatures.isSupported,
      });

      // マーカー生成失敗時のフォールバック処理
      if (newMarkers.length === 0 && validPois.length > 0) {
        handleNoMarkersCreated(map, validPois);
      }

      // クラスタリングが有効な場合
      if (enableClustering && newMarkers.length > 0) {
        setupClustering(map, newMarkers);
      }

      // パフォーマンス計測終了とログ記録
      const duration = performance.now() - startTime;
      logCompletionMetrics(duration, validPois.length, newMarkers.length);
    }

    // パフォーマンスメトリクスのログ出力を行う内部関数
    function logCompletionMetrics(duration: number, totalValid: number, totalCreated: number) {
      // 環境に応じてログレベルを調整
      const isSignificant = totalValid > 20 || duration > 500;
      const logMethod = isSignificant ? logger.info : logger.debug;

      logMethod('マーカー作成完了', {
        component: COMPONENT_NAME,
        totalPOIs: pois.length,
        validPOIs: totalValid,
        createdMarkers: totalCreated,
        successRate: totalValid > 0 ? `${Math.round((totalCreated / totalValid) * 100)}%` : '0%',
        durationMs: Math.round(duration),
        markerPerSecond: duration > 0 ? Math.round((totalCreated / duration) * 1000) : 0,
      });
    }

    // クラスタリングのセットアップを行う内部関数
    function setupClustering(
      map: google.maps.Map,
      markers: google.maps.marker.AdvancedMarkerElement[]
    ) {
      const { gridSize } = memoizedClusterOptions;
      try {
        const algorithm = new GridAlgorithm({ gridSize });

        clustererRef.current = new MarkerClusterer({
          map,
          markers: markers as unknown as google.maps.Marker[],
          algorithm,
        });
      } catch (error) {
        logger.error('マーカークラスタリングの設定に失敗しました', {
          component: COMPONENT_NAME,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // マーカー生成失敗時のフォールバック処理を行う内部関数
    function handleNoMarkersCreated(map: google.maps.Map, validPois: PointOfInterest[]) {
      logger.warn('マーカーの生成に失敗しました。代替表示を試みます', {
        component: COMPONENT_NAME,
        poiCount: validPois.length,
      });

      // 最低限のフォールバック表示（最初のPOIに中心を合わせる）
      const firstValidPOI = validPois[0];
      if (firstValidPOI) {
        const lat = firstValidPOI.latitude || firstValidPOI.lat || 0;
        const lng = firstValidPOI.longitude || firstValidPOI.lng || 0;
        if (lat && lng) {
          map.setCenter({ lat, lng });
          map.setZoom(12);
        }
      }
    }
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
