import { useRef, useEffect, useCallback, useMemo } from 'react';

import { logger, LogLevel } from '@/utils/logger';
import { ENV } from '@/utils/env';

/**
 * マップ初期化設定の型定義
 */
interface MapInitConfig {
  /** 初期化までの遅延時間（ミリ秒） */
  delay: number;
  /** デバッグモードの有効/無効 */
  debug: boolean;
}

/**
 * Google Mapsを表示するためのコンテナコンポーネントのプロパティ定義
 */
interface MapContainerProps {
  /** マップ要素がDOM上に準備完了した時に呼び出されるコールバック */
  onMapElementReady: () => void;
  /** コンテナに適用するCSSクラス名 */
  className?: string;
}

/**
 * Google Mapsを表示するためのコンテナコンポーネント
 *
 * マップ要素がDOM上に追加された後にコールバック関数を呼び出します。
 * ロガーを使用して開発環境では詳細なログを出力し、パフォーマンス計測も行います。
 *
 * @param props - コンポーネントのプロパティ
 * @returns React コンポーネント
 */
export const MapContainer = ({
  onMapElementReady,
  className = 'map-container',
}: MapContainerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const callbackFiredRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // 環境変数から設定を安全に取得して型付け
  const mapConfig = useMemo<MapInitConfig>(
    () => ({
      delay: typeof ENV.ui?.map?.init?.delay === 'number' ? ENV.ui.map.init.delay : 0,
      debug: Boolean(ENV.ui?.map?.init?.debug || ENV.debug?.ENABLE_MAP_DEBUG),
    }),
    []
  );

  // 開発環境判定も一度だけ評価
  const isDev = useMemo(() => Boolean(ENV.env?.isDev), []);

  // コールバック処理を最適化：必要な依存関係のみを指定
  const handleMapElementReady = useCallback(() => {
    try {
      // ロガー使用ガイドラインに沿ったコンテキスト情報の設計
      const logContext = {
        component: 'MapContainer',
        action: 'init_map',
        entityId: 'map',
      };

      logger.info('マップ要素の準備完了コールバックを呼び出します', logContext);

      // パフォーマンス計測を行いながらコールバックを実行
      const logLevel = isDev ? LogLevel.INFO : LogLevel.DEBUG;
      const perfLogContext = {
        ...logContext,
        action: 'map_ready',
        performance: true,
      };

      logger.measureTime('マップ要素準備完了処理', onMapElementReady, logLevel, perfLogContext);

      // 条件付きログ出力の活用
      logger.logIf(mapConfig.debug, LogLevel.DEBUG, 'マップ初期化設定', {
        ...logContext,
        action: 'map_debug_info',
        initDelay: mapConfig.delay,
        debugMode: mapConfig.debug,
      });
    } catch (error) {
      // エラーオブジェクトを直接渡す（ロガーはスタックトレースも自動的に取得）
      if (error instanceof Error) {
        logger.error('マップ要素準備処理でエラーが発生しました', error);
      } else {
        logger.error('マップ要素準備処理でエラーが発生しました', {
          component: 'MapContainer',
          action: 'map_ready_error',
          error: String(error),
        });
      }
    }
  }, [onMapElementReady, mapConfig.debug, mapConfig.delay, isDev]);

  useEffect(() => {
    // 要素が存在し、まだコールバックが発火していない場合のみ実行
    if (mapRef.current && !callbackFiredRef.current) {
      const logContext = {
        component: 'MapContainer',
        action: 'dom_ready',
        entityId: 'map',
      };

      logger.logIf(
        isDev || mapConfig.debug,
        LogLevel.DEBUG,
        'マップ要素がDOMに追加されました',
        logContext
      );

      // コールバックの発火を記録
      callbackFiredRef.current = true;

      // DOM更新後にコールバックを実行するための遅延（環境変数から取得）
      timerRef.current = window.setTimeout(handleMapElementReady, mapConfig.delay);
    }

    // クリーンアップ関数でタイマーをクリア
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [handleMapElementReady, mapConfig.delay, isDev, mapConfig.debug]);

  return <div id='map' ref={mapRef} className={className}></div>;
};
