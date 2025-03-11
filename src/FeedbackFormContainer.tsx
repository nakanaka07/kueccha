import React from 'react';
import { FeedbackFormUI } from './FeedbackFormUI';
import { FeedbackSuccess } from './FeedbackSuccess';
import { useFeedbackForm } from './useFeedbackForm';
import type { FeedbackFormProps } from '@/feedback';

const FeedbackFormContainer: React.FC<FeedbackFormProps> = ({ onClose }) => {
  const { name, email, message, isSubmitted, error, isLoading, setName, setEmail, setMessage, sendFeedback } =
    useFeedbackForm();

  return (
    <div role="dialog" aria-labelledby="feedback-title">
      <button onClick={onClose} aria-label="閉じる">
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
