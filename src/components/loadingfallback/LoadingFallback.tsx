import React, { useEffect, useState } from 'react';
import type { LoadingFallbackProps } from '../../utils/types';
import { ERROR_MESSAGES } from '../../utils/constants';
import './LoadingFallback.css'; // スタイルシートをインポート

// LoadingFallbackコンポーネントの定義
const LoadingFallback = ({ isLoading }: LoadingFallbackProps) => {
  const [isVisible, setIsVisible] = useState(isLoading);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 1000); // 1秒後にフェードアウト
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // ローディング中でない場合は何も表示しない
  if (!isVisible) return null;

  // ローディング中の場合の表示
  return (
    <div
      className={`loading-fallback ${!isLoading ? 'hidden' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-content">
        <div className="loading-spinner" aria-hidden="true" />
        <p>{ERROR_MESSAGES.LOADING.DATA}</p>
      </div>
    </div>
  );
};

// コンポーネントの表示名を設定
LoadingFallback.displayName = 'LoadingFallback';

export { LoadingFallback };
export default LoadingFallback;
