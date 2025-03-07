import React from 'react';
import styles from './Map.module.css';
import { MapErrorProps } from '../../../types/map';

export const MapError: React.FC<MapErrorProps> = ({ message, details, onRetry }) => {
  return (
    <div className={styles.mapError} role="alert" aria-live="assertive">
      <div className={styles.errorContainer}>
        <h2 className={styles.errorTitle}>地図の読み込みに失敗しました</h2>
        <p className={styles.errorContent}>{message}</p>
        <p className={styles.errorContent}>{details || 'インターネット接続を確認し、再度お試しください。'}</p>
        {onRetry && (
          <button onClick={onRetry} className={styles.retryButton} aria-label="再読み込み">
            再読み込み
          </button>
        )}
      </div>
    </div>
  );
};

export default MapError;
