/**
 * 環境変数のキャッシュ機能
 * 複数回アクセスされる環境変数をキャッシュして効率化します
 */
import { getEnvVar, getEnvBool } from './core';
import { logger } from '@/utils/logger';
// 型安全なキャッシュストレージ
// Map型を使用してObject Injectionの脆弱性を回避
const envCache = new Map();
/**
 * 環境変数を取得しキャッシュする
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @returns キャッシュされた環境変数値
 */
export function getCachedEnvVar(key, defaultValue = '') {
    if (!envCache.has(key)) {
        envCache.set(key, getEnvVar({ key, defaultValue }));
    }
    return envCache.get(key);
}
/**
 * ブール値の環境変数を取得しキャッシュする
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @returns キャッシュされたブール値
 */
export function getCachedEnvBool(key, defaultValue = false) {
    const cacheKey = `bool_${key}`;
    if (!envCache.has(cacheKey)) {
        envCache.set(cacheKey, getEnvBool(key, defaultValue));
    }
    return envCache.get(cacheKey);
}
/**
 * 数値の環境変数を取得しキャッシュする
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @returns キャッシュされた数値
 */
export function getCachedEnvNumber(key, defaultValue = 0) {
    const cacheKey = `num_${key}`;
    if (!envCache.has(cacheKey)) {
        // coreから直接インポートできないため、内部で変換実装
        const value = getEnvVar({ key, defaultValue: defaultValue.toString() });
        const parsedValue = Number(value);
        // 数値変換のエラーを検出し、デフォルト値を使用
        if (isNaN(parsedValue)) {
            logger.warn(`環境変数の数値変換に失敗しました。デフォルト値を使用します`, {
                key,
                value,
                defaultValue,
                component: 'EnvCache',
            });
            envCache.set(cacheKey, defaultValue);
        }
        else {
            envCache.set(cacheKey, parsedValue);
        }
    }
    return envCache.get(cacheKey);
}
/**
 * キャッシュをクリアする（主にテスト用）
 */
export function clearEnvCache() {
    envCache.clear();
    logger.debug('環境変数キャッシュをクリアしました', {
        component: 'EnvCache',
        action: 'clearCache',
    });
}
