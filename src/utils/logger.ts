/**
 * アプリケーションログユーティリティ
 *
 * 環境に応じた適切なログ出力を行い、将来的な外部サービス連携にも対応可能な
 * 柔軟なロギングシステムを提供します。
 */

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
 * 外部ログサービス連携用のインターフェース
 * 将来的な拡張ポイント
 */
export interface LogTransport {
  log(level: LogLevel, message: string, context?: LogContext): void;
}

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
}

/**
 * デフォルトのロガー設定
 */
const defaultOptions: LoggerOptions = {
  minLevel: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN,
  enableConsole: true,
  transports: [],
  deduplicateErrors: import.meta.env.PROD,
  deduplicationInterval: 10000, // 10秒
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
  private readonly levelPriority: Record<LogLevel, number> = {
    [LogLevel.ERROR]: 0,
    [LogLevel.WARN]: 1,
    [LogLevel.INFO]: 2,
    [LogLevel.DEBUG]: 3,
  };

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
   * 指定レベルでログを出力します
   */
  private logWithLevel(level: LogLevel, message: string, context?: LogContext): void {
    // レベルチェック（設定より低いレベルのログは出力しない）
    if (this.levelPriority[level] > this.levelPriority[this.options.minLevel ?? LogLevel.INFO]) {
      return;
    }

    // エラー重複抑制（エラーレベルのみ）
    if (level === LogLevel.ERROR && this.options.deduplicateErrors) {
      const logKey = this.createLogKey(message, context);
      const now = Date.now();
      if (this.recentErrors.has(logKey)) {
        return; // 最近出力したエラーなのでスキップ
      }
      this.recentErrors.set(logKey, now);
    }

    // コンソール出力
    if (this.options.enableConsole) {
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

    // 外部トランスポートへの送信
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
   * メッセージをフォーマットする
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5, ' ');

    let formattedMessage = `[${timestamp}] [${levelStr}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      // コンテキスト情報の追加
      const contextStr = JSON.stringify(context);
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
    context?: LogContext
  ): T {
    const startTime = performance.now();
    const result = task();
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    this.logWithLevel(level, `${taskName} completed in ${duration}ms`, {
      ...context,
      durationMs: duration,
    });

    return result;
  }

  /**
   * 非同期処理の時間計測用ユーティリティ
   */
  public async measureTimeAsync<T>(
    taskName: string,
    task: Promise<T> | (() => Promise<T>),
    level: LogLevel = LogLevel.DEBUG,
    context?: LogContext
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = typeof task === 'function' ? await task() : await task;
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      this.logWithLevel(level, `${taskName} completed in ${duration}ms`, {
        ...context,
        durationMs: duration,
      });

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
}

/**
 * アプリケーション全体で使用するロガーのシングルトンインスタンス
 */
export const logger = new Logger();

/**
 * プロダクション環境でのみ外部エラー追跡サービスを統合
 */
if (import.meta.env.PROD) {
  // 例: Sentryなどの外部サービスとの統合
  try {
    // 将来的な外部サービス連携のためのスケルトン
    // logger.addTransport({
    //   log(level, message, context) {
    //     if (level === LogLevel.ERROR || level === LogLevel.WARN) {
    //       // 外部サービスにエラーを送信する実装
    //     }
    //   }
    // });
  } catch (err) {
    // 初期化エラーはコンソールにのみ記録
    const errorMessage = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error(`[Logger] Failed to initialize external transport: ${errorMessage}`);
  }
}

export default logger;
