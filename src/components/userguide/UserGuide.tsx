import React from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { tourSteps } from '../../utils/tourSteps';
import './UserGuide.css';

interface UserGuideProps {
  runTour: boolean;
  setRunTour: (run: boolean) => void;
}

const UserGuide: React.FC<UserGuideProps> = ({ runTour, setRunTour }) => {
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
    }
  };

  return (
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
  );
};

export default UserGuide;
