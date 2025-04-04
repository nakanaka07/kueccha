import React, { useEffect, useCallback, useMemo } from 'react';

import { logger, LogLevel } from '@/utils/logger';
import { ENV } from '@/utils/env';

/**
 * ローディングオーバーレイのプロパティ
 * @property {boolean} isLoadingPOIs - 施設(POI)データをロード中かどうか
 * @property {boolean} isLoaded - 地図の読み込みが完了したかどうか
 * @property {boolean} isMapElementReady - マップ要素が準備完了したかどうか
 */
interface LoadingOverlayProps {
  isLoadingPOIs: boolean;
  isLoaded: boolean;
  isMapElementReady: boolean;
}

/**
 * アプリケーションのローディング状態を表示するオーバーレイコンポーネント
 * 地図読み込みの各ステージに応じたステータスメッセージを表示します
 */
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoadingPOIs,
  isLoaded,
  isMapElementReady,
}) => {
  // 環境に応じたログ設定
  const logConfig = useMemo(() => {
    return {
      // 本番環境ではWARN以上、開発環境ではINFO以上、デバッグモードではDEBUG
      logLevel: ENV.env.debug ? LogLevel.DEBUG : ENV.env.isProd ? LogLevel.WARN : LogLevel.INFO,
      // 本番環境では高いサンプリングレート（ログ出力頻度を下げる）
      samplingRate: ENV.env.isProd ? 10 : 3,
      // デバッグモードか詳細ログが有効な場合は毎回ログを記録
      alwaysLog: ENV.env.debug || ENV.features.verboseLogging,
    };
  }, []);

  // マップ読み込み状態のメッセージを決定（useCallbackでメモ化）
  const getMapStatusMessage = useCallback(() => {
    if (isLoaded) return null;

    return isMapElementReady ? (
      <p role='status'>Google Maps APIを初期化中...</p>
    ) : (
      <p role='status'>マップ要素を準備中...</p>
    );
  }, [isLoaded, isMapElementReady]);

  // ロード状態を表す文字列を生成（デバッグ用）
  const loadingStateString = useCallback(() => {
    if (isLoaded) return '読み込み完了';
    if (isLoadingPOIs) return 'POIデータ読み込み中';
    if (isMapElementReady) return 'Maps API初期化中';
    return 'マップ要素準備中';
  }, [isLoaded, isLoadingPOIs, isMapElementReady]);

  // ロード状態の変更をログに記録（状態変更時、かつサンプリングレートに従う）
  useEffect(() => {
    // サンプリングレートに基づいてログ出力を間引く
    // または常にログ出力するフラグが立っている場合は毎回出力
    if (logConfig.alwaysLog || Math.random() < 1 / logConfig.samplingRate) {
      // ログレベルに応じた適切なメソッドを呼び出す
      const logData = {
        component: 'LoadingOverlay', // コンポーネント名
        action: 'state_change', // アクション種別
        isLoadingPOIs,
        isLoaded,
        isMapElementReady,
        currentState: loadingStateString(), // 現在の状態を文字列で
        timestamp: new Date().toISOString(),
      };

      switch (logConfig.logLevel) {
        case LogLevel.DEBUG:
          logger.debug('読み込み状態が変更されました', logData);
          break;
        case LogLevel.INFO:
          logger.info('読み込み状態が変更されました', logData);
          break;
        case LogLevel.WARN:
          logger.warn('読み込み状態が変更されました', logData);
          break;
        case LogLevel.ERROR:
          logger.error('読み込み状態が変更されました', logData);
          break;
        default:
          logger.info('読み込み状態が変更されました', logData);
      }
    }

    // 特に重要な状態変化（読み込み完了など）は常にログ出力
    if (isLoaded) {
      logger.info('マップとデータの読み込みが完了しました', {
        component: 'LoadingOverlay',
        action: 'loading_complete',
        loadTime: performance.now(), // 読み込み時間の参考値
      });
    }
  }, [isLoadingPOIs, isLoaded, isMapElementReady, logConfig, loadingStateString]);

  return (
    <div className='loading-overlay' role='progressbar' aria-busy='true' aria-live='polite'>
      <div className='loading-spinner' aria-hidden='true'></div>
      <p role='status'>地図とデータを読み込んでいます...</p>
      {isLoadingPOIs && <p role='status'>施設データを準備中...</p>}
      {getMapStatusMessage()}
    </div>
  );
};

// React.memoを使用してパフォーマンスを最適化
export default React.memo(LoadingOverlay);
