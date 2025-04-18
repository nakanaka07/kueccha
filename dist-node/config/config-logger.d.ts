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
export interface PerformanceLogContext extends LogContext {
  duration: number;
  startTime?: number;
  endTime?: number;
  operationType?: string;
}
export interface PerformanceResult {
  duration: number;
  operationName: string;
  context?: LogContext;
}
type LogFunction = (message: string, context?: LogContext) => void;
export declare const configLogger: {
  error: LogFunction;
  warn: LogFunction;
  info: LogFunction;
  debug: LogFunction;
  startTimer: (operationName: string, context?: LogContext) => () => PerformanceResult;
  startDebugTimer: (operationName: string, context?: LogContext) => () => PerformanceResult;
  measure: <T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: LogContext
  ) => Promise<T>;
  measureDebug: <T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: LogContext
  ) => Promise<T>;
};
export {};
