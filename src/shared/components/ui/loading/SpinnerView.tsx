// SpinnerView.tsx
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
