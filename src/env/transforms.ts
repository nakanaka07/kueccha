/**
 * 環境変数の型変換ユーティリティ
 *
 * 文字列形式の環境変数を様々な型に変換する関数群
 * 静的ホスティングを前提とした型変換の最適化
 */

import { logger } from '@/utils/logger';

// LogLevel型の直接定義（循環参照を回避）
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

/**
 * 文字列をブール値に変換する
 * @param value 変換する文字列値
 * @returns 対応するブール値
 */
export const toBool = (value: string): boolean => {
  // 厳格な比較で変換
  const lowercased = value.toLowerCase().trim();
  return ['true', '1', 'yes', 'on'].includes(lowercased);
};

/**
 * 文字列を数値に変換する
 * @param value 変換する文字列値
 * @param defaultValue 変換失敗時のデフォルト値（指定がなければエラーをスロー）
 * @returns 変換された数値
 */
export const toNumber = (value: string, defaultValue?: number): number => {
  // 値の正規化
  const trimmed = value.trim();

  // 空文字列の場合
  if (trimmed === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error('空の文字列は数値に変換できません');
  }

  const num = Number(trimmed);
  if (isNaN(num)) {
    if (defaultValue !== undefined) {
      logger.warn(`"${value}"は有効な数値ではありません。デフォルト値${defaultValue}を使用します`, {
        component: 'EnvTransform',
        invalidValue: value,
      });
      return defaultValue;
    }
    throw new Error(`"${value}"は有効な数値ではありません`);
  }
  return num;
};

/**
 * 文字列を整数に変換する（小数点以下を切り捨て）
 * @param value 変換する文字列値
 * @param defaultValue 変換失敗時のデフォルト値（指定がなければエラーをスロー）
 * @returns 変換された整数
 */
export const toInteger = (value: string, defaultValue?: number): number => {
  const num = toNumber(value, defaultValue);
  return Math.floor(num);
};

/**
 * 文字列を配列に変換する（カンマ区切り）
 * @param value カンマ区切りの文字列
 * @param transform オプションの要素変換関数
 * @returns 文字列の配列
 */
export const toArray = <T>(value: string, transform?: (item: string) => T): T[] | string[] => {
  // 空文字列の場合は空配列を返す
  if (!value) return [];

  // カンマ区切りを分解して配列に変換
  const items = value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);

  // 変換関数が指定されていれば各要素を変換
  if (transform) {
    return items.map(transform);
  }

  return items;
};

/**
 * 文字列をLogLevel型に変換する
 * @param value ログレベルを表す文字列
 * @returns LogLevel型の値
 */
export const toLogLevel = (value: string): LogLevel => {
  const lowercased = value.toLowerCase().trim();
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
      logger.warn(`無効なログレベル "${value}" が指定されました。"info"を使用します`, {
        component: 'EnvTransform',
        invalidLogLevel: value,
      });
      return LogLevel.INFO; // 無効な場合はINFOをデフォルト値として使用
  }
};

/**
 * 文字列をJSONにパースする
 * @param value JSONフォーマットの文字列
 * @param defaultValue パース失敗時のデフォルト値
 * @returns パースされたオブジェクト
 */
export function toJSON<T>(value: string, defaultValue?: T): T {
  try {
    return JSON.parse(value) as T;
  } catch (err) {
    if (defaultValue !== undefined) {
      logger.warn(`JSON解析に失敗しました。デフォルト値を使用します`, {
        component: 'EnvTransform',
        error: err instanceof Error ? err.message : String(err),
      });
      return defaultValue;
    }
    throw new Error(
      `JSONの解析に失敗しました: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * URLが有効かどうかを検証して返す
 * @param value URL文字列
 * @param defaultValue 検証失敗時のデフォルト値
 * @returns 検証済みのURL文字列
 */
export function toURL(value: string, defaultValue?: string): string {
  try {
    // URLの検証（エラーがスローされなければ有効）
    new URL(value);
    return value;
  } catch {
    // エラー変数を使わない
    if (defaultValue !== undefined) {
      logger.warn(`"${value}"は有効なURLではありません。デフォルト値を使用します`, {
        component: 'EnvTransform',
        invalidURL: value,
      });
      return defaultValue;
    }
    throw new Error(`"${value}"は有効なURLではありません`);
  }
}

/**
 * 列挙型の有効な値かどうかを検証して返す
 * @param value 検証する文字列値
 * @param enumObject 列挙型オブジェクト
 * @param defaultValue 検証失敗時のデフォルト値
 * @returns 検証済みの列挙型値
 */
export function toEnum<T extends Record<string, string | number>>(
  value: string,
  enumObject: T,
  defaultValue?: T[keyof T]
): T[keyof T] {
  // 値の配列を取得（文字列の場合のみ）
  const enumValues = Object.values(enumObject).filter(v => typeof v === 'string') as string[];

  // 値が列挙型に含まれているか確認
  if (enumValues.includes(value)) {
    return value as unknown as T[keyof T];
  }

  if (defaultValue !== undefined) {
    logger.warn(`"${value}"は有効な列挙型の値ではありません。デフォルト値を使用します`, {
      component: 'EnvTransform',
      invalidEnumValue: value,
      validValues: enumValues.join(', '),
    });
    return defaultValue;
  }

  throw new Error(`"${value}"は有効な列挙型の値ではありません。有効な値: ${enumValues.join(', ')}`);
}
