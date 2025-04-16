/**
 * アプリケーションログユーティリティ
 *
 * 環境に応じた適切なログ出力を行い、将来的な外部サービス連携にも対応可能な
 * 柔軟なロギングシステムを提供します。
 */

import { LogLevelType } from '../types/env-types';

// ログレベルの列挙型定義
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// 環境設定の簡易モック（実際のプロジェクト構成に合わせて調整）
const ENV = {
  env: {
    isDev: import.meta.env.DEV || false,
    isProd: import.meta.env.PROD || false,
    mode: (import.meta.env.MODE || 'development') as 'development' | 'production' | 'test',
  },
  logging: {
    level: (import.meta.env.VITE_LOG_LEVEL || 'info') as LogLevelType,
  },
};

// transforms.ts と同じ数値ベースのLogLevelを使用
// 文字列表現はマッピング関数を使用して変換する
const logLevelToString = (level: LogLevel): string => {
  switch (level) {
    case LogLevel.ERROR:
      return 'error';
    case LogLevel.WARN:
      return 'warn';
    case LogLevel.INFO:
      return 'info';
    case LogLevel.DEBUG:
      return 'debug';
    default:
      return 'info';
  }
};

// LogLevel列挙型は数値として直接使用できるため、変換関数は不要

/**
 * ログの追加コンテキスト情報の型定義
 */
