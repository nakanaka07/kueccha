/**
 * ロギングシステムの型定義
 *
 * ロガー使用ガイドラインに準拠したログレベルと
 * コンテキスト情報の型定義を提供します
 *
 * @version 1.4.0
 * @since 1.0.0
 * @see {@link ../../docs/logger_usage_guidelines.md ロガー使用ガイドライン}
 */

import { LogLevelType } from '@/types/env-types';

/**
 * ログレベルの列挙型定義
 * env-types.tsのLogLevelTypeと連携
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

/**
 * LogLevelとLogLevelTypeのマッピング
 * 列挙型と文字列型の相互変換に使用
 */
export const LOG_LEVEL_MAP: Record<LogLevel, LogLevelType> = {
  [LogLevel.ERROR]: 'error',
  [LogLevel.WARN]: 'warn',
  [LogLevel.INFO]: 'info',
  [LogLevel.DEBUG]: 'debug',
};

/**
 * ログの追加コンテキスト情報の型定義
 * ロガーガイドラインに準拠した構造化ロギング用
 */
export interface LogContext {
  /** コンポーネント名/機能モジュール名 */
  component?: string;
  /** ユーザー識別子（認証時） */
  userId?: string;
  /** リクエスト識別子（APIリクエスト等） */
  requestId?: string;
  /** パフォーマンス測定時間（ミリ秒） */
  durationMs?: number;
  /** エラー発生時のエラーオブジェクト */
  error?: Error | unknown;
  /** その他の任意のコンテキスト情報 */
  [key: string]: unknown;
}
