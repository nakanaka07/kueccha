import React, { useState } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { tourSteps } from '../../utils/tourSteps';
import './UserGuide.css';

const UserGuide: React.FC = () => {
  const [runTour, setRunTour] = useState(false);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
    }
  };

  return (
    <div className="userguide-container">
      <button className="common-button" onClick={() => setRunTour(true)}>
        ツアーを開始
      </button>
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
          overlay: {
            backgroundColor: 'transparent', // オーバーレイを透明にする
            display: 'none', // オーバーレイを非表示にする
          },
        }}
      />
    </div>
  );
};

export default UserGuide;
