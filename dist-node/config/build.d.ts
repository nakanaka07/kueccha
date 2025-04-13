import type { BuildOptions } from 'vite';
/**
 * Vite用のビルド設定を生成
 * @param isProd 本番環境かどうか
 * @returns ビルド設定オブジェクト
 */
export declare function createBuildOptions(isProd: boolean): BuildOptions;
