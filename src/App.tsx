import React from 'react';

import { ErrorBoundary } from './components/ErrorBoundary';
import Map from './components/map/Map';

const App: React.FC = () => {
  const handleMapLoad = (mapInstance: google.maps.Map | null) => {
    if (mapInstance) {
      console.log('Map loaded successfully');
    }
  };

  return (
    <div className="app-container">
      <ErrorBoundary fallback={<div>マップの読み込みに失敗しました</div>}>
        <Map onLoad={handleMapLoad} />
      </ErrorBoundary>
    </div>
  );
};

export default App;
