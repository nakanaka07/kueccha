/**
 * ロギングコンテキスト管理ユーティリティ
 *
 * 構造化ログのためのコンテキスト情報を生成し、
 * コンポーネントや関数固有のログ出力を容易にします。
 *
 * @module logContext
 * @version 1.0.0
 * @since 2025年4月28日
 */

import { LogLevel } from '@/utils/logger';

// LogContextはRecord<string, unknown>型で表現するので個別のインターフェースは不要

/**
 * コンポーネントまたは関数のためのログコンテキストを作成します
 *
 * @param component - コンポーネントまたは関数の名前
 * @param metadata - メタデータオブジェクト
 * @param level - ログレベル（省略可能）
 * @returns ログコンテキストオブジェクト
 */
export function createLogContext(
  component: string,
  metadata?: Record<string, unknown>,
  level: LogLevel = LogLevel.INFO
): Record<string, unknown> {
  return {
    component,
    level,
    ...(metadata || {}),
  };
}

/**
 * 既存のログコンテキストに追加情報を付与した新しいコンテキストを作成します
 *
 * @param context - 既存のログコンテキスト
 * @param additionalMetadata - 追加するメタデータ
 * @returns 拡張されたログコンテキスト
 */
export function extendLogContext(
  context: Record<string, unknown>,
  additionalMetadata: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...context,
    ...additionalMetadata,
  };
}
