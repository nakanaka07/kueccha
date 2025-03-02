import React, { useState, useEffect } from 'react';
import styles from './LocationWarning.module.css';
import type { LocationWarningProps } from '../../utils/types';

const LocationWarning: React.FC<LocationWarningProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div className={`${styles.locationWarning} ${!isVisible ? styles.hidden : ''}`}>
      <button
        className={styles.closeButton}
        onClick={() => {
          setIsVisible(false);
        }}
        aria-label="警告メッセージを閉じる"
      >
        ×
      </button>

      <div className={styles.message}>
        ブラウザ環境によっては正しい位置情報を取得できない場合がございます。 ご了承ください。
      </div>
    </div>
  );
};

export default LocationWarning;
