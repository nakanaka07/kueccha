import emailjs from '@emailjs/browser';
import React, { useState, useEffect } from 'react';
import './FeedbackForm.css';
import { ERROR_MESSAGES } from '../../utils/constants';
import type { FeedbackFormProps, TemplateParams } from '../../utils/types';

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!message.trim()) {
      setError(ERROR_MESSAGES.FORM.EMPTY_MESSAGE);
      console.log('Validation failed: empty message'); // ログ出力を追加
      return false;
    }

    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError(ERROR_MESSAGES.FORM.INVALID_EMAIL);
      console.log('Validation failed: invalid email'); // ログ出力を追加
      return false;
    }

    setError('');
    return true;
  };

  const sendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    console.log('Sending feedback...'); // ログ出力を追加

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
      console.log('Feedback sent successfully'); // ログ出力を追加
    } catch (err) {
      setError(ERROR_MESSAGES.FORM.SUBMISSION_FAILED);
      console.error('Feedback submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSubmitted) {
      setName('');
      setEmail('');
      setMessage('');
      console.log('Form reset after submission'); // ログ出力を追加
    }
  }, [isSubmitted]);

  return (
    <div
      className="feedback-form-wrapper"
      role="dialog"
      aria-labelledby="feedback-title"
    >
      <button className="close-button" onClick={onClose} aria-label="閉じる">
        ×
      </button>
      {isSubmitted ? (
        <div role="alert">
          フィードバックを送信しました。ありがとうございます。
        </div>
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
