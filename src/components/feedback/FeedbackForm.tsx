import emailjs from '@emailjs/browser';
import React, { useState } from 'react';
import './FeedbackForm.css';

interface FeedbackFormProps {
  onClose: () => void;
}

interface TemplateParams {
  [key: string]: unknown;
  name: string;
  email: string;
  message: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!message.trim()) {
      setError('メッセージを入力してください。');
      return false;
    }

    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('有効なメールアドレスを入力してください。');
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
    } catch (err) {
      setError('送信に失敗しました。もう一度お試しください。');
      console.error('Feedback submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label htmlFor="email">
            メール:
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label htmlFor="message">
            メッセージ:
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
