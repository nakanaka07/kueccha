/**
 * 環境変数を取得するユーティリティ関数
 * @param options 環境変数オプション
 * @returns 環境変数の値
 */
interface GetEnvVarOptions {
    key: string;
    defaultValue?: string;
    required?: boolean;
}
export declare function getEnvVar({ key, defaultValue, required }: GetEnvVarOptions): string;
/**
 * 環境変数をブール値に変換する
 * @param key 環境変数のキー
 * @param defaultValue デフォルト値
 * @returns ブール値
 */
export declare function getEnvBool(key: string, defaultValue?: boolean): boolean;
/**
 * 環境変数を取得する（型安全で、キャッシュを活用）
 */
export declare function getEnv(key: string, options?: {
    defaultValue?: string;
    required?: boolean;
    cache?: boolean;
}): string;
/**
 * 数値型の環境変数を取得
 */
export declare function getNumberEnv(key: string, options?: {
    defaultValue?: number;
    required?: boolean;
    min?: number;
    max?: number;
}): number;
export {};
