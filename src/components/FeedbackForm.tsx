import emailjs from '@emailjs/browser';
import React, { useState } from 'react';
import { ERROR_MESSAGES } from '../constants';
import type { FeedbackFormProps, TemplateParams } from '../types/types';

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
    isSubmitted: false,
    error: '',
    isLoading: false
  });

  const { name, email, message, isSubmitted, error, isLoading } = formState;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState(prev => ({ ...prev, [id]: value, error: '' }));
  };

  const validateForm = () => {
    if (!name.trim()) {
      setFormState(prev => ({ ...prev, error: ERROR_MESSAGES.FORM.EMPTY_NAME }));
      return false;
    }
    if (!message.trim()) {
      setFormState(prev => ({ ...prev, error: ERROR_MESSAGES.FORM.EMPTY_MESSAGE }));
      return false;
    }
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setFormState(prev => ({ ...prev, error: ERROR_MESSAGES.FORM.INVALID_EMAIL }));
      return false;
    }
    return true;
  };

  const sendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY } = import.meta.env;
      
      const templateParams: TemplateParams = {
        name: name || '匿名',
        email: email || '未入力',
        message: message || '未入力',
      };

      await emailjs.send(
        VITE_EMAILJS_SERVICE_ID,
        VITE_EMAILJS_TEMPLATE_ID,
        templateParams as Record<string, unknown>,
        VITE_EMAILJS_PUBLIC_KEY
      );

      setFormState({
        name: '',
        email: '',
        message: '',
        isSubmitted: true,
        error: '',
        isLoading: false
      });
    } catch {
      setFormState(prev => ({ 
        ...prev, 
        error: ERROR_MESSAGES.FORM.SUBMISSION_FAILED,
        isLoading: false 
      }));
    }
  };

  return (
    <div role="dialog" aria-labelledby="feedback-title">
      <button onClick={onClose} aria-label="閉じる">×</button>
      
      {isSubmitted ? (
        <div role="alert">フィードバックを送信しました。ありがとうございます。</div>
      ) : (
        <form onSubmit={sendFeedback} noValidate>
          <h2 id="feedback-title">フィードバック</h2>
          {error && <div role="alert">{error}</div>}

          <label htmlFor="name">
            名前:
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleInputChange}
              aria-label="名前"
            />
          </label>

          <label htmlFor="email">
            メール:
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleInputChange}
              aria-label="メール"
            />
          </label>

          <label htmlFor="message">
            メッセージ:
            <textarea
              id="message"
              value={message}
              onChange={handleInputChange}
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