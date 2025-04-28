/**
 * 環境変数用バリデーター関数
 * 環境変数の型と値を検証するためのユーティリティ
 * セキュリティを強化した実装
 */

import { getEnvVar } from '../env/core';

import { logger } from '@/utils/logger';

/**
 * バリデーター関数の型定義
 */
type ValidatorFn<T> = (value: string) => T;

/**
 * 基本的なバリデータークラス
 * 連鎖可能な検証を提供
 */
export class Validator<T> {
  private validators: Array<(value: T) => T> = [];

  constructor(private transform: ValidatorFn<T>) {}

  /**
   * 値を検証する
   * @param value 検証する文字列値
   * @returns 変換・検証された値
   */
  validate(value: string): T {
    // 基本変換を実行
    let result = this.transform(value);

    // 追加の検証を実行
    for (const validator of this.validators) {
      result = validator(result);
    }

    return result;
  }

  /**
   * 検証関数を追加
   * @param fn 検証関数
   * @returns Validatorインスタンス（チェーン可能）
   */
  addCheck(fn: (value: T) => T): Validator<T> {
    this.validators.push(fn);
    return this;
  }
}

/**
 * URL形式の環境変数を検証
 * @param value 検証するURL文字列
 * @returns 検証されたURL文字列
 */
export const urlValidator: ValidatorFn<string> = (value: string): string => {
  // 空の値は拒否
  if (!value) {
    throw new Error('URLが空です');
  }

  try {
    // URLをパースしてプロトコルを確認
    const url = new URL(value);

    // 安全なプロトコルのみを許可
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error(`無効なプロトコル: ${url.protocol}`);
    }

    return value;
  } catch (err) {
    throw new Error(
      `無効なURL形式です: ${value} - ${err instanceof Error ? err.message : String(err)}`
    );
  }
};

/**
 * 数値型の環境変数を検証
 * @param value 検証する数値文字列
 * @returns 検証・変換された数値
 */
export const numberValidator: ValidatorFn<number> = (value: string): number => {
  // トリミングして空白を除去
  const trimmed = value.trim();

  // 空の値は拒否
  if (!trimmed) {
    throw new Error('数値が空です');
  }

  const num = Number(trimmed);

  if (Number.isNaN(num)) {
    throw new Error(`数値に変換できません: ${value}`);
  }

  return num;
};

/**
 * 整数型の環境変数を検証（最小値と最大値のチェック付き）
 * @param min 最小値（オプション）
 * @param max 最大値（オプション）
 * @returns 検証関数
 */
export const intValidator =
  (min?: number, max?: number): ValidatorFn<number> =>
  (value: string): number => {
    // 基本的な数値検証
    const num = numberValidator(value);

    // 整数チェック
    if (!Number.isInteger(num)) {
      throw new Error(`整数ではありません: ${value}`);
    }

    // 範囲チェック
    if (min !== undefined && num < min) {
      throw new Error(`最小値(${min})より小さい値です: ${num}`);
    }

    if (max !== undefined && num > max) {
      throw new Error(`最大値(${max})より大きい値です: ${num}`);
    }

    return num;
  };

/**
 * ブール値の検証
 */
export const boolValidator: ValidatorFn<boolean> = (value: string): boolean => {
  const lowercased = value.toLowerCase().trim();
  // 明示的なブール値のみを許可
  if (['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'].includes(lowercased)) {
    return ['true', '1', 'yes', 'on'].includes(lowercased);
  }
  throw new Error(`ブール値に変換できません: ${value}`);
};

/**
 * 列挙型の検証
 * @param allowedValues 許可される値の配列
 * @returns 検証関数
 */
export const enumValidator =
  <T extends string>(allowedValues: readonly T[]): ValidatorFn<T> =>
  (value: string): T => {
    const trimmed = value.trim();

    // 許可された値のリストをチェック
    if ((allowedValues as readonly string[]).includes(trimmed)) {
      return trimmed as T;
    }

    throw new Error(
      `値が許可されたリストに含まれていません: ${value}。許可値: ${allowedValues.join(', ')}`
    );
  };

/**
 * 型付き環境変数を取得
 * @param key 環境変数キー
 * @param validator 検証関数
 * @param defaultValue デフォルト値
 * @param required 必須フラグ
 * @returns 検証された環境変数値
 */
export function getTypedEnv<T>(
  key: string,
  validator: ValidatorFn<T>,
  defaultValue?: string,
  required = false
): T {
  try {
    // 環境変数を取得（デフォルト値がundefinedの場合は空文字を使用）
    const options = {
      key,
      required,
    };

    // デフォルト値が設定されている場合のみ追加
    if (defaultValue !== undefined) {
      Object.assign(options, { defaultValue });
    }

    const value = getEnvVar(options);

    // 値を検証
    return validator(value);
  } catch (error) {
    // エラーログと例外
    const errorMsg = `環境変数 ${key} の検証エラー: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMsg, { component: 'EnvValidator' });
    throw new Error(errorMsg);
  }
}

/**
 * URL環境変数を安全に取得
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @returns 検証されたURL
 */
export function getUrlEnv(key: string, defaultValue?: string): string {
  return getTypedEnv(key, urlValidator, defaultValue);
}

/**
 * 数値環境変数を安全に取得
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @returns 検証された数値
 */
export function getNumberEnv(key: string, defaultValue?: string): number {
  return getTypedEnv(key, numberValidator, defaultValue);
}

/**
 * 整数環境変数を安全に取得
 * @param key 環境変数キー
 * @param options オプション（最小値・最大値・デフォルト値）
 * @returns 検証された整数
 */
export function getIntEnv(
  key: string,
  options: { min?: number; max?: number; defaultValue?: string } = {}
): number {
  const { min, max, defaultValue } = options;
  return getTypedEnv(key, intValidator(min, max), defaultValue);
}

/**
 * ブール値環境変数を安全に取得
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @returns 検証されたブール値
 */
export function getBoolEnv(key: string, defaultValue?: string): boolean {
  return getTypedEnv(key, boolValidator, defaultValue);
}

/**
 * 列挙型環境変数を安全に取得
 * @param key 環境変数キー
 * @param allowedValues 許可される値の配列
 * @param defaultValue デフォルト値
 * @returns 検証された列挙型値
 */
export function getEnumEnv<T extends string>(
  key: string,
  allowedValues: readonly T[],
  defaultValue?: string
): T {
  return getTypedEnv(key, enumValidator(allowedValues), defaultValue);
}
