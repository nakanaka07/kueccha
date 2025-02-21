import React from 'react';

type MapErrorProps = {
  message: string;
  onRetry: () => void;
};

export const MapError: React.FC<MapErrorProps> = ({ message, onRetry }) => (
  <div className="error-container" role="alert">
    <p>地図の読み込み中にエラーが発生しました。</p>
    <p>{message}</p>
    <p>インターネット接続を確認し、再度お試しください。</p>
    <button onClick={onRetry}>再読み込み</button>
  </div>
);
