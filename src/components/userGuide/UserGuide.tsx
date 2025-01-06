import React, { useState } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { tourSteps } from '../../tourSteps';

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
    <>
      <button onClick={() => setRunTour(true)}>ツアーを開始</button>
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
    </>
  );
};

export default UserGuide;
