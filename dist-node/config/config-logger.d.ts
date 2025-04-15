/**
 * シンプルな設定用ロガー
 * 参考: logger_usage_guidelines.md
 *
 * KISS（Keep It Simple, Stupid）とYAGNI（You Aren't Gonna Need It）の原則に基づいて最適化
 */
export type LogLevelString = 'error' | 'warn' | 'info' | 'debug';
export interface LogContext {
  [key: string]: unknown;
  component?: string;
  userId?: string;
  requestId?: string;
}
type LogFunction = (message: string, context?: LogContext) => void;
export declare const configLogger: {
  error: LogFunction;
  warn: LogFunction;
  info: LogFunction;
  debug: LogFunction;
};
export {};
