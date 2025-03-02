import React, { useState, useEffect } from 'react';
import styles from './Spinner.module.css';
import { useLoadingState } from '../../hooks/useLoadingState';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  label?: string;
  isLoading?: boolean;
  isLoaded?: boolean;
  delayMs?: number;
  fadeDuration?: number;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color,
  className = '',
  label = 'ローディング中',
  isLoading,
  isLoaded,
  delayMs = 0,
  fadeDuration = 300,
}) => {
  const [shouldRender, setShouldRender] = useState(delayMs === 0);

  const { isVisible, isFading } =
    isLoading !== undefined && isLoaded !== undefined
      ? useLoadingState(isLoading, isLoaded, fadeDuration)
      : { isVisible: true, isFading: false };

  useEffect(() => {
    if (delayMs > 0) {
      const timer = setTimeout(() => setShouldRender(true), delayMs);
      return () => clearTimeout(timer);
    }
  }, [delayMs]);

  if (!isVisible || !shouldRender) return null;

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

Spinner.displayName = 'Spinner';

export default React.memo(Spinner);
