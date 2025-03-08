/*
 * 機能: 情報ウィンドウのヘッダー部分を表示するReactコンポーネント
 * 依存関係:
 *   - React
 *   - InfoWindow.module.css (スタイリング)
 * 注意点:
 *   - タイトルと閉じるボタンを含む
 *   - アクセシビリティ対応のためのaria属性を実装
 */

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
      <button onClick={onClose} aria-label="閉じる" className={styles.modalCloseButton} title="閉じます。">
        ×
      </button>
    </div>
  );
};
