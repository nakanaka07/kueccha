import React from 'react';
import type { LoadingFallbackProps } from '../../../types';
import { ERROR_MESSAGES } from '../../../constants';
import '../../../App.css'; // スタイルシートをインポート

// LoadingFallbackコンポーネントの定義
const LoadingFallback = ({ isLoading }: LoadingFallbackProps) => {
  // ローディング中でない場合は何も表示しない
  if (!isLoading) return null;

  // ローディング中の場合の表示
  return (
    <div className="loading-fallback">
      <div className="loading-content">
        <div className="loading-spinner" />
        <p>{ERROR_MESSAGES.LOADING.DATA}</p>
      </div>
    </div>
  );
};

// コンポーネントの表示名を設定
LoadingFallback.displayName = 'LoadingFallback';

export { LoadingFallback };
export default LoadingFallback;
