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
  context: LogContext | undefined;
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
export type ContextFormatter = (context?: LogContext) => LogContext | undefined;

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

/**
 * デフォルトのロガー設定
 * env.tsと連携して環境変数を統一的に扱う
 */
const defaultOptions: LoggerOptions = {
  minLevel: ENV.env.isDev ? LogLevel.INFO : LogLevel.WARN, // DEBUGからINFOに変更
  enableConsole: true,
  transports: [],
  deduplicateErrors: ENV.env.isProd,
  deduplicationInterval: 10000, // 10秒
  includeTimestamps: true,
  contextFormatter: context => {
    return {
      ...context,
      appName: ENV.app.NAME,
      environment: ENV.env.MODE,
    };
  },
};

// コンソール出力用のラッパー関数（ESLint警告回避）
const consoleWrapper = {
  // eslint-disable-next-line no-console
  error: (msg: string): void => console.error(msg),
  // eslint-disable-next-line no-console
  warn: (msg: string): void => console.warn(msg),
  // eslint-disable-next-line no-console
  info: (msg: string): void => console.info(msg),
  // eslint-disable-next-line no-console
  debug: (msg: string): void => console.debug(msg),
};

/**
 * ロガークラス
 * アプリケーション内のログ出力を一元管理します
 */
class Logger {
  private options: LoggerOptions;
  private recentErrors: Map<string, number> = new Map();
  // ログバッファを追加
  private logBuffer: LogBufferItem[] = [];
  private readonly LOG_BUFFER_MAX = 500; // 最大500件のログを保持

  private readonly levelPriority: Record<LogLevel, number> = {
    [LogLevel.ERROR]: 0,
    [LogLevel.WARN]: 1,
    [LogLevel.INFO]: 2,
    [LogLevel.DEBUG]: 3,
  };

  // サンプリング用のカウンター
  private samplingCounters: Record<string, number> = {};

  constructor(options: LoggerOptions = {}) {
    this.options = { ...defaultOptions, ...options };
    this.cleanupErrorsInterval();
  }

  /**
   * 定期的にエラー履歴をクリアするタイマーを設定
   */
  private cleanupErrorsInterval(): void {
    if (this.options.deduplicateErrors) {
      setInterval(
        () => {
          const now = Date.now();
          for (const [key, timestamp] of this.recentErrors.entries()) {
            if (now - timestamp > (this.options.deduplicationInterval ?? 10000)) {
              this.recentErrors.delete(key);
            }
          }
        },
        Math.min(this.options.deduplicationInterval ?? 10000, 60000)
      ); // 最大1分
    }
  }

