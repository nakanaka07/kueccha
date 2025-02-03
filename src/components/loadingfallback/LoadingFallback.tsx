import React, { useEffect, useState } from 'react'; // Reactと必要なフックをインポート
import type { LoadingFallbackProps } from '../../utils/types'; // LoadingFallbackProps型をインポート
import { ERROR_MESSAGES } from '../../utils/constants'; // エラーメッセージ定数をインポート
import './LoadingFallback.css'; // スタイルシートをインポート

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  isLoading,
  isLoaded,
}) => {
  const [isVisible, setIsVisible] = useState(isLoading); // ローディングフォールバックの表示状態を管理するステート

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        setIsVisible(false); // ロード完了後2秒後に非表示に設定
      }, 2000);
      return () => clearTimeout(timer); // クリーンアップ関数でタイマーをクリア
    } else {
      setIsVisible(isLoading); // ロード中の場合は表示状態を更新
    }
  }, [isLoaded, isLoading]); // isLoadedとisLoadingが変更されたときに実行

  if (!isVisible) return null; // 非表示の場合はnullを返す

  return (
    <div
      className={`loading-fallback ${isLoaded ? 'hidden' : ''}`} // ロード完了後にhiddenクラスを追加
      role="status"
      aria-live="polite"
    >
      <div className="loading-content">
        <div className="loading-spinner" aria-hidden="true" />{' '}
        {/* ローディングスピナーを表示 */}
        <p>{ERROR_MESSAGES.LOADING.DATA}</p>{' '}
        {/* ローディングメッセージを表示 */}
      </div>
    </div>
  );
};

LoadingFallback.displayName = 'LoadingFallback'; // コンポーネントの表示名を設定

export { LoadingFallback }; // LoadingFallbackコンポーネントをエクスポート
export default LoadingFallback; // デフォルトエクスポート
