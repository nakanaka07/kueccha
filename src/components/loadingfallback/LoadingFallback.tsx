/**
 * LoadingFallback.tsx
 *
 * このファイルはアプリケーション内でのデータ読み込み中や処理中に表示される
 * ローディングインジケーターを提供するコンポーネントを定義しています。
 * ユーザーに対してシステムが処理中であることを視覚的に伝えます。
 */

// React本体と状態管理のためのフックをインポート
import React, { useEffect, useState } from 'react';
// コンポーネントのスタイルをインポート
import './LoadingFallback-module.css';
// エラーメッセージの定数をインポート（デフォルトメッセージとして使用）
import { ERROR_MESSAGES } from '../../utils/constants';
// このコンポーネントのProps型定義をインポート
import type { LoadingFallbackProps } from '../../utils/types';

/**
 * ローディング状態を表示するフォールバックコンポーネント
 *
 * @param isLoading - 現在ローディング中かどうかを示すブール値
 * @param isLoaded - ローディングが完了したかどうかを示すブール値
 * @param message - 表示するメッセージ。デフォルトではERROR_MESSAGES.LOADING.DATAが使用される
 * @param fadeDuration - フェードアウトにかかる時間（ミリ秒）、デフォルトは3000ms（3秒）
 */
const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  isLoading,
  isLoaded,
  message = ERROR_MESSAGES.LOADING.DATA, // デフォルトメッセージを設定
  fadeDuration = 3000, // フェードアウトの時間をデフォルト3秒に設定
}) => {
  // コンポーネントの可視性を管理する状態変数。初期値はisLoadingプロパティから設定
  const [isVisible, setIsVisible] = useState(isLoading);
  // フェードアウト中かどうかを管理する状態変数
  const [isFading, setIsFading] = useState(false);

  /**
   * ローディング状態の変更を監視し、コンポーネントの表示/非表示を制御するエフェクト
   * isLoadingとisLoadedの値に基づいて表示状態を更新する
   */
  useEffect(() => {
    if (!isLoading && isLoaded) {
      // ローディングが終了し、データが読み込まれた場合は3秒かけてフェードアウトし、その後非表示にする
      setIsFading(true);

      // フェードアウト後にコンポーネントを非表示にする
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsFading(false);
      }, fadeDuration);

      return () => clearTimeout(timer);
    } else {
      // それ以外の場合（ローディング中またはエラー時）は表示する
      setIsFading(false);
      setIsVisible(true);
    }
  }, [isLoaded, isLoading, fadeDuration]); // isLoadedとisLoadingの値が変更されたときに再評価

  // コンポーネントが非表示の場合は何もレンダリングしない
  if (!isVisible) return null;

  // ローディング表示のJSX構造
  return (
    // コンテナ要素 - フェードアウト中は 'fading' クラスを追加
    <div
      className={`loading-fallback ${isFading ? 'fading' : ''}`}
      style={isFading ? { animationDuration: `${fadeDuration}ms` } : undefined}
    >
      {/* ローディングの内容を中央に配置するコンテナ */}
      <div className="loading-content">
        {/* ローディングアニメーション用のスピナー要素 */}
        <div className="loading-spinner" aria-hidden="true" />
        {/* ローディングメッセージを表示する段落 */}
        <p>{message}</p>
      </div>
    </div>
  );
};

// React DevToolsでの識別用にコンポーネント名を明示的に設定
LoadingFallback.displayName = 'LoadingFallback';
// 名前付きエクスポートと、デフォルトエクスポートの両方を提供
export { LoadingFallback };
export default LoadingFallback;
