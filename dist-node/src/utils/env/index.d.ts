/**
 * 環境変数関連のユーティリティをエクスポートするインデックスファイル
 *
 * このファイルは環境変数アクセスに関する全ての機能を集約し、単一のエントリポイントを提供します。
 * @/utils/env として他のモジュールからインポート可能にします。
 */
export * from './core';
export * from './cache';
export * from './transforms';
export * from './validators';
export * from './google-maps';
import type { EnvironmentConfig } from '@/types/env-types';
/**
 * グローバルに利用可能なENV設定オブジェクト
 * アプリケーション全体で一貫した環境設定へのアクセスを提供します
 */
export declare const ENV: EnvironmentConfig;
/**
 * 環境設定を取得
 * @returns EnvironmentConfig オブジェクト
 */
export declare function getEnvironmentConfig(): EnvironmentConfig;
