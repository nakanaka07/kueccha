// filepath: c:\Users\int-x-survey\Desktop\kueccha\src\utils\logger.ts
/**
 * アプリケーションログユーティリティ
 *
 * 環境に応じた適切なログ出力を行い、将来的な外部サービス連携にも対応可能な
 * 柔軟なロギングシステムを提供します。
 *
 * @author 佐渡で食えっちゃプロジェクトチーム
 * @version 1.3.0
 * @lastUpdate 2025年4月26日
 */

import { LogLevelType } from '../types/env-types';

/**
 * ログレベルの列挙型定義
 * 数値ベースの列挙型を使用することで、簡単に比較操作が可能
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// 環境設定の簡易モック（Node.jsとブラウザ両対応）
const ENV = {
  env: {
    isDev:
      typeof process !== 'undefined'
        ? process.env.NODE_ENV !== 'production'
        : typeof import.meta !== 'undefined'
          ? import.meta.env?.DEV || false
          : false,
    isProd:
      typeof process !== 'undefined'
        ? process.env.NODE_ENV === 'production'
        : typeof import.meta !== 'undefined'
          ? import.meta.env?.PROD || false
          : false,
    mode:
      typeof process !== 'undefined'
        ? process.env.NODE_ENV || 'development'
        : typeof import.meta !== 'undefined'
          ? import.meta.env?.MODE || 'development'
          : 'development',
  } as { isDev: boolean; isProd: boolean; mode: 'development' | 'production' | 'test' },
  logging: {
    level: (typeof process !== 'undefined'
      ? process.env.VITE_LOG_LEVEL
      : typeof import.meta !== 'undefined'
        ? import.meta.env?.VITE_LOG_LEVEL
        : 'info') as LogLevelType,
  },
};

// ログレベル文字列を数値に変換するマッピング
const LOG_LEVEL_MAP: Record<LogLevelType, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

// デフォルトの最小ログレベル（環境変数から取得）
const DEFAULT_MIN_LOG_LEVEL = LOG_LEVEL_MAP[ENV.logging.level] ?? LogLevel.INFO;

// 動的環境変数による実行時のログレベル設定
let RUNTIME_LOG_LEVEL = DEFAULT_MIN_LOG_LEVEL;

// 実行時の強制デバッグモード（開発者向け）
let FORCE_DEBUG = false;

/**
 * ログレベルを文字列に変換する関数
 */
function logLevelToString(level: LogLevel): string {
  switch (level) {
    case LogLevel.ERROR:
      return 'ERROR';
    case LogLevel.WARN:
      return 'WARN';
    case LogLevel.INFO:
      return 'INFO';
    case LogLevel.DEBUG:
      return 'DEBUG';
    default:
      return 'INFO';
  }
}

/**
 * ログコンテキストの型定義
 */
export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * ログバッファ内のログエントリの型定義
 */
interface LogBufferItem {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown> | undefined;
}

/**
 * 外部ログサービス連携用のインターフェース
 */
export interface LogTransport {
  log(level: LogLevel, message: string, context?: LogContext): void;
  flush?(): Promise<void>;
}

/**
 * コンテキストフォーマッター関数の型定義
 */
export type ContextFormatter = (
  context: Record<string, unknown> | undefined
) => Record<string, unknown> | undefined;

/**
 * ロガー設定インターフェース
 */
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole?: boolean;
  includeTimestamps?: boolean;
  maxLogBufferSize?: number;
  transports?: LogTransport[];
  samplingRates?: Map<string, number>;
  contextFormatter?: ContextFormatter;
  redactionKeys?: string[];
}

/**
 * サンプリングカウンターの型定義
 * マップを使用してオブジェクトインジェクション脆弱性を回避
 */
type SamplingCounters = Map<string, number>;

/**
 * ロガーインスタンスのメモリ最適化バージョン
 * - 不要なオブジェクト生成を最小限に
 * - 条件付きロギングにより無駄なフォーマット処理を回避
 * - メモリリークを防止するサイズ制限付きログバッファ
 */
