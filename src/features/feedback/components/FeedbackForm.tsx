import emailjs from '@emailjs/browser';
import React, { useState, useEffect } from 'react';
import styles from './FeedbackForm.module.css';
import { ERROR_MESSAGES } from '../../../constants/messages';
import type { FeedbackFormProps, TemplateParams } from '../../../types/feedback';

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      setError(ERROR_MESSAGES.FORM.EMPTY_NAME);
      return false;
    }

    if (!message.trim()) {
      setError(ERROR_MESSAGES.FORM.EMPTY_MESSAGE);
      return false;
    }

    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError(ERROR_MESSAGES.FORM.INVALID_EMAIL);
      return false;
    }

    setError('');
    return true;
  };

  const sendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const templateParams: TemplateParams = {
        name: name || '匿名',
        email: email || '未入力',
        message: message || '未入力',
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams as Record<string, unknown>,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      );

      setIsSubmitted(true);
      setError('');
    } catch {
      setError(ERROR_MESSAGES.FORM.SUBMISSION_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSubmitted) {
      setName('');
      setEmail('');
      setMessage('');
    }
  }, [isSubmitted]);

  return (
    <div className={styles.feedbackFormWrapper} role="dialog" aria-labelledby="feedback-title">
      <button className="close-button" onClick={onClose} aria-label="閉じる">
        ×
      </button>
      {isSubmitted ? (
        <div role="alert">フィードバックを送信しました。ありがとうございます。</div>
      ) : (
        <form onSubmit={sendFeedback} noValidate>
          <h2 id="feedback-title">フィードバック</h2>
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          <label htmlFor="name">
            名前:
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              aria-label="名前"
            />
          </label>
          <label htmlFor="email">
            メール:
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              aria-label="メール"
            />
          </label>
          <label htmlFor="message">
            メッセージ:
            <textarea
              id="message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError('');
              }}
              aria-label="メッセージ"
            />
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? '送信中...' : '送信'}
          </button>
        </form>
      )}
    </div>
  );
};

export default FeedbackForm;
