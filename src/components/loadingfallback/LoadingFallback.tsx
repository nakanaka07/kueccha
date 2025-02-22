// Reactと必要なフックをインポート
import React, { useEffect, useState } from 'react';
// CSSファイルをインポート
import './LoadingFallback.css';
// エラーメッセージ定数をインポート
import { ERROR_MESSAGES } from '../../utils/constants';
// 型定義をインポート
import type { LoadingFallbackProps } from '../../utils/types';

// LoadingFallbackコンポーネントを定義
const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  isLoading, // ローディング状態を示すプロパティ
  isLoaded, // ロード完了状態を示すプロパティ
  message = ERROR_MESSAGES.LOADING.DATA, // デフォルトのエラーメッセージ
}) => {
  // ローディングメッセージの表示状態を管理する状態変数
  const [isVisible, setIsVisible] = useState(isLoading);

  // isLoadingとisLoadedの変更時に実行されるuseEffectフック
  useEffect(() => {
    console.log('LoadingFallback state:', { isLoading, isLoaded });
    let timer: NodeJS.Timeout;
    // ロードが完了した場合、2秒後にメッセージを非表示にする
    if (isLoaded) {
      timer = setTimeout(() => {
        setIsVisible(false);
        console.log('LoadingFallback hidden');
      }, 2000);
    } else {
      // ロード中の場合、メッセージを表示する
      setIsVisible(isLoading);
    }
    // クリーンアップ関数でタイマーをクリア
    return () => clearTimeout(timer);
  }, [isLoaded, isLoading]); // isLoadedとisLoadingが変更されるたびに実行

  // メッセージが非表示の場合、nullを返す
  if (!isVisible) return null;

  return (
    // ローディングメッセージのコンテナ
    <div
      className={`loading-fallback ${isLoaded ? 'hidden' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-content">
        {/* ローディングスピナー */}
        <div className="loading-spinner" aria-hidden="true" />
        {/* エラーメッセージ */}
        <p>{message}</p>
        {/* ローディング中のメッセージ */}
        <p>
          しばらくお待ちください。ロードが完了しない場合は、ページをリロードしてください。
        </p>
      </div>
    </div>
  );
};

// コンポーネントの表示名を設定
LoadingFallback.displayName = 'LoadingFallback';

// コンポーネントをエクスポート
export { LoadingFallback };
export default LoadingFallback;
