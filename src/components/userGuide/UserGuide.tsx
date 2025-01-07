import React, { useState } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import FeedbackForm from '../feedback/FeedbackForm';
import { tourSteps } from '../../tourSteps';

const UserGuide: React.FC = () => {
  const [runTour, setRunTour] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
    }
  };

  return (
    <>
      <div className="button-container">
        <button onClick={() => setRunTour(true)} className="tour-button">
          ツアーを開始
        </button>
        <button onClick={() => setShowFeedback(true)} className="feedback-button">
          フィードバック
        </button>
      </div>
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            zIndex: 10000,
          },
        }}
      />
      {showFeedback && <FeedbackForm onClose={() => setShowFeedback(false)} />}
    </>
  );
};

export default UserGuide;