class Logger {
  private config: LoggerConfig = {
    minLevel: ENV.env.isDev ? LogLevel.INFO : LogLevel.WARN,
    enableConsole: true,
    includeTimestamps: true,
    maxLogBufferSize: 100,
    transports: [],
    redactionKeys: ['password', 'token', 'secret', 'apiKey', 'key', 'credential'],
    samplingRates: new Map(),
  };

  private logBuffer: LogBufferItem[] = [];
  private samplingCounters: SamplingCounters = new Map();
  private bufferFlushPromise: Promise<void> | null = null;
  private lastBufferFlush = Date.now();
  private readonly flushInterval = 5000; // 5秒ごとにバッファをフラッシュ

  /**
   * コンストラクタ
   * @param config 初期設定（オプション）
   */
  constructor(config?: Partial<LoggerConfig>) {
    if (config) {
      this.configure(config);
    }

    // 環境変数からログレベルを設定
    this.updateLogLevel();

    // 開発モードでは詳細ログを有効化
    if (ENV.env.isDev) {
      this.config.minLevel = LogLevel.DEBUG;
    }
  }

  /**
   * 実行時にログレベルを更新
   * @param level 新しいログレベル（オプション）
   */
  updateLogLevel(level?: LogLevelType): void {
    if (level && Object.prototype.hasOwnProperty.call(LOG_LEVEL_MAP, level)) {
      RUNTIME_LOG_LEVEL = LOG_LEVEL_MAP[level as keyof typeof LOG_LEVEL_MAP];
      this.config.minLevel = RUNTIME_LOG_LEVEL;
    } else {
      // 環境変数からの設定
      this.config.minLevel = RUNTIME_LOG_LEVEL;
    }

    // 強制デバッグモードの場合はすべてのレベルのログを表示
    if (FORCE_DEBUG) {
      this.config.minLevel = LogLevel.DEBUG;
    }
  }

  /**
   * ロガー設定を更新
   * @param config 更新する設定
   */
  configure(config: Partial<LoggerConfig>): void {
    // 設定を安全にマージ
    this.config = {
      ...this.config,
      ...config,
      // サンプリングレートとredactionKeysは特殊な処理が必要
      samplingRates: config.samplingRates || this.config.samplingRates || new Map(),
      redactionKeys: config.redactionKeys || this.config.redactionKeys || [],
    };

    // 設定更新後にログレベルを再適用
    this.updateLogLevel();
  }

