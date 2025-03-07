// components/MapLoading.tsx
import React from 'react';
import styles from './Map.module.css';

const LOADING_ARIA_LABEL = '地図読み込み中';

const MapLoading: React.FC = () => {
  return (
    <div className={styles.loadingContainer} aria-label={LOADING_ARIA_LABEL} role="progressbar" aria-busy="true">
      マップを読み込み中...
    </div>
  );
};

export default MapLoading;
