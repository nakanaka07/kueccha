/**
 * 環境変数のキャッシュ機能
 * 複数回アクセスされる環境変数をキャッシュして効率化します
 */
/**
 * 環境変数を取得しキャッシュする
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @returns キャッシュされた環境変数値
 */
export declare function getCachedEnvVar(key: string, defaultValue?: string): string;
/**
 * ブール値の環境変数を取得しキャッシュする
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @returns キャッシュされたブール値
 */
export declare function getCachedEnvBool(key: string, defaultValue?: boolean): boolean;
/**
 * 数値の環境変数を取得しキャッシュする
 * @param key 環境変数キー
 * @param defaultValue デフォルト値
 * @returns キャッシュされた数値
 */
export declare function getCachedEnvNumber(key: string, defaultValue?: number): number;
/**
 * キャッシュをクリアする（主にテスト用）
 */
export declare function clearEnvCache(): void;
