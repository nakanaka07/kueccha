import React, { useState } from 'react';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
import './FeedbackForm.css';

const FeedbackForm: React.FC = () => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const templateParams: Record<string, string> = {
      feedback,
      email,
      to_email: 'int_survey01@outlook.jp',
      from_name: 'yuichiro',
      reply_to: email,
    };

    emailjs
      .send(
        process.env.VITE_EMAILJS_SERVICE_ID!,
        process.env.VITE_EMAILJS_TEMPLATE_ID!,
        templateParams,
        process.env.VITE_EMAILJS_PUBLIC_KEY!,
      )
      .then(
        (response: EmailJSResponseStatus) => {
          console.log('SUCCESS!', response.status, response.text);
          setSubmitted(true);
        },
        (err: EmailJSResponseStatus) => {
          console.error('FAILED...', err);
        },
      );
  };

  return (
    <div className="feedbackform-container">
      <button onClick={() => setIsFeedbackFormOpen(!isFeedbackFormOpen)} className="common-button">
        フィードバック
      </button>
      {isFeedbackFormOpen && (
        <div role="region" aria-label="フィードバックフォーム" className="feedback-panel">
          {submitted ? (
            <div className="feedback-thank-you">
              <p>フィードバックを送信しました。ありがとうございます！</p>
            </div>
          ) : (
            <form className="feedback-form" onSubmit={handleSubmit}>
              <h2>フィードバックを送信</h2>
              <div className="form-group">
                <label htmlFor="feedback">フィードバック:</label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">メールアドレス (任意):</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit">送信</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackForm;