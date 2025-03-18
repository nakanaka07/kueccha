import React from 'react';

import { MapErrorProps } from '../types/types';

export const MapError: React.FC<MapErrorProps> = ({ message, onRetry }) => {
  return (
    <div role="alert" aria-live="assertive">
      <div>
        <h2>地図の読み込みに失敗しました</h2>
        <p>{message}</p>
        <p>インターネット接続を確認し、再度お試しください。</p>
        {onRetry && (
          <button onClick={onRetry} aria-label="再読み込み">
            再読み込み
          </button>
        )}
      </div>
    </div>
  );
};

export default MapError;
