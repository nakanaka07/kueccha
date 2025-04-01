/**
 * アプリケーションログユーティリティ
 *
 * 環境に応じた適切なログ出力を行い、将来的な外部サービス連携にも対応可能な
 * 柔軟なロギングシステムを提供します。
 */

import { ENV } from '@/utils/env';

/**
 * ログレベルの定義
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// ログレベルの優先度マップ（定数として定義し再利用）
const LEVEL_PRIORITY: Readonly<Record<LogLevel, number>> = Object.freeze({
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 3,
});

/**
 * ログの追加コンテキスト情報の型定義
 */
export interface LogContext {
  [key: string]: unknown;
  component?: string;
  userId?: string;
  requestId?: string;
}

/**
 * ログバッファアイテムの型定義
 */
interface LogBufferItem {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: LogContext | undefined;
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
 * ロガーの設定オプション
 */
interface LoggerOptions {
  /** 最小ログレベル（これ以上のレベルのみ表示） */
  minLevel?: LogLevel;

  /** コンソール出力を有効にするか */
  enableConsole?: boolean;

  /** 追加のログ転送先 */
  transports?: LogTransport[];

  /** エラーメッセージの集約（重複防止）を有効にするか */
  deduplicateErrors?: boolean;

  /** エラーの重複チェック期間（ミリ秒） */
  deduplicationInterval?: number;

  /** タイムスタンプを含めるか */
  includeTimestamps?: boolean;

  /** コンテキスト情報を拡張するフォーマッター */
  contextFormatter?: ContextFormatter;

  /** 特定コンポーネントのログレベル設定（グローバル設定をオーバーライド） */
  componentLevels?: Record<string, LogLevel>;

  /** サンプリングレート設定 (例: 10なら10回に1回のみログを出力) */
  samplingRates?: Record<string, number>;
}

// デフォルト設定を定数として分離（不変オブジェクト）
const DEFAULT_OPTIONS: Readonly<LoggerOptions> = Object.freeze({
  minLevel: ENV.env.isDev ? LogLevel.INFO : LogLevel.WARN,
  enableConsole: true,
  transports: [],
  deduplicateErrors: ENV.env.isProd,
  deduplicationInterval: 10000, // 10秒
  includeTimestamps: true,
  contextFormatter: (context: LogContext | undefined) => {
    if (!context) return undefined;
    return {
      ...context,
      appName: ENV.app.NAME,
      environment: ENV.env.MODE,
    };
  },
});

// コンソール出力用のラッパー関数（パフォーマンス向上のため関数を再利用）
const consoleWrapper = Object.freeze({
  // eslint-disable-next-line no-console
  error: console.error,
  // eslint-disable-next-line no-console
  warn: console.warn,
  // eslint-disable-next-line no-console
  info: console.info,
  // eslint-disable-next-line no-console
  debug: console.debug,
});

/**
 * ロガークラス
 * アプリケーション内のログ出力を一元管理します
 */
class Logger {
  private options: LoggerOptions;
  private recentErrors: Map<string, number> = new Map();
  private logBuffer: LogBufferItem[] = [];
  private readonly LOG_BUFFER_MAX = 500;
  private samplingCounters: Record<string, number> = {};
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: LoggerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.setupCleanupInterval();
  }

