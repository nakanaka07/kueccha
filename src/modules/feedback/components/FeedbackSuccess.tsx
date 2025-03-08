/*
 * 機能: フィードバック送信成功時に表示するメッセージコンポーネント
 * 依存関係:
 *   - React
 *   - FeedbackForm.module.css スタイルシート
 * 注意点:
 *   - アクセシビリティのために role="alert" 属性を使用
 *   - スタイルは外部CSSモジュールに依存
 */

import React from 'react';
import styles from './FeedbackForm.module.css';

export const FeedbackSuccess: React.FC = () => {
  return (
    <div className={styles.successMessage} role="alert">
      フィードバックを送信しました。ありがとうございます。
    </div>
  );
};
