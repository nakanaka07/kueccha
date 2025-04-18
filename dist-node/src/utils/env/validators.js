/**
 * 環境変数用バリデーター関数
 * 環境変数の型と値を検証するためのユーティリティ
 */
import { getEnvVar } from './core.js';
/**
 * URL形式の環境変数を検証
 */
export const urlValidator = (value) => {
    try {
        new URL(value);
        return value;
    }
    catch {
        throw new Error(`無効なURL形式です: ${value}`);
    }
};
/**
 * 数値型の環境変数を検証
 */
export const numberValidator = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) {
        throw new Error(`数値に変換できません: ${value}`);
    }
    return num;
};
/**
 * 整数型の環境変数を検証（最小値と最大値のチェック付き）
 */
export const intValidator = (min, max) => (value) => {
    const num = numberValidator(value);
    if (!Number.isInteger(num)) {
        throw new Error(`整数ではありません: ${value}`);
    }
    if (min !== undefined && num < min) {
        throw new Error(`最小値(${min})より小さい値です: ${num}`);
    }
    if (max !== undefined && num > max) {
        throw new Error(`最大値(${max})より大きい値です: ${num}`);
    }
    return num;
};
/**
 * 型付き環境変数を取得
 */
export function getTypedEnv(key, validator, defaultValue, required = false) {
    // GetEnvVarOptionsに適合するオブジェクトの作成
    const options = { key };
    // undefined 型を明示的に処理するため、条件付きで追加
    if (defaultValue !== undefined) {
        options.defaultValue = defaultValue;
    }
    if (required !== undefined) {
        options.required = required;
    }
    const value = getEnvVar(options);
    try {
        return validator(value);
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`環境変数 ${key} の検証エラー: ${error.message}`);
        }
        throw error;
    }
}
