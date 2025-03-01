/**
 * MapError.tsx
 *
 * @description
 * マップの読み込みや表示時に発生したエラーを視覚的に表示するコンポーネント。
 * ユーザーフレンドリーなエラーメッセージと再試行オプションを提供し、
 * アプリケーションのユーザーエクスペリエンスを向上させます。
 *
 * @usage
 * 以下のようなケースで使用します：
 * - Google Maps APIの読み込みに失敗した場合
 * - APIキーが無効または期限切れの場合
 * - ネットワーク接続の問題が発生した場合
 * - マップのレンダリング中に例外が発生した場合
 * - クォータ制限に達した場合
 *
 * @features
 * - わかりやすいエラーメッセージの表示
 * - 再試行機能の提供
 * - アクセシビリティ対応（適切なARIA属性）
 * - 一貫したエラーデザインパターン
 * - エラー発生時のグレースフルデグラデーション
 *
 * @props
 * - message: string - 表示するエラーメッセージ（詳細情報）
 * - onRetry?: () => void - 再試行ボタン押下時のコールバック関数（省略可）
 *
 * @example
 * // 基本的な使用例
 * <MapError
 *   message="Google Maps APIの読み込みに失敗しました"
 *   onRetry={() => window.location.reload()}
 * />
 *
 * // Map.tsxでの使用例
 * if (loadError) {
 *   return <MapError
 *     message={loadError.message || ERROR_MESSAGES.MAP.LOAD_FAILED}
 *     onRetry={handleRetry}
 *   />;
 * }
 *
 * @bestPractices
 * - エラーメッセージは具体的かつ簡潔に、解決方法を示唆する内容にする
 * - 再試行機能は可能な限り提供し、ユーザーが自力で問題を解決できるようにする
 * - エラー状態をログに記録し、開発者が問題を追跡できるようにする
 * - 適切なフォールバックUI（静的マップやプレースホルダー）の検討
 *
 * @dependencies
 * - Map.module.css: スタイリングを提供するCSSモジュール
 * - MapErrorProps: 型定義（message, onRetry属性を定義）
 * - ERROR_MESSAGES: エラーメッセージ定数（通常、親コンポーネントから提供）
 */

import React from 'react';
// MapError.module.cssではなく、Map.module.cssを使用するように変更
import styles from './Map.module.css';
import { MapErrorProps } from '../../utils/types';

/**
 * MapErrorコンポーネント
 *
 * マップ関連のエラーを一貫したデザインで表示し、
 * ユーザーに対して問題の内容と可能な解決策を提示します。
 * アクセシビリティに配慮し、スクリーンリーダーでも適切に認識されるよう
 * ARIA属性を設定しています。
 *
 * @param message - 表示するエラーメッセージ
 * @param onRetry - 再試行ボタン押下時のコールバック関数
 */
export const MapError: React.FC<MapErrorProps> = ({ message, onRetry }) => {
  return (
    <div className={styles.mapError} role="alert" aria-live="assertive">
      <div className={styles.errorContainer}>
        <h2 className={styles.errorTitle}>地図の読み込みに失敗しました</h2>
        {/* APIから返されたエラーメッセージを表示 */}
        <p className={styles.errorContent}>{message}</p>
        {/* ユーザーへの案内メッセージ */}
        <p className={styles.errorContent}>インターネット接続を確認し、再度お試しください。</p>
        {/* 再試行コールバックが提供されている場合のみ再試行ボタンを表示 */}
        {onRetry && (
          <button onClick={onRetry} className={styles.retryButton} aria-label="再読み込み">
            再読み込み
          </button>
        )}
      </div>
    </div>
  );
};

export default MapError;
