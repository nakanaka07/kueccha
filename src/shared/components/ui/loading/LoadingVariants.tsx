/*
 * 機能: 異なるタイプのローディング表示を提供するコンポーネント
 * 依存関係:
 *   - React
 *   - LoadingFallback.module.cssスタイルシート
 *   - SkeletonLoaderコンポーネント
 *   - Spinnerコンポーネント
 * 注意点:
 *   - 3つの表示バリエーション（spinner, skeleton, progress）をサポート
 *   - 各バリアントにはメッセージを表示可能
 *   - spinnerClassNameでスピナーのスタイルをカスタマイズ可能
 */
import React from 'react';
import styles from './LoadingFallback.module.css';
import { SkeletonLoader } from './SkeletonLoader';
import { Spinner } from './SpinnerController';

interface LoadingVariantProps {
  variant: 'spinner' | 'skeleton' | 'progress';
  message: string;
  spinnerClassName?: string;
}

export const LoadingVariant: React.FC<LoadingVariantProps> = ({ variant, message, spinnerClassName = '' }) => {
  if (variant === 'spinner') {
    return (
      <>
        <Spinner size="large" className={`${styles.spinnerMargin} ${spinnerClassName}`} />
        <p>{message}</p>
      </>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={styles.skeletonContainer}>
        <SkeletonLoader type="rectangle" width="100%" height="20px" count={3} />
      </div>
    );
  }

  if (variant === 'progress') {
    return (
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div className={styles.progressIndicator} />
        </div>
        <p>{message}</p>
      </div>
    );
  }

  return null;
};
