/**
 * 環境変数の型変換ユーティリティ
 *
 * 文字列形式の環境変数を様々な型に変換する関数群
 */
export declare enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}
/**
 * 文字列をブール値に変換する
 */
export declare const toBool: (value: string) => boolean;
/**
 * 文字列を数値に変換する
 */
export declare const toNumber: (value: string) => number;
/**
 * 文字列をLogLevel型に変換する
 * logger.tsへの依存を除去
 */
export declare const toLogLevel: (value: string) => LogLevel;
