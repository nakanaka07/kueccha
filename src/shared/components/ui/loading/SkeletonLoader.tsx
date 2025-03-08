/*
 * 機能: コンテンツ読み込み中に表示するスケルトンローダーコンポーネント
 * 依存関係:
 *   - React
 *   - SkeletonLoader.module.cssスタイルシート
 * 注意点:
 *   - 複数のタイプ（rectangle, circle, text）をサポートしています
 *   - width, heightプロパティでサイズをカスタマイズ可能
 *   - countプロパティで複数のスケルトン要素を一度に生成できます
 */
import React from 'react';
import styles from './SkeletonLoader.module.css';

export interface SkeletonLoaderProps {
  type: 'rectangle' | 'circle' | 'text';
  width?: string;
  height?: string;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, width = '100%', height = '20px', count = 1 }) => {
  const items = Array(count)
    .fill(0)
    .map((_, index) => (
      <div key={index} className={`${styles.skeleton} ${styles[type]}`} style={{ width, height }} aria-hidden="true" />
    ));

  return <>{items}</>;
};

export default SkeletonLoader;
