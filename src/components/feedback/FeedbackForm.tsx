import React, { useState } from 'react';
import '../../App.css';

const FeedbackForm: React.FC = () => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // フィードバックの送信処理をここに追加
    console.log('Feedback submitted:', { feedback, email });
    setSubmitted(true);
  };

  return (
    <div className="feedback-form-container">
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
  );
};

export default FeedbackForm;
