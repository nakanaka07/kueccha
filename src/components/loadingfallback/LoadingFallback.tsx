import React, { useEffect, useState } from 'react'; // Reactとフックをインポート
import type { LoadingFallbackProps } from '../../utils/types'; // 型定義をインポート
import { ERROR_MESSAGES } from '../../utils/constants'; // エラーメッセージをインポート
import './LoadingFallback.css'; // スタイルをインポート

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ isLoading, isLoaded }) => {
  const [isVisible, setIsVisible] = useState(isLoading); // ローディング状態を管理するローカルステート

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        setIsVisible(false); // ローディングが完了したら非表示にする
      }, 5000);
      return () => clearTimeout(timer); // クリーンアップ関数でタイマーをクリア
    }
  }, [isLoaded]); // isLoadedが変更されたときに実行

  if (!isVisible) return null; // 非表示の場合は何もレンダリングしない

  return (
    <div
      className={`loading-fallback ${isLoaded ? 'hidden' : ''}`} // ローディングが完了したらhiddenクラスを追加
      role="status"
      aria-live="polite"
    >
      <div className="loading-content">
        <div className="loading-spinner" aria-hidden="true" /> {/* ローディングスピナー */}
        <p>{ERROR_MESSAGES.LOADING.DATA}</p> {/* ローディングメッセージ */}
      </div>
    </div>
  );
};

LoadingFallback.displayName = 'LoadingFallback'; // コンポーネントの表示名を設定

export { LoadingFallback };
export default LoadingFallback;
