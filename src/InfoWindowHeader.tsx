import React from 'react';

interface InfoWindowHeaderProps {
  title: string;
  onClose: () => void;
}

export const InfoWindowHeader: React.FC<InfoWindowHeaderProps> = ({ title, onClose }) => {
  return (
    <div className="infoHeader">
      <h2 id="info-window-title">{title}</h2>
      <button onClick={onClose} aria-label="閉じる" className="modalCloseButton" title="閉じます。">
        ×
      </button>
    </div>
  );
};