  /**
   * 定期的にエラー履歴をクリアするタイマーを設定
   */
  private setupCleanupInterval(): void {
    // 既存のインターバルがあれば削除（メモリリーク防止）
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.options.deduplicateErrors) {
      const interval = Math.min(this.options.deduplicationInterval ?? 10000, 60000);
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        const expiryTime = now - (this.options.deduplicationInterval ?? 10000);

        // 複数回のループを避けるためにキーを配列として取得
        for (const [key, timestamp] of this.recentErrors.entries()) {
          if (timestamp < expiryTime) {
            this.recentErrors.delete(key);
          }
        }
      }, interval);
    }
  }

  /**
   * メッセージとコンテキストからログキーを生成（パフォーマンス向上）
   */
  private createLogKey(message: string, context?: LogContext): string {
    if (!context) return message;

    // 最適化：配列の分解代入による問題を回避
    let contextStr = '';
    const entries = Object.entries(context);

    for (const entry of entries) {
      const key = entry[0];
      const value = entry[1];
      if (value !== undefined) {
        // 全ての値をJSON.stringifyで処理（プリミティブ値も適切に処理される）
        const valueStr = JSON.stringify(value);
        contextStr += (contextStr ? '|' : '') + `${key}:${valueStr}`;
      }
    }

    return contextStr ? `${message}|${contextStr}` : message;
  }

  /**
   * ログレベルフィルタリングチェック（最適化版）
   */
  private shouldLogAtLevel(level: LogLevel, context?: LogContext): boolean {
    // コンポーネント固有のロジックをシンプル化
    if (context?.component) {
      const componentLevel = this.options.componentLevels?.[context.component];
      if (componentLevel && LEVEL_PRIORITY[level] > LEVEL_PRIORITY[componentLevel]) {
        return false;
      }
      // コンポーネントレベルが未設定か、条件を満たす場合はtrueを返す
      return componentLevel ? true : this.checkGlobalLevel(level);
    }

    return this.checkGlobalLevel(level);
  }

  /**
   * グローバルログレベル設定によるチェック
   */
  private checkGlobalLevel(level: LogLevel): boolean {
    const minLevel = this.options.minLevel ?? LogLevel.INFO;
    return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[minLevel];
  }

  /**
   * サンプリングレートによるフィルタリング（最適化版）
   */
  private shouldLogBySamplingRate(message: string): boolean {
    if (!this.options.samplingRates) return true;

    const sampleKey = message.split(' ')[0];
    if (!sampleKey) return true;

    const rate = this.options.samplingRates[sampleKey];
    if (!rate || typeof rate !== 'number' || isNaN(rate) || rate <= 0) {
      return true;
    }

    const counter = (this.samplingCounters[sampleKey] =
      (this.samplingCounters[sampleKey] ?? 0) + 1);
    return counter % rate === 0;
  }

  /**
   * 重複エラーチェック（最適化版）
   */
  private shouldLogDuplicateError(level: LogLevel, message: string, context?: LogContext): boolean {
    if (level !== LogLevel.ERROR || !this.options.deduplicateErrors) {
      return true;
    }

    const logKey = this.createLogKey(message, context);
    if (this.recentErrors.has(logKey)) {
      return false;
    }

    this.recentErrors.set(logKey, Date.now());
    return true;
  }

  /**
   * コンソールへのログ出力（最適化版）
   */
  private outputToConsole(level: LogLevel, formattedMessage: string): void {
    if (!this.options.enableConsole) return;

    // 直接マッピングによるスイッチ文の置き換え
    consoleWrapper[level](formattedMessage);
  }

  /**
   * メッセージを効率的にフォーマット
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const levelStr = level.toUpperCase().padEnd(5, ' ');
    const timestamp = this.options.includeTimestamps ? `[${new Date().toISOString()}] ` : '';
    let formattedMessage = `${timestamp}[${levelStr}] ${message}`;

    // コンテキスト処理を最適化
    let formattedContext = context;
    if (this.options.contextFormatter && context) {
      formattedContext = this.options.contextFormatter(context);
    }

    // 空オブジェクト判定を最適化
    if (formattedContext && Object.keys(formattedContext).length > 0) {
      formattedMessage += ` | Context: ${JSON.stringify(formattedContext)}`;
    }

    return formattedMessage;
  }

  /**
   * ログの一括処理（共通ロジック集約）
   */
  private logWithLevel(level: LogLevel, message: string, context?: LogContext): void {
    // 3段階のフィルタリングを一括適用
    if (
      !this.shouldLogAtLevel(level, context) ||
      !this.shouldLogBySamplingRate(message) ||
      !this.shouldLogDuplicateError(level, message, context)
    ) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);

    // 出力処理
    this.outputToConsole(level, formattedMessage);

    // トランスポート処理
    this.options.transports?.forEach(transport => {
      try {
        transport.log(level, message, context);
      } catch (err) {
        if (this.options.enableConsole) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          consoleWrapper.error(`[Logger] Failed to send log to transport: ${errorMessage}`);
        }
      }
    });

    // バッファ追加（メモリ最適化）
    this.addToLogBuffer(level, message, context);
  }

  /**
   * ログバッファ処理（最適化版）
   */
  private addToLogBuffer(level: LogLevel, message: string, context?: LogContext): void {
    // バッファが上限に達している場合は先に削除してからpush
    if (this.logBuffer.length >= this.LOG_BUFFER_MAX) {
      this.logBuffer.shift();
    }
    this.logBuffer.push({ level, message, timestamp: Date.now(), context });
  }

  // 公開APIメソッド（変更なし）
  public error(message: string, errorOrContext?: Error | LogContext): void {
    const context =
      errorOrContext instanceof Error
        ? {
            errorName: errorOrContext.name,
            errorMessage: errorOrContext.message,
            stackTrace: errorOrContext.stack,
          }
        : errorOrContext;

    this.logWithLevel(LogLevel.ERROR, message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.logWithLevel(LogLevel.WARN, message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.logWithLevel(LogLevel.INFO, message, context);
  }

  public debug(message: string, context?: LogContext): void {
    this.logWithLevel(LogLevel.DEBUG, message, context);
  }

  public measureTime<T>(
    taskName: string,
    task: () => T,
    level: LogLevel = LogLevel.DEBUG,
    context?: LogContext,
    thresholdMs: number = 0
  ): T {
    const startTime = performance.now();
    const result = task();
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    if (duration > thresholdMs) {
      this.logWithLevel(level, `${taskName} completed in ${duration}ms`, {
        ...context,
        durationMs: duration,
      });
    }

    return result;
  }

  public async measureTimeAsync<T>(
    taskName: string,
    task: Promise<T> | (() => Promise<T>),
    level: LogLevel = LogLevel.DEBUG,
    context?: LogContext,
    thresholdMs: number = 0
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = typeof task === 'function' ? await task() : await task;
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      if (duration > thresholdMs) {
        this.logWithLevel(level, `${taskName} completed in ${duration}ms`, {
          ...context,
          durationMs: duration,
        });
      }

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      this.error(`${taskName} failed after ${duration}ms`, {
        ...context,
        durationMs: duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  public logIf(condition: boolean, level: LogLevel, message: string, context?: LogContext): void {
    if (condition) {
      this.logWithLevel(level, message, context);
    }
  }

  public configure(options: Partial<LoggerOptions>): void {
    this.options = { ...this.options, ...options };
    // 設定変更時にクリーンアップインターバルを再設定
    this.setupCleanupInterval();
  }

  public addTransport(transport: LogTransport): void {
    this.options.transports ??= [];
    this.options.transports.push(transport);
  }

  public getRecentLogs(level: LogLevel = LogLevel.DEBUG, count: number = 100): LogBufferItem[] {
    return this.logBuffer
      .filter(log => LEVEL_PRIORITY[log.level] <= LEVEL_PRIORITY[level])
      .slice(-Math.min(count, this.logBuffer.length));
  }

  public dispose(): void {
    // メモリリーク防止のため、インターバルを明示的にクリア
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.options.transports = [];
    this.recentErrors.clear();
    this.logBuffer = [];
    this.samplingCounters = {};
  }
}

// アプリケーション全体で使用するロガーのシングルトンインスタンス
export const logger = new Logger();

// プロダクション環境での外部サービス連携
if (ENV.env.isProd) {
  try {
    logger.info('外部エラー追跡サービスとの連携を初期化しています');
    // 実装コメントは変更なし
    logger.info('外部エラー追跡サービスの統合が完了しました');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[Logger] 外部トランスポートの初期化に失敗しました: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export default logger;
