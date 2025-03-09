/*
 * 機能: 位置情報の制限に関する警告メッセージを表示するプレゼンテーショナルコンポーネント
 * 依存関係:
 *   - React (useState, useEffectフック)
 *   - LocationWarning.module.css スタイルシート
 *   - LocationWarningProps型 ('../../types/feedback'から)
 * 注意点:
 *   - 閉じる時にフェードアウトアニメーションを実行（300ms）
 *   - onClosプロパティとしてコールバック関数が必要
 *   - アクセシビリティ対応のaria-label属性を含む
 */
import React, { useState, useEffect } from 'react';
import styles from './LocationWarning.module.css';

interface LocationWarningProps {
  onClose: () => void;
}

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
        環境によっては正しい位置情報を取得できない場合がございます。 ご了承ください。
      </div>
    </div>
  );
};

export { LocationWarning };
export default LocationWarning;
