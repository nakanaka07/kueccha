// FeedbackFormUI.tsx
import React from 'react';
import styles from './FeedbackForm.module.css';

interface FeedbackFormUIProps {
  name: string;
  email: string;
  message: string;
  error: string;
  isLoading: boolean;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const FeedbackFormUI: React.FC<FeedbackFormUIProps> = ({
  name,
  email,
  message,
  error,
  isLoading,
  onNameChange,
  onEmailChange,
  onMessageChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} noValidate>
      <h2 id="feedback-title">フィードバック</h2>
      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
      <label htmlFor="name">
        名前:
        <input
          id="name"
          type="text"
          value={name}
          onChange={onNameChange}
          aria-label="名前"
        />
      </label>
      <label htmlFor="email">
        メール:
        <input
          id="email"
          type="email"
          value={email}
          onChange={onEmailChange}
          aria-label="メール"
        />
      </label>
      <label htmlFor="message">
        メッセージ:
        <textarea
          id="message"
          value={message}
          onChange={onMessageChange}
          aria-label="メッセージ"
        />
      </label>
      <button type="submit" disabled={isLoading}>
        {isLoading ? '送信中...' : '送信'}
      </button>
    </form>
  );
};