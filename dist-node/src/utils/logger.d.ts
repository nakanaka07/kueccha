/**
 * アプリケーションログユーティリティ
 *
 * 環境に応じた適切なログ出力を行い、将来的な外部サービス連携にも対応可能な
 * 柔軟なロギングシステムを提供します。
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
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
declare class Logger {
    private config;
    private logBuffer;
    private samplingCounters;
    /**
     * ロガー設定を更新
     */
    configure(config: Partial<LoggerConfig>): void;
    /**
     * デバッグログエントリを記録
     */
    debug(message: string, context?: Record<string, unknown>): void;
    /**
     * 情報ログエントリを記録
     */
    info(message: string, context?: Record<string, unknown>): void;
    /**
     * 警告ログエントリを記録
     */
    warn(message: string, context?: Record<string, unknown>): void;
    /**
     * エラーログエントリを記録
     */
    error(message: string, context?: Record<string, unknown>): void;
    /**
     * 処理時間を測定し結果をログに記録
     * パフォーマンス監視に便利な短縮形メソッド
     */
    measureTime<T>(label: string, callback: () => T, logLevel?: LogLevel): T;
    /**
     * 非同期処理の時間を測定し結果をログに記録
     * async/await と組み合わせて使用するためのメソッド
     */
    measureTimeAsync<T>(label: string, callback: () => Promise<T>, logLevel?: LogLevel): Promise<T>;
    /**
     * 最近のログエントリを取得（デバッグ用）
     */
    getRecentLogs(): LogBufferItem[];
    /**
     * 内部的なログ処理関数
     * サンプリング・フィルタリングを適用
     */
    private log;
}
export declare const logger: Logger;
export default logger;
