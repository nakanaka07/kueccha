/*
 * 機能: ローディングスピナーの視覚的表現を担当するプレゼンテーショナルコンポーネント
 * 依存関係:
 *   - React
 *   - SpinnerView.module.cssスタイルシート
 * 注意点:
 *   - このコンポーネントは表示ロジックのみを担当し、表示タイミングなどの制御は行いません
 *   - アクセシビリティのために適切なaria属性と非表示ラベルを含んでいます
 */
import React from 'react';
import styles from './SpinnerView.module.css';

interface SpinnerViewProps {
  size: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  label: string;
  isFading: boolean;
}

export const SpinnerView: React.FC<SpinnerViewProps> = ({ size, color, className = '', label, isFading }) => {
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