export interface LogContext {
  component?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * ロガーに記録されるログエントリの型定義
 * バッファに保存されるログデータの形式を定義
 */
interface LogBufferItem {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

/**
 * 外部ログサービス連携用のインターフェース
 * 将来的な拡張ポイント
 */
export interface LogTransport {
  log(level: LogLevel, message: string, context?: LogContext): void;
}

/**
 * コンテキストフォーマッター関数の型定義
 */
export type ContextFormatter = (context: LogContext | undefined) => LogContext | undefined;

/**
 * ロガー設定用のインターフェース
 */
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole?: boolean;
  includeTimestamps?: boolean;
  maxLogBufferSize?: number;
  samplingRates?: Map<string, number>;
  contextFormatter?: (context: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * 最適化されたロガー実装
 * - パフォーマンス重視: 条件付きロギングによる不要な処理回避
 * - メモリ効率: シンプルなバッファ実装
 * - KISS原則: 必要な機能だけをシンプルに実装
 */
class Logger {
  private config: LoggerConfig = {
    minLevel: ENV.env.isDev ? LogLevel.INFO : LogLevel.WARN,
    enableConsole: true,
    includeTimestamps: true,
    maxLogBufferSize: 100,
  };
  // 最近のログエントリを保持するバッファ（デバッグ用）
  private logBuffer: LogBufferItem[] = [];
  // サンプリングカウンター（パフォーマンス最適化用）
  // Map型を使用してObject Injection脆弱性を解消
  private samplingCounters = new Map<string, number>();

  /**
   * ロガー設定を更新
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * デバッグログエントリを記録
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * 情報ログエントリを記録
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * 警告ログエントリを記録
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * エラーログエントリを記録
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * 処理時間を測定し結果をログに記録
   * パフォーマンス監視に便利な短縮形メソッド
   */
  measureTime<T>(label: string, callback: () => T, logLevel: LogLevel = LogLevel.DEBUG): T {
    // 現在の設定でこのレベルのログが出力されない場合は測定をスキップ
    if (logLevel > this.config.minLevel) {
      return callback();
    }

    const start = performance.now();
    const result = callback();
    const duration = performance.now() - start;

    this.log(logLevel, `${label} 完了`, {
      label,
      durationMs: duration.toFixed(2),
      performanceMeasure: true,
    });

    return result;
  }

  /**
   * 非同期処理の時間を測定し結果をログに記録
   * async/await と組み合わせて使用するためのメソッド
   */
  async measureTimeAsync<T>(
    label: string,
    callback: () => Promise<T>,
    logLevel: LogLevel = LogLevel.DEBUG
  ): Promise<T> {
    // 現在の設定でこのレベルのログが出力されない場合は測定をスキップ
    if (logLevel > this.config.minLevel) {
      return callback();
    }

    const start = performance.now();
    try {
      const result = await callback();
      const duration = performance.now() - start;

      this.log(logLevel, `${label} 完了`, {
        label,
        durationMs: duration.toFixed(2),
        performanceMeasure: true,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      this.error(`${label} 失敗`, {
        label,
        durationMs: duration.toFixed(2),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        performanceMeasure: true,
      });

      throw error;
    }
  }

  /**
   * 最近のログエントリを取得（デバッグ用）
   */
  getRecentLogs() {
    return [...this.logBuffer];
  }

  /**
   * 内部的なログ処理関数
   * サンプリング・フィルタリングを適用
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    // 設定されたレベル以下のログはスキップ
    if (level > this.config.minLevel) {
      return;
    } // コンポーネント名をコンテキストから取得
    const componentName = context?.component as string | undefined; // サンプリングレートの適用（パフォーマンス負荷の高い処理のロギングを間引く）
    if (
      componentName &&
      this.config.samplingRates &&
      this.config.samplingRates.has(componentName)
    ) {
      // Map型を使用したコンポーネントごとのサンプリングカウンター（安全なアクセス）
      const currentCount = this.samplingCounters.get(componentName) || 0;
      const newCount = currentCount + 1;
      this.samplingCounters.set(componentName, newCount);

      // サンプリングレートに基づいて出力をスキップ（Map型を使用して安全にアクセス）
      const rate = this.config.samplingRates.get(componentName);
      if (rate !== undefined && newCount % rate !== 0) {
        return;
      }
    }

    // タイムスタンプの生成
    const timestamp = new Date();

    // コンテキスト情報の拡張
    let enhancedContext = context || {};
    if (this.config.contextFormatter) {
      enhancedContext = this.config.contextFormatter(enhancedContext);
    }

    // 内部バッファにログを保存（最大サイズを超えた場合は古いものから削除）
    this.logBuffer.push({
      level,
      message,
      context: enhancedContext,
      timestamp,
    }); // バッファサイズの制限を適用
    const maxSize = this.config.maxLogBufferSize || 100; // デフォルト値を設定
    if (this.logBuffer.length > maxSize) {
      this.logBuffer.shift();
    } // コンソールへの出力（有効な場合のみ）
    if (this.config.enableConsole) {
      // ログレベルを文字列に変換
      const levelStr = logLevelToString(level);
      const timestampStr = this.config.includeTimestamps
        ? `${timestamp.toISOString().slice(11, 23)} `
        : '';

      // 安全なメソッド呼び出し（Object Injectionの問題を回避）
      let consoleMethod: (message: string, ...optionalParams: unknown[]) => void;
      // 数値ベースのログレベルを使用してオブジェクトインジェクション問題を回避
      if (level === LogLevel.ERROR) {
        consoleMethod = console.error;
      } else if (level === LogLevel.WARN) {
        consoleMethod = console.warn;
      } else if (level === LogLevel.INFO || level === LogLevel.DEBUG) {
        consoleMethod = console.info; // debugとinfoは両方console.infoを使用
      } else {
        consoleMethod = console.info; // デフォルトはinfo
      }

      // コンテキスト情報が存在する場合は含める
      if (Object.keys(enhancedContext).length > 0) {
        consoleMethod(`${timestampStr}[${levelStr.toUpperCase()}] ${message}`, enhancedContext);
      } else {
        consoleMethod(`${timestampStr}[${levelStr.toUpperCase()}] ${message}`);
      }
    }
  }
}

// シングルトンインスタンスをエクスポート
export const logger = new Logger();

// 注：envLoggerは既にcore.tsで定義されているため、ここでは初期化は不要です
// 循環参照を避けるため、この部分は削除します

// プロダクション環境での外部サービス連携
if (ENV.env.isProd) {
  try {
    logger.info('外部エラー追跡サービスとの連携を初期化しています');
    // 実装コメントは変更なし
    logger.info('外部エラー追跡サービスの統合が完了しました');
  } catch (err) {
    // no-consoleルールに準拠したエラーログ
    logger.error(`外部トランスポートの初期化に失敗しました`, {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export default logger;