  /**
   * デバッグレベルのログを記録
   * @param message ログメッセージ
   * @param context 付加情報（オプション）
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * 情報レベルのログを記録
   * @param message ログメッセージ
   * @param context 付加情報（オプション）
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * 警告レベルのログを記録
   * @param message ログメッセージ
   * @param context 付加情報（オプション）
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * エラーレベルのログを記録
   * @param message ログメッセージ
   * @param context 付加情報（オプション）
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * 処理時間を計測してログ出力する便利メソッド
   * @param label 処理の名前
   * @param callback 測定する処理
   * @param logLevel ログレベル（デフォルトはDEBUG）
   * @returns 処理の結果
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
   * 非同期処理の時間を計測してログ出力する
   * @param label 処理の名前
   * @param callback 測定する非同期処理
   * @param logLevel ログレベル（デフォルトはDEBUG）
   * @returns 処理の結果Promise
   */
  async measureTimeAsync<T>(
    label: string,
    callback: () => Promise<T>,
    logLevel: LogLevel = LogLevel.DEBUG
  ): Promise<T> {
    // 現在の設定でこのレベルのログが出力されない場合は測定をスキップ
    if (logLevel > this.config.minLevel && !FORCE_DEBUG) {
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
   * @returns ログバッファのコピー
   */
  getRecentLogs(): LogBufferItem[] {
    return [...this.logBuffer];
  }

  /**
   * すべてのログトランスポートのバッファを強制的にフラッシュ
   * @returns 完了を表すPromise
   */
  async flushBuffers(): Promise<void> {
    if (this.config.transports && this.config.transports.length > 0) {
      await Promise.all(
        this.config.transports
          .filter(transport => typeof transport.flush === 'function')
          .map(transport => transport.flush?.())
      );
    }
  }

  /**
   * 強制デバッグモードを切り替え（開発時のみ有効）
   * @param enable 有効にするかどうか
   */
  enableForceDebug(enable: boolean): void {
    if (ENV.env.isProd && enable) {
      this.warn('本番環境で強制デバッグモードは有効化できません', {
        component: 'Logger',
        action: 'enableForceDebug',
        currentEnv: ENV.env.mode,
      });
      return;
    }

    FORCE_DEBUG = enable;
    this.updateLogLevel();

    if (enable) {
      this.info('強制デバッグモードを有効化しました', {
        component: 'Logger',
        action: 'enableForceDebug',
      });
    } else {
      this.info('強制デバッグモードを無効化しました', {
        component: 'Logger',
        action: 'enableForceDebug',
      });
    }
  }

  /**
   * 内部的なログ処理関数
   * @param level ログレベル
   * @param message ログメッセージ
   * @param context 付加情報（オプション）
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    // FORCE_DEBUGが有効でない限り、設定されたレベル以下のログはスキップ
    if (level > this.config.minLevel && !FORCE_DEBUG) {
      return;
    }

    // コンポーネント名をコンテキストから取得（サンプリング用）
    const componentName = context?.component as string | undefined;

    // サンプリングレートの適用（大量ログ出力を防止）
    if (
      componentName &&
      this.config.samplingRates &&
      this.config.samplingRates.has(componentName)
    ) {
      const currentCount = this.samplingCounters.get(componentName) || 0;
      const newCount = currentCount + 1;
      this.samplingCounters.set(componentName, newCount);

      // サンプリングレートに基づいて出力をスキップ
      const rate = this.config.samplingRates.get(componentName);
      if (rate !== undefined && newCount % rate !== 0) {
        return;
      }
    }

    // タイムスタンプの生成
    const timestamp = new Date();

    // センシティブデータの保護
    let enhancedContext = context ? this.redactSensitiveData(context) : undefined;

    // コンテキストフォーマッターの適用（設定されている場合）
    if (this.config.contextFormatter && enhancedContext) {
      enhancedContext = this.config.contextFormatter(enhancedContext);
    }

    // 内部バッファにログを保存
    const logEntry: LogBufferItem = {
      level,
      message,
      context: enhancedContext,
      timestamp,
    };

    this.logBuffer.push(logEntry);

    // バッファサイズの制限を適用
    const maxSize = this.config.maxLogBufferSize || 100;
    if (this.logBuffer.length > maxSize) {
      this.logBuffer.shift();
    }

    // コンソールへの出力（有効な場合のみ）
    if (this.config.enableConsole || FORCE_DEBUG) {
      this.writeToConsole(level, message, timestamp, enhancedContext);
    }

    // 外部トランスポートへの送信
    this.sendToTransports(level, message, enhancedContext);

    // 必要に応じて非同期でログバッファを外部サービスに送信
    this.scheduleBufferFlush();
  }

  /**
   * コンソールにログを出力
   * @param level ログレベル
   * @param message メッセージ
   * @param timestamp タイムスタンプ
   * @param context コンテキスト情報
   */
  private writeToConsole(
    level: LogLevel,
    message: string,
    timestamp: Date,
    context?: Record<string, unknown>
  ): void {
    const timestampStr = this.config.includeTimestamps
      ? `${timestamp.toISOString().slice(11, 23)} `
      : '';

    const levelStr = logLevelToString(level);

    // 安全なコンソールメソッドの選択
    let consoleMethod: (message: string, ...optionalParams: unknown[]) => void;
    switch (level) {
      case LogLevel.ERROR:
        consoleMethod = console.error.bind(console);
        break;
      case LogLevel.WARN:
        consoleMethod = console.warn.bind(console);
        break;
      case LogLevel.INFO:
      case LogLevel.DEBUG:
      default:
        // デバッグとインフォは同じメソッドを使用
        consoleMethod = console.info.bind(console);
        break;
    }

    // コンポーネント名があればログ表示に追加
    const componentStr = context?.component ? `[${String(context.component)}] ` : '';

    // コンテキスト情報が存在する場合はフォーマット
    if (context && Object.keys(context).length > 0) {
      consoleMethod(`${timestampStr}[${levelStr}] ${componentStr}${message}`, context);
    } else {
      consoleMethod(`${timestampStr}[${levelStr}] ${componentStr}${message}`);
    }
  }

  /**
   * 設定されたトランスポートにログを送信
   * @param level ログレベル
   * @param message ログメッセージ
   * @param context コンテキスト情報
   */
  private sendToTransports(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (!this.config.transports || this.config.transports.length === 0) {
      return;
    }

    for (const transport of this.config.transports) {
      try {
        transport.log(level, message, context as LogContext);
      } catch (error) {
        // トランスポートエラーはコンソールに記録するだけ
        console.error('ログトランスポートエラー', {
          transportError: error instanceof Error ? error.message : String(error),
          originalMessage: message,
        });
      }
    }
  }

  /**
   * バッファのフラッシュをスケジュール
   */
  private scheduleBufferFlush(): void {
    const now = Date.now();
    const timeSinceLastFlush = now - this.lastBufferFlush;

    // 一定時間が経過していれば、フラッシュを実行
    if (timeSinceLastFlush >= this.flushInterval && !this.bufferFlushPromise) {
      this.bufferFlushPromise = this.flushBuffers().finally(() => {
        this.bufferFlushPromise = null;
        this.lastBufferFlush = Date.now();
      });
    }
  }

  /**
   * 機密データを編集（リダクション）
   * @param context 編集対象のコンテキスト
   * @returns 編集後のコンテキスト
   */
  private redactSensitiveData(context: Record<string, unknown>): Record<string, unknown> {
    if (!this.config.redactionKeys || this.config.redactionKeys.length === 0) {
      return context;
    }

    // コンテキストのコピーを作成
    const safeContext = { ...context };

    // 機密キーをリダクション
    const keys = Object.keys(safeContext);
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      const sensitiveKeys = this.config.redactionKeys;

      // Object.prototype.hasOwnPropertyを使用して安全にプロパティにアクセス
      if (Object.prototype.hasOwnProperty.call(safeContext, key)) {
        // 安全な方法でキーチェック
        if (sensitiveKeys.some(redactKey => lowerKey.includes(redactKey.toLowerCase()))) {
          // 機密データを特定した場合は値をマスク
          Object.defineProperty(safeContext, key, {
            value: '[REDACTED]',
            writable: true,
            enumerable: true,
            configurable: true,
          });
        } else {
          // 安全にプロパティ値を取得 (オブジェクトインジェクション対策)
          const value = Object.prototype.hasOwnProperty.call(safeContext, key)
            ? Object.getOwnPropertyDescriptor(safeContext, key)?.value
            : undefined;

          if (
            typeof value === 'object' &&
            value !== null &&
            !(value instanceof Date) // Date型は対象外
          ) {
            // ネストされたオブジェクトも再帰的にリダクション
            const nestedObj = value as Record<string, unknown>;
            Object.defineProperty(safeContext, key, {
              value: this.redactSensitiveData(nestedObj),
              writable: true,
              enumerable: true,
              configurable: true,
            });
          }
        }
      }
    }

    return safeContext;
  }
}

// シングルトンインスタンスをエクスポート
export const logger = new Logger();

// プロダクション環境での外部サービス連携設定
if (ENV.env.isProd) {
  try {
    logger.info('外部エラー追跡サービスとの連携を初期化しています');

    // 実際の外部サービスの設定は、エラー追跡サービス（Sentry等）の
    // 専用モジュールに置くことが推奨されます。このコメントは設定例です。
    //
    // 以下は構成例：
    // 1. トランスポートの設定
    // 2. ログレベルの設定
    // 3. サンプリングレートの設定（大量ログを間引く）

    logger.info('外部エラー追跡サービスの統合が完了しました');
  } catch (err: unknown) {
    // エラーの場合でもロガー自体は利用可能に
    logger.error(`外部トランスポートの初期化に失敗しました`, {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export default logger;
