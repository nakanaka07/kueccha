/**
 * 設定ファイル用の簡易ロガー
 * Vite設定ファイルなどで使用するために、import.metaに依存しない実装
 */

export interface LogContext {
  component?: string;
  action?: string;
  [key: string]: unknown;
}

// シンプルなロガーインターフェース
export const logger = {
  error: (message: string, context?: LogContext) => {
    console.error(`[ERROR] ${message}`, context || '');
  },
  warn: (message: string, context?: LogContext) => {
    console.warn(`[WARN] ${message}`, context || '');
  },
  info: (message: string, context?: LogContext) => {
    console.info(`[INFO] ${message}`, context || '');
  },
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV !== 'production') {
      // ESLintルールに従い、許可されたconsoleメソッドを使用
      console.info(`[DEBUG] ${message}`, context || '');
    }
  },
};

// デフォルトエクスポートも追加
export default { logger };
