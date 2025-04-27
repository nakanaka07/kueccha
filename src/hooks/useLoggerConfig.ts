import { useEffect, useRef } from 'react';

import { LogLevelType } from '@/types/env-types';
import { getEnvVar } from '@/env/core';
import { toLogLevel } from '@/env/transforms';
import { logger, LogLevel } from '@/utils/logger';

/**
 * ロガー設定を管理するカスタムフック
 *
 * 環境に応じたログレベルを設定し、ロギングシステムを初期化する
 * パフォーマンス監視と問題診断のための適切なログ出力レベルを確保
 *
 * @returns void - サイドエフェクトのみを実行するフック
 */
export const useLoggerConfig = () => {
  // 初期化済みかどうかを追跡するref
  const isInitialized = useRef(false);

  useEffect(() => {
    // すでに初期化済みの場合は実行しない（一度だけ実行）
    if (isInitialized.current) {
      return;
    }

    try {
      // 環境に応じたデフォルトログレベルを設定（開発環境ではより詳細なログ）
      const logLevelStr = getEnvVar({
        key: 'VITE_LOG_LEVEL',
        defaultValue: import.meta.env.DEV ? 'debug' : 'info',
      }) as LogLevelType;

      // 文字列のログレベルを実際のログレベル定数に変換
      const logLevel = toLogLevel(logLevelStr);

      // ロガーの設定を更新
      logger.configure({ minLevel: logLevel });
      logger.info('ロガー設定を環境に合わせて調整しました', {
        logLevel: logLevelStr,
        component: 'LoggerConfig',
        isDev: import.meta.env.DEV,
      });

      // 初期化完了をマーク
      isInitialized.current = true;
    } catch (error) {
      // エラーが発生した場合はフォールバックとして'info'レベルを設定
      logger.error('ロガー設定の初期化中にエラーが発生しました', {
        error: error instanceof Error ? error.message : String(error),
        component: 'LoggerConfig',
        isDev: import.meta.env.DEV,
      });

      // エラー発生時もデフォルト設定でロガーを初期化し、アプリが機能するようにする
      logger.configure({ minLevel: LogLevel.INFO });

      // エラーがあっても初期化は完了したとマーク
      isInitialized.current = true;
    }
    // このフックは意図的に一度だけ実行するためdeps配列は空
    // 外部依存関係が変更されても再実行する必要はない
  }, []);
};
