import React, { useState, useEffect } from 'react';
import './LocationWarning.css';
import type { LocationWarningProps } from '../../utils/types';

const LocationWarning: React.FC<LocationWarningProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div className={`location-warning ${!isVisible ? 'hidden' : ''}`}>
      <button className="close-button" onClick={() => setIsVisible(false)}>
        ×
      </button>
      <div className="message">
        ブラウザ環境によっては正しい位置情報を
        <br />
        取得できない場合がございます。
        <br />
        ご了承ください。
      </div>
    </div>
  );
};

export default LocationWarning;
