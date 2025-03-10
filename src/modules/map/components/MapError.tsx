import React from 'react';
import { MapErrorProps } from '../../../core/types/map';

export const MapError: React.FC<MapErrorProps> = ({ message, details, onRetry }) => {
  return (
    <div className="mapError" role="alert" aria-live="assertive">
      <div className="errorContainer">
        <h2 className="errorTitle">地図の読み込みに失敗しました</h2>
        <p className="errorContent">{message}</p>
        <p className="errorContent">{details || 'インターネット接続を確認し、再度お試しください。'}</p>
        {onRetry && (
          <button onClick={onRetry} className="retryButton" aria-label="再読み込み">
            再読み込み
          </button>
        )}
      </div>
    </div>
  );
};

export default MapError;
