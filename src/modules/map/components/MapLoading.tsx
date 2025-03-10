import React from 'react';

const LOADING_ARIA_LABEL = '地図読み込み中';

const MapLoading: React.FC = () => {
  return (
    <div aria-label={LOADING_ARIA_LABEL} role="progressbar" aria-busy="true">
      マップを読み込み中...
    </div>
  );
};

export default MapLoading;
