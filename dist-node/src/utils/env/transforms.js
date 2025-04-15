/**
 * 環境変数の型変換ユーティリティ
 *
 * 文字列形式の環境変数を様々な型に変換する関数群
 */
// LogLevel型のインポートを除去し、直接定義して循環参照を回避
export var LogLevel;
(function (LogLevel) {
  LogLevel[(LogLevel['ERROR'] = 0)] = 'ERROR';
  LogLevel[(LogLevel['WARN'] = 1)] = 'WARN';
  LogLevel[(LogLevel['INFO'] = 2)] = 'INFO';
  LogLevel[(LogLevel['DEBUG'] = 3)] = 'DEBUG';
})(LogLevel || (LogLevel = {}));
/**
 * 文字列をブール値に変換する
 */
export const toBool = value => {
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};
/**
 * 文字列を数値に変換する
 */
export const toNumber = value => {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`"${value}" は有効な数値ではありません`);
  }
  return num;
};
/**
 * 文字列をLogLevel型に変換する
 * logger.tsへの依存を除去
 */
export const toLogLevel = value => {
  const lowercased = value.toLowerCase();
  switch (lowercased) {
    case 'error':
      return LogLevel.ERROR;
    case 'warn':
    case 'warning':
      return LogLevel.WARN;
    case 'info':
      return LogLevel.INFO;
    case 'debug':
      return LogLevel.DEBUG;
    default:
      // 警告をログに記録（直接console.warnを使わない）
      // 循環参照を避けるためにロガーへの依存を追加しない
      return LogLevel.INFO; // 無効な場合はINFOをデフォルト値として使用
  }
};
