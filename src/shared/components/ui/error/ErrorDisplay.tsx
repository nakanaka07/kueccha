/*
 * 機能: エラーメッセージとリトライボタンを表示するコンポーネント
 * 依存関係:
 *   - React
 *   - LoadingFallback.module.cssスタイルシート
 * 注意点:
 *   - onRetryプロパティが提供されていない場合、リトライボタンは表示されません
 */
import React from 'react';
import styles from './LoadingFallback.module.css';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon} aria-hidden="true" />
      <p>{message}</p>
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          再試行
        </button>
      )}
    </div>
  );
};
