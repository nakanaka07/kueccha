import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import './FeedbackForm.css';

interface FeedbackFormProps {
  onClose: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const sendFeedback = (e: React.FormEvent) => {
    e.preventDefault();

    const templateParams = {
      name: name || '匿名',
      email: email || '未入力',
      message: message || '未入力',
    };

    emailjs
      .send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      )
      .then(
        (response) => {
          console.log('SUCCESS!', response.status, response.text);
          setIsSubmitted(true);
        },
        (error) => {
          console.error('FAILED...', error);
          setError('送信に失敗しました。もう一度お試しください。');
        },
      );
  };

  return (
    <div className="feedback-form-wrapper">
      <button className="close-button" onClick={onClose}>
        ×
      </button>
      {isSubmitted ? (
        <div>フィードバックを送信しました。ありがとうございます。</div>
      ) : (
        <form onSubmit={sendFeedback}>
          {error && <div className="error-message">{error}</div>}
          <label>
            名前:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            メール:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            メッセージ:
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <button type="submit">送信</button>
        </form>
      )}
    </div>
  );
};

export default FeedbackForm;
