type ValidatorFn<T> = (value: string) => T;
/**
 * URL形式の環境変数を検証
 */
export declare const urlValidator: ValidatorFn<string>;
/**
 * 数値型の環境変数を検証
 */
export declare const numberValidator: ValidatorFn<number>;
/**
 * 整数型の環境変数を検証（最小値と最大値のチェック付き）
 */
export declare const intValidator: (min?: number, max?: number) => ValidatorFn<number>;
/**
 * 型付き環境変数を取得
 */
export declare function getTypedEnv<T>(key: string, validator: ValidatorFn<T>, defaultValue?: string, required?: boolean): T;
export {};
