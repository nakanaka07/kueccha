// filepath: c:\Users\int-x-survey\Desktop\kueccha\src\components\MapContainer.tsx
import { useRef, useEffect, memo, useCallback } from 'react';

import { RETRY_CONFIG } from '@/constants/maps';
import { logger } from '@/utils/logger';

/**
 * Google Mapsを表示するためのコンテナコンポーネントのプロパティ定義
 */
interface MapContainerProps {
  /** マップ要素がDOM上に準備完了した時に呼び出されるコールバック */
  onMapElementReady: () => void;
  /** コンテナに適用するCSSクラス名 */
  className?: string;
  /** マップ要素のID */
  mapId?: string;
  /** 初期化までの遅延時間（ミリ秒） */
  initDelay?: number;
  /** マップ読み込み失敗時のリトライ回数 */
  maxRetries?: number;
}

/**
 * Google Mapsを表示するためのコンテナコンポーネント
 * - パフォーマンス向上のためにメモ化
 * - KISS原則に基づいてシンプル化
 * - 初期化パラメータを最適化
 * - リトライロジックとパフォーマンスメトリクスを追加
 */
export const MapContainer = memo(
  ({
    onMapElementReady,
    className = 'map-container',
    mapId = 'google-map',
    initDelay = 0,
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
  }: MapContainerProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const callbackFiredRef = useRef(false);
    const retryCountRef = useRef(0);

    // onMapElementReadyをメモ化するためのラッパー関数
    const handleMapElementReady = useCallback(() => {
      const startTime = performance.now();

      // 親コンポーネントから渡されたコールバックを実行
      onMapElementReady();

      const endTime = performance.now();
      logger.debug('マップ要素準備コールバック実行', {
        component: 'MapContainer',
        executionTime: endTime - startTime,
        mapId,
      });
    }, [onMapElementReady, mapId]); // マップ要素の初期化
    useEffect(() => {
      if (callbackFiredRef.current) return;

      // パフォーマンスモニタリングを開始
      const effectStartTime = performance.now();
      logger.debug('マップ要素の初期化開始', {
        component: 'MapContainer',
        mapId,
        initDelay,
        maxRetries,
        effectStartTimestamp: effectStartTime,
      });

      // マップ初期化関数
      const initMap = () => {
        if (!mapRef.current) {
          logger.warn('マップ要素が見つかりません', {
            component: 'MapContainer',
            retryCount: retryCountRef.current,
            maxRetries,
          });

          // リトライロジックを実装
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            const retryDelay = RETRY_CONFIG.RETRY_DELAY * Math.pow(1.5, retryCountRef.current - 1); // 指数バックオフ

            logger.info('マップ要素の初期化をリトライします', {
              component: 'MapContainer',
              retryCount: retryCountRef.current,
              maxRetries,
              retryDelay,
            });

            setTimeout(initMap, retryDelay);
            return;
          }

          return;
        }

        // SADO_OPTIMIZED_OPTIONS を使用するようにログを修正
        logger.debug('マップ要素の初期化を開始します', {
          component: 'MapContainer',
          elementId: mapId,
          elementExists: Boolean(mapRef.current),
          // 佐渡島最適化設定の使用をログ
          usingSadoOptimization: true,
          mapOptions: 'SADO_OPTIMIZED_OPTIONS',
        });

        try {
          // パフォーマンス計測開始
          const mapReadyStart = performance.now();

          // コールバック呼び出しフラグを設定
          callbackFiredRef.current = true;

          // コールバック実行（メモ化されたハンドラーを使用）
          handleMapElementReady();

          // パフォーマンス計測終了と記録
          const mapReadyEnd = performance.now();
          const readyTime = mapReadyEnd - mapReadyStart;

          // 詳細なメトリクス記録
          logger.debug('マップ要素の準備完了', {
            component: 'MapContainer',
            elementId: mapId,
            performance: {
              readyTime,
              retryCount: retryCountRef.current,
              totalTime: readyTime + initDelay,
              success: true,
            },
          });
        } catch (error) {
          logger.error('マップ要素準備中にエラーが発生しました', {
            component: 'MapContainer',
            error,
            retryCount: retryCountRef.current,
          });

          // エラー後のリカバリーを試みる
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current += 1;
            const retryDelay = RETRY_CONFIG.RETRY_DELAY;
            logger.info('エラー後のリカバリーを試みます', {
              component: 'MapContainer',
              retryCount: retryCountRef.current,
              retryDelay,
            });
            setTimeout(initMap, retryDelay);
          }
        }
      };

      // 初期化トラッキングのための変数
      let isComponentMounted = true;
      let timerId: number | undefined;

      // 性能測定のための開始時間を記録
      const initStart = performance.now();

      // 遅延が指定されている場合はタイマーを設定
      if (initDelay > 0) {
        timerId = window.setTimeout(() => {
          // コンポーネントがまだマウントされている場合のみ初期化を実行
          if (isComponentMounted) {
            initMap();

            // 遅延初期化完了時にパフォーマンスを計測
            const delayedInitEnd = performance.now();
            logger.debug('遅延付きマップ初期化完了', {
              component: 'MapContainer',
              timing: {
                totalTime: delayedInitEnd - initStart,
                initDelay,
                actualDelay: delayedInitEnd - initStart - initDelay,
              },
            });
          }
        }, initDelay);

        // 拡張されたクリーンアップ関数
        return () => {
          // コンポーネントのアンマウントを記録
          isComponentMounted = false;

          // 実行中のタイマーをクリア
          if (timerId) {
            window.clearTimeout(timerId);
          }

          // アンマウント時のログ記録
          logger.debug('MapContainerのクリーンアップを実行', {
            component: 'MapContainer',
            mapId,
            wasCallbackFired: callbackFiredRef.current,
            retryAttempts: retryCountRef.current,
          });
        };
      } else {
        // 遅延なしで即時実行
        initMap();

        // 即時初期化完了時のパフォーマンス計測
        const immediateInitEnd = performance.now();
        logger.debug('即時マップ初期化完了', {
          component: 'MapContainer',
          timing: {
            totalTime: immediateInitEnd - initStart,
          },
        });

        // クリーンアップ関数（遅延なしの場合でもコンポーネントアンマウント時の処理を行う）
        return () => {
          isComponentMounted = false;
          logger.debug('MapContainerのクリーンアップを実行', {
            component: 'MapContainer',
            mapId,
            wasCallbackFired: callbackFiredRef.current,
          });
        };
      }
    }, [handleMapElementReady, mapId, initDelay, maxRetries]);

    // 佐渡島最適化の地図要素を返す
    return (
      <div
        id={mapId}
        ref={mapRef}
        className={className}
        data-testid='map-container'
        data-sado-optimized='true'
        data-sado-bounds='true'
        data-map-retry-config={`max:${maxRetries}`}
        data-performance-tracking='enabled'
        // 静的ホスティング環境向けの最適化属性
        data-static-hosting='github-pages'
        aria-label='佐渡島の地図'
        role='application'
        tabIndex={0} // キーボードフォーカスを可能にする
      />
    );
  }
);

// デバッグのための表示名を設定
MapContainer.displayName = 'MapContainer';
