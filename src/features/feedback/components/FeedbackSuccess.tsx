// FeedbackSuccess.tsx
import React from 'react';
import styles from './FeedbackForm.module.css';

export const FeedbackSuccess: React.FC = () => {
  return (
    <div className={styles.successMessage} role="alert">
      フィードバックを送信しました。ありがとうございます。
    </div>
  );
};