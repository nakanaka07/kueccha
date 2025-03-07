// components/InfoItem.tsx
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
