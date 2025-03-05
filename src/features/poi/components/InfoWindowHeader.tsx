// components/InfoWindowHeader.tsx
import React from 'react';
import styles from './InfoWindow.module.css';

interface InfoWindowHeaderProps {
  title: string;
  onClose: () => void;
}

export const InfoWindowHeader: React.FC<InfoWindowHeaderProps> = ({ title, onClose }) => {
  return (
    <div className={styles.infoHeader}>
      <h2 id="info-window-title">{title}</h2>
      <button
        onClick={onClose}
        aria-label="閉じる"
        className={styles.modalCloseButton}
        title="閉じます。"
      >
        ×
      </button>
    </div>
  );
};