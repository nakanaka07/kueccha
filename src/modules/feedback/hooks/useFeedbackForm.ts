import emailjs from '@emailjs/browser';
import { useState, useEffect } from 'react';
import { ERROR_MESSAGES } from '../../../core/constants/messages';
import type { TemplateParams } from '../../../core/types/feedback';

export function useFeedbackForm() {
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

  const handleChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(e.target.value);
      setError('');
    };

  return {
    name,
    email,
    message,
    isSubmitted,
    error,
    isLoading,
    setName: handleChange(setName),
    setEmail: handleChange(setEmail),
    setMessage: handleChange(setMessage),
    sendFeedback,
  };
}
