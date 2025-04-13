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
 * 環境設定を取得
 * @returns EnvironmentConfig オブジェクト
 */
export declare function getEnvironmentConfig(): EnvironmentConfig;
