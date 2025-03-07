// FeedbackFormContainer.tsx
import React from 'react';
import styles from './FeedbackForm.module.css';
import { FeedbackFormUI } from './FeedbackFormUI';
import { FeedbackSuccess } from './FeedbackSuccess';
import { useFeedbackForm } from '../hooks/useFeedbackForm';
import type { FeedbackFormProps } from '../../../types/feedback';

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