  /**
   * メッセージとコンテキストからログキーを生成
   */
  private createLogKey(message: string, context?: LogContext): string {
    if (!context) return message;
    const contextStr = Object.entries(context)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}:${String(value)}`)
      .join('|');
    return `${message}|${contextStr}`;
  }

  /**
   * ログレベルフィルタリングチェック
   * 指定されたログレベルが出力すべきレベルかどうかを判定
   */
  private shouldLogAtLevel(level: LogLevel, context?: LogContext): boolean {
    // コンポーネント固有のログレベルチェック
    if (context?.component && this.options.componentLevels?.[context.component]) {
      if (
        this.levelPriority[level] >
        this.levelPriority[this.options.componentLevels[context.component]]
      ) {
        return false; // コンポーネント固有の設定によりスキップ
      }
      return true;
    }

    // グローバルなレベルチェック（設定より低いレベルのログは出力しない）
    return this.levelPriority[level] <= this.levelPriority[this.options.minLevel ?? LogLevel.INFO];
  }

  /**
   * サンプリングレートに基づくフィルタリング
   * 指定されたメッセージがサンプリングレートに基づいて出力すべきかを判定
   */
  private shouldLogBySamplingRate(message: string): boolean {
    const sampleKey = message.split(' ')[0]; // メッセージの最初の単語をキーとして使用
    if (this.options.samplingRates?.[sampleKey]) {
      const rate = this.options.samplingRates[sampleKey];
      this.samplingCounters[sampleKey] = (this.samplingCounters[sampleKey] || 0) + 1;
      if (this.samplingCounters[sampleKey] % rate !== 0) {
        return false; // サンプリングレートに従ってスキップ
      }
    }
    return true;
  }

  /**
   * 重複エラーチェック
   * 同一エラーメッセージの重複出力を防止
   */
  private shouldLogDuplicateError(level: LogLevel, message: string, context?: LogContext): boolean {
    if (level === LogLevel.ERROR && this.options.deduplicateErrors) {
      const logKey = this.createLogKey(message, context);
      const now = Date.now();
      if (this.recentErrors.has(logKey)) {
        return false; // 最近出力したエラーなのでスキップ
      }
      this.recentErrors.set(logKey, now);
    }
    return true;
  }

  /**
   * コンソールへのログ出力
   */
  private outputToConsole(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.options.enableConsole) return;

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case LogLevel.ERROR:
        consoleWrapper.error(formattedMessage);
        break;
      case LogLevel.WARN:
        consoleWrapper.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        consoleWrapper.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        consoleWrapper.debug(formattedMessage);
        break;
    }
  }

  /**
   * 外部トランスポートへのログ送信
   */
  private sendToTransports(level: LogLevel, message: string, context?: LogContext): void {
    this.options.transports?.forEach(transport => {
      try {
        transport.log(level, message, context);
      } catch (err) {
        // トランスポートエラーはコンソールのみに記録し、無限ループを避ける
        if (this.options.enableConsole) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          consoleWrapper.error(`[Logger] Failed to send log to transport: ${errorMessage}`);
        }
      }
    });
  }

  /**
   * ログバッファへの追加
   */
  private addToLogBuffer(level: LogLevel, message: string, context?: LogContext): void {
    this.logBuffer.push({ level, message, timestamp: Date.now(), context });
    if (this.logBuffer.length > this.LOG_BUFFER_MAX) {
      this.logBuffer.shift(); // 古いログを削除
    }
  }

  /**
   * 指定レベルでログを出力します
   */
  private logWithLevel(level: LogLevel, message: string, context?: LogContext): void {
    // レベルに基づいたフィルタリング
    if (!this.shouldLogAtLevel(level, context)) {
      return;
    }

    // サンプリングレートに基づくフィルタリング
    if (!this.shouldLogBySamplingRate(message)) {
      return;
    }

    // 重複エラーチェック
    if (!this.shouldLogDuplicateError(level, message, context)) {
      return;
    }

    // コンソールへの出力
    this.outputToConsole(level, message, context);

    // 外部トランスポートへの送信
    this.sendToTransports(level, message, context);

    // ログバッファへの追加
    this.addToLogBuffer(level, message, context);
  }

  /**
   * メッセージをフォーマットする
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const levelStr = level.toUpperCase().padEnd(5, ' ');
    let formattedMessage = '';

    // タイムスタンプ表示設定に基づいて処理
    if (this.options.includeTimestamps) {
      const timestamp = new Date().toISOString();
      formattedMessage = `[${timestamp}] [${levelStr}] ${message}`;
    } else {
      formattedMessage = `[${levelStr}] ${message}`;
    }

    // コンテキストフォーマッター適用（設定されている場合）
    let formattedContext = context;
    if (this.options.contextFormatter && context) {
      formattedContext = this.options.contextFormatter(context);
    }

    // フォーマット済みコンテキストがある場合に追加
    if (formattedContext && Object.keys(formattedContext).length > 0) {
      // コンテキスト情報の追加
      const contextStr = JSON.stringify(formattedContext);
      formattedMessage += ` | Context: ${contextStr}`;
    }

    return formattedMessage;
  }

  /**
   * エラーレベルのログを出力
   * システムエラー、例外、ユーザー操作を妨げる問題に使用
   */
  public error(message: string, errorOrContext?: Error | LogContext): void {
    let context: LogContext | undefined;

    if (errorOrContext instanceof Error) {
      context = {
        errorName: errorOrContext.name,
        errorMessage: errorOrContext.message,
        stackTrace: errorOrContext.stack,
      };
    } else {
      context = errorOrContext;
    }

    this.logWithLevel(LogLevel.ERROR, message, context);
  }

  /**
   * 警告レベルのログを出力
   * 問題が発生したが処理は続行できる場合に使用
   */
  public warn(message: string, context?: LogContext): void {
    this.logWithLevel(LogLevel.WARN, message, context);
  }

  /**
   * 情報レベルのログを出力
   * 一般的な情報、アプリケーションの状態変化などに使用
   */
  public info(message: string, context?: LogContext): void {
    this.logWithLevel(LogLevel.INFO, message, context);
  }

  /**
   * デバッグレベルのログを出力
   * 開発時のデバッグ情報に使用（本番環境では通常表示されない）
   */
  public debug(message: string, context?: LogContext): void {
    this.logWithLevel(LogLevel.DEBUG, message, context);
  }

  /**
   * パフォーマンス計測用のユーティリティ
   * 処理時間を計測してログ出力します
   */
  public measureTime<T>(
    taskName: string,
    task: () => T,
    level: LogLevel = LogLevel.DEBUG,
    context?: LogContext,
    // 実行時間の閾値（ミリ秒）- これ以下の処理時間の場合はログを出力しない
    thresholdMs: number = 0
  ): T {
    const startTime = performance.now();
    const result = task();
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // 閾値を超えた場合のみログを出力
    if (duration > thresholdMs) {
      this.logWithLevel(level, `${taskName} completed in ${duration}ms`, {
        ...context,
        durationMs: duration,
      });
    }

    return result;
  }

  /**
   * 非同期処理の時間計測用ユーティリティ
   */
  public async measureTimeAsync<T>(
    taskName: string,
    task: Promise<T> | (() => Promise<T>),
    level: LogLevel = LogLevel.DEBUG,
    context?: LogContext,
    // 実行時間の閾値（ミリ秒）- これ以下の処理時間の場合はログを出力しない
    thresholdMs: number = 0
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = typeof task === 'function' ? await task() : await task;
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // 閾値を超えた場合のみログを出力
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

  /**
   * 条件付きログ出力
   * 条件が真の場合のみログを出力します
   */
  public logIf(condition: boolean, level: LogLevel, message: string, context?: LogContext): void {
    if (condition) {
      this.logWithLevel(level, message, context);
    }
  }

  /**
   * ロガーの設定を更新
   */
  public configure(options: Partial<LoggerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 外部トランスポートを追加
   */
  public addTransport(transport: LogTransport): void {
    this.options.transports = [...(this.options.transports ?? []), transport];
  }

  /**
   * 最近のログを取得する
   * 例外発生時などにログ履歴を確認するために使用
   * @param level 取得するログの最低レベル（指定レベル以上のログのみ取得）
   * @param count 取得する最大件数（デフォルト100件）
   */
  public getRecentLogs(level: LogLevel = LogLevel.DEBUG, count: number = 100): LogBufferItem[] {
    return this.logBuffer
      .filter(log => this.levelPriority[log.level] <= this.levelPriority[level])
      .slice(-Math.min(count, this.logBuffer.length));
  }

  /**
   * リソース解放のためのメソッド
   */
  public dispose(): void {
    this.options.transports = [];
    this.recentErrors.clear();
  }
}

/**
 * アプリケーション全体で使用するロガーのシングルトンインスタンス
 */
export const logger = new Logger();

/**
 * プロダクション環境でのみ外部エラー追跡サービスを統合
 */
if (ENV.env.isProd) {
  // 外部エラー追跡サービス（例: Sentry）との統合
  try {
    logger.info('外部エラー追跡サービスとの連携を初期化しています');
    // 将来的な外部サービス連携のためのスケルトン
    // logger.addTransport({
    //   log(level, message, context) {
    //     if (level === LogLevel.ERROR || level === LogLevel.WARN) {
    //       // 外部サービスにエラーを送信する実装
    //     }
    //   }
    // });
    logger.info('外部エラー追跡サービスの統合が完了しました');
  } catch (err) {
    // 初期化エラーはコンソールにのみ記録
    const errorMessage = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error(`[Logger] 外部トランスポートの初期化に失敗しました: ${errorMessage}`);
  }
}

export default logger;
