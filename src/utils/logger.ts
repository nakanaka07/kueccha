/**
 * フロントエンドのロギングユーティリティ
 * サーバー側のロガーとの一貫性を保ちつつ、ブラウザ環境でも動作するよう設計
 */

// 環境変数
const IS_DEV = import.meta.env.MODE === 'development';
const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'info';

// ログレベルの定義と順序
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

type LogLevel = keyof typeof LOG_LEVELS;
type LogCategory = string;
type LogCode = string;
type LogDetails = unknown;

/**
 * 現在の設定でログを出力すべきかを判断
 * @param level 対象のログレベル
 * @returns 出力すべき場合はtrue
 */
function shouldLog(level: LogLevel): boolean {
  const configuredLevel = LOG_LEVELS[LOG_LEVEL.toLowerCase() as LogLevel] || LOG_LEVELS.info;
  const messageLevel = LOG_LEVELS[level];
  return messageLevel <= configuredLevel;
}

/**
 * ログエントリを作成し、コンソールに出力する
 * @param level ログレベル
 * @param category ログカテゴリ
 * @param code ログコード
 * @param message メッセージ
 * @param details 詳細情報
 */
function log(
  level: LogLevel,
  category: LogCategory,
  code: LogCode,
  message: string,
  details?: LogDetails,
): void {
  if (!shouldLog(level)) return;

  const logData = {
    timestamp: new Date().toISOString(),
    level,
    category,
    code,
    message,
    details,
    environment: import.meta.env.MODE,
  };

  // 開発環境ではフォーマットされた出力
  if (IS_DEV) {
    console[level](
      `[${logData.timestamp}] ${level.toUpperCase()} [${category}:${code}]: ${message}`,
      details !== undefined ? { details } : '',
    );
  } else {
    // 本番環境ではJSON形式でログを出力
    console[level](JSON.stringify(logData));

    // エラーレベルのログは必要に応じてサーバーに送信することも検討できる
    if (level === 'error') {
      // TODO: 必要に応じて重要なエラーをサーバーに送信
      // sendErrorToServer(logData);
    }
  }
}

/**
 * エラーレベルのログを出力
 * @param category ログカテゴリ
 * @param code エラーコード
 * @param message エラーメッセージ
 * @param details 詳細情報
 */
export function logError(
  category: LogCategory,
  code: LogCode,
  message: string,
  details?: LogDetails,
): void {
  log('error', category, code, message, details);
}

/**
 * 警告レベルのログを出力
 * @param category ログカテゴリ
 * @param code 警告コード
 * @param message 警告メッセージ
 * @param details 詳細情報
 */
export function logWarn(
  category: LogCategory,
  code: LogCode,
  message: string,
  details?: LogDetails,
): void {
  log('warn', category, code, message, details);
}

/**
 * 情報レベルのログを出力
 * @param category ログカテゴリ
 * @param code 情報コード
 * @param message 情報メッセージ
 * @param details 詳細情報
 */
export function logInfo(
  category: LogCategory,
  code: LogCode,
  message: string,
  details?: LogDetails,
): void {
  log('info', category, code, message, details);
}

/**
 * デバッグレベルのログを出力
 * @param category ログカテゴリ
 * @param code デバッグコード
 * @param message デバッグメッセージ
 * @param details 詳細情報
 */
export function logDebug(
  category: LogCategory,
  code: LogCode,
  message: string,
  details?: LogDetails,
): void {
  log('debug', category, code, message, details);
}

/**
 * サーバーにエラーログを送信する（実装例）
 * @param logData 送信するログデータ
 */
// async function sendErrorToServer(logData: any): Promise<void> {
//   try {
//     await fetch('/api/logs', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(logData),
//     });
//   } catch (err) {
//     console.error('Error sending log to server:', err);
//   }
// }

export default {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
};
