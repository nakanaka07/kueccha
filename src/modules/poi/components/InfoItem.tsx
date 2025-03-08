/*
 * 機能: 情報ウィンドウ内の個別情報項目を表示するコンポーネント
 * 依存関係:
 *   - React
 *   - InfoWindow.module.css (スタイリング)
 * 注意点:
 *   - タイトル付きまたはタイトルなしのコンテンツに対応
 *   - 内容はReactNodeとして柔軟に指定可能
 */

import React, { ReactNode } from 'react';
import styles from './InfoWindow.module.css';

interface InfoItemProps {
  title?: string;
  content: ReactNode;
}

export const InfoItem: React.FC<InfoItemProps> = ({ title, content }) => {
  return (
    <div className={styles.infoSection}>
      {title && <h3>{title}</h3>}
      {content}
    </div>
  );
};
