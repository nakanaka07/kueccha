/**
 * ロギング用のコンテキスト作成ユーティリティ
 *
 * ロガー使用ガイドラインに従って構造化ログを生成するためのヘルパー関数
 */

/**
 * ログコンテキストを生成する
 * @param component - ログを出力するコンポーネント/モジュール名
 * @param additionalContext - 追加のコンテキスト情報
 * @returns 構造化されたログコンテキスト
 */
export function createLogContext(
  component: string,
  additionalContext: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    component,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
}
