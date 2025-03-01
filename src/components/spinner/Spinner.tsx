/**
 * Spinner.tsx
 *
 * @description
 * シンプルなローディングインジケーターとして機能するスピナーコンポーネント。
 * 非同期操作の進行中を視覚的に表現し、ユーザーに処理中であることを知らせます。
 *
 * @usage
 * 以下のようなケースで使用します：
 * - ボタンのローディング状態の表示
 * - APIリクエスト中のインジケーター
 * - データの処理中の表示
 * - モジュールやコンポーネントの読み込み中の表示
 *
 * @features
 * - サイズのカスタマイズ（small, medium, large）
 * - カラーのカスタマイズ
 * - アクセシビリティ対応（適切なARIA属性とスクリーンリーダー用テキスト）
 * - CSSアニメーションによる回転効果
 *
 * @props
 * - size?: 'small' | 'medium' | 'large' - スピナーのサイズ（デフォルト: 'medium'）
 * - color?: string - スピナーの色（デフォルト: テーマの主要色）
 * - className?: string - 追加のCSSクラス
 * - label?: string - スクリーンリーダー用の説明テキスト（デフォルト: 'ローディング中'）
 *
 * @example
 * // 基本的な使用例
 * <Spinner />
 *
 * // サイズと色のカスタマイズ
 * <Spinner size="small" color="#ff0000" />
 *
 * // カスタムラベル付き
 * <Spinner label="データを読み込み中です" />
 *
 * // ボタン内での使用例
 * <button disabled={isLoading}>
 *   {isLoading ? <Spinner size="small" /> : 'ログイン'}
 * </button>
 *
 * @bestPractices
 * - 適切なサイズを選択してコンテキストに合わせる（小さなボタンには'small'など）
 * - アプリケーションの色テーマと一致する色を使用する
 * - スクリーンリーダーユーザーのためにわかりやすいラベルを提供する
 * - ローディング中の状態を明示的に伝えるためにSpinnerの近くにテキストを配置する
 *
 * @dependencies
 * - Spinner.module.css: アニメーションとスタイルを提供するCSSモジュール
 */

import React, { useState, useEffect } from 'react';
import styles from './Spinner.module.css';
import { useLoadingState } from '../../hooks/useLoadingState';

/**
 * スピナーコンポーネントのプロップス
 *
 * @property size - スピナーのサイズ（small/medium/large）
 * @property color - スピナーの色（オプション）
 * @property className - 追加のCSSクラス名（オプション）
 * @property label - スクリーンリーダー用のアクセシビリティラベル
 * @property isLoading - ローディング状態（オプション）
 * @property isLoaded - ロード完了状態（オプション）
 * @property delayMs - 表示を遅延させる時間（オプション）
 * @property fadeDuration - フェードアウト時間（オプション）
 */
interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  label?: string;
  isLoading?: boolean;
  isLoaded?: boolean;
  delayMs?: number;
  fadeDuration?: number;
}

/**
 * スピナーコンポーネント
 *
 * ローディング状態を視覚的に表示するための回転するスピナーを提供します。
 * サイズ、色、ラベルをカスタマイズでき、アクセシビリティにも配慮しています。
 *
 * @param size - スピナーのサイズ（デフォルト: medium）
 * @param color - スピナーの色（オプション）
 * @param className - 追加のCSSクラス名
 * @param label - スクリーンリーダー用のテキスト
 * @param isLoading - ローディング状態（オプション）
 * @param isLoaded - ロード完了状態（オプション）
 * @param delayMs - 表示を遅延させる時間（オプション）
 * @param fadeDuration - フェードアウト時間（オプション）
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color,
  className = '',
  label = 'ローディング中',
  isLoading,
  isLoaded,
  delayMs = 0,
  fadeDuration = 300,
}) => {
  // 単純な遅延表示のためのフック
  const [shouldRender, setShouldRender] = useState(delayMs === 0);

  // useLoadingStateフックとの連携（オプショナル）
  const { isVisible, isFading } =
    isLoading !== undefined && isLoaded !== undefined
      ? useLoadingState(isLoading, isLoaded, fadeDuration)
      : { isVisible: true, isFading: false };

  // 遅延表示のための効果
  useEffect(() => {
    if (delayMs > 0) {
      const timer = setTimeout(() => setShouldRender(true), delayMs);
      return () => clearTimeout(timer);
    }
  }, [delayMs]);

  // ローディング状態と遅延表示の両方に基づいてレンダリングを決定
  if (!isVisible || !shouldRender) return null;

  return (
    <div
      className={`${styles.spinner} ${styles[size]} ${isFading ? styles.fading : ''} ${className}`}
      style={color ? { borderTopColor: color } : undefined}
      aria-hidden="true"
      role="presentation"
      data-testid="spinner"
    >
      <span className={styles.visuallyHidden}>{label}</span>
    </div>
  );
};

// 明示的な表示名を設定
Spinner.displayName = 'Spinner';

export default React.memo(Spinner);
