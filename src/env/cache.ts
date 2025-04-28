/**
 * 環境変数のキャッシュ機能
 * 複数回アクセスされる環境変数をキャッシュして効率化します
 */

import { getEnvVar, getEnvBool } from './core';

import { logger } from '@/utils/logger';

/**
 * キャッシュされる値の型
 */
type CacheableValue = string | boolean | number;

/**
 * 型安全なキャッシュストレージ
 * Map型を使用してObject Injectionの脆弱性を回避
 */
const envCache = new Map<string, CacheableValue>();

/**
 * キャッシュの有効期限管理
 * 環境変数の値が変更された場合に古い値を使わないための仕組み
 */
const cacheTimestamps = new Map<string, number>();

// キャッシュの最大寿命（ミリ秒）- 一時間
const CACHE_MAX_AGE = 60 * 60 * 1000;

/**
 * キャッシュが有効かどうかを確認
 * @param key キャッシュキー
 * @returns キャッシュが有効ならtrue
 */
function isCacheValid(key: string): boolean {
  const timestamp = cacheTimestamps.get(key);
  if (!timestamp) return false;

  const now = Date.now();
  return now - timestamp < CACHE_MAX_AGE;
}

/**
 * 環境変数を取得しキャッシュする
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @returns キャッシュされた環境変数値
 */
export function getCachedEnvVar(key: string, defaultValue = ''): string {
  // キャッシュの有効期限を確認
  if (!envCache.has(key) || !isCacheValid(key)) {
    try {
      const value = getEnvVar({ key, defaultValue });
      envCache.set(key, value);
      cacheTimestamps.set(key, Date.now());
    } catch (error) {
      logger.warn(`環境変数 ${key} のキャッシュに失敗しました`, {
        component: 'EnvCache',
        error: error instanceof Error ? error.message : String(error),
      });
      // エラーが発生した場合はデフォルト値をキャッシュ
      envCache.set(key, defaultValue);
      cacheTimestamps.set(key, Date.now());
    }
  }
  return envCache.get(key) as string;
}

/**
 * ブール値の環境変数を取得しキャッシュする
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @returns キャッシュされたブール値
 */
export function getCachedEnvBool(key: string, defaultValue = false): boolean {
  const cacheKey = `bool_${key}`;

  // キャッシュの有効期限を確認
  if (!envCache.has(cacheKey) || !isCacheValid(cacheKey)) {
    try {
      const value = getEnvBool(key, defaultValue);
      envCache.set(cacheKey, value);
      cacheTimestamps.set(cacheKey, Date.now());
    } catch (error) {
      logger.warn(`環境変数 ${key} のブール値キャッシュに失敗しました`, {
        component: 'EnvCache',
        error: error instanceof Error ? error.message : String(error),
      });
      // エラーが発生した場合はデフォルト値をキャッシュ
      envCache.set(cacheKey, defaultValue);
      cacheTimestamps.set(cacheKey, Date.now());
    }
  }
  return envCache.get(cacheKey) as boolean;
}

/**
 * 数値の環境変数を取得しキャッシュする
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @param options 追加オプション（最小値、最大値）
 * @returns キャッシュされた数値
 */
export function getCachedEnvNumber(
  key: string,
  defaultValue = 0,
  options: { min?: number; max?: number } = {}
): number {
  const { min, max } = options;
  const cacheKey = `num_${key}`;

  // キャッシュの有効期限を確認
  if (!envCache.has(cacheKey) || !isCacheValid(cacheKey)) {
    try {
      // coreから変数取得
      const value = getEnvVar({ key, defaultValue: defaultValue.toString() });
      const parsedValue = Number(value);

      // 数値変換のエラーを検出
      if (isNaN(parsedValue)) {
        logger.warn(`環境変数の数値変換に失敗しました。デフォルト値を使用します`, {
          key,
          value,
          defaultValue,
          component: 'EnvCache',
        });
        envCache.set(cacheKey, defaultValue);
      } else {
        // 最小値・最大値の制限を適用
        let finalValue = parsedValue;
        if (min !== undefined && finalValue < min) {
          finalValue = min;
          logger.debug(`環境変数 ${key} の値を最小値 ${min} に制限しました`, {
            component: 'EnvCache',
          });
        }
        if (max !== undefined && finalValue > max) {
          finalValue = max;
          logger.debug(`環境変数 ${key} の値を最大値 ${max} に制限しました`, {
            component: 'EnvCache',
          });
        }
        envCache.set(cacheKey, finalValue);
      }
      cacheTimestamps.set(cacheKey, Date.now());
    } catch (error) {
      logger.warn(`環境変数 ${key} の数値キャッシュに失敗しました`, {
        component: 'EnvCache',
        error: error instanceof Error ? error.message : String(error),
      });
      // エラーが発生した場合はデフォルト値をキャッシュ
      envCache.set(cacheKey, defaultValue);
      cacheTimestamps.set(cacheKey, Date.now());
    }
  }
  return envCache.get(cacheKey) as number;
}

/**
 * キャッシュをクリアする
 * @param keyPrefix 特定のプレフィックスを持つキーのみをクリアする場合は指定
 */
export function clearEnvCache(keyPrefix?: string): void {
  if (keyPrefix) {
    // 特定のプレフィックスに一致するキーのみをクリア（安全な実装）
    for (const key of envCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        envCache.delete(key);
        cacheTimestamps.delete(key);
      }
    }

    logger.debug('特定のプレフィックスの環境変数キャッシュをクリアしました', {
      component: 'EnvCache',
      prefix: keyPrefix,
    });
  } else {
    // すべてをクリア
    envCache.clear();
    cacheTimestamps.clear();
    logger.debug('すべての環境変数キャッシュをクリアしました', {
      component: 'EnvCache',
    });
  }
}
