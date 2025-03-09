/*
 * 機能: フィードバックフォームのコンテナコンポーネント。状態管理とUIの連携を担当
 * 依存関係:
 *   - React
 *   - FeedbackFormUI: 表示用コンポーネント
 *   - FeedbackSuccess: 成功メッセージコンポーネント
 *   - useFeedbackForm: フォームロジックを管理するカスタムフック
 *   - FeedbackForm.module.css: スタイル定義
 * 注意点:
 *   - ダイアログとして実装されており、アクセシビリティ属性（role="dialog"）を使用
 *   - 送信状態に応じてFeedbackFormUIまたはFeedbackSuccessを表示
 *   - 閉じるボタンが含まれており、親コンポーネントからonClose関数を受け取る必要がある
 */

import React from 'react';
import styles from './FeedbackForm.module.css';
import { FeedbackFormUI } from './FeedbackFormUI';
import { FeedbackSuccess } from './FeedbackSuccess';
import { useFeedbackForm } from '../hooks/useFeedbackForm';
import type { FeedbackFormProps } from '../../../core/types/feedback';

const FeedbackFormContainer: React.FC<FeedbackFormProps> = ({ onClose }) => {
  const { name, email, message, isSubmitted, error, isLoading, setName, setEmail, setMessage, sendFeedback } =
    useFeedbackForm();

  return (
    <div className={styles.feedbackFormWrapper} role="dialog" aria-labelledby="feedback-title">
      <button className={styles.closeButton} onClick={onClose} aria-label="閉じる">
        ×
      </button>

      {isSubmitted ? (
        <FeedbackSuccess />
      ) : (
        <FeedbackFormUI
          name={name}
          email={email}
          message={message}
          error={error}
          isLoading={isLoading}
          onNameChange={setName}
          onEmailChange={setEmail}
          onMessageChange={setMessage}
          onSubmit={sendFeedback}
        />
      )}
    </div>
  );
};

export default FeedbackFormContainer;
