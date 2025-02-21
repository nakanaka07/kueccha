import React, { useState, useEffect } from 'react';
import './LocationWarning.css';
import type { LocationWarningProps } from '../../utils/types';

const LocationWarning: React.FC<LocationWarningProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    console.log('LocationWarning mounted');
    if (!isVisible) {
      const timer = setTimeout(() => {
        console.log('LocationWarning closing');
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div className={`location-warning ${!isVisible ? 'hidden' : ''}`}>
      <button
        className="close-button"
        onClick={() => {
          console.log('Close button clicked');
          setIsVisible(false);
        }}
      >
        ×
      </button>
      <div className="message">
        ブラウザ環境によっては正しい位置情報を取得できない場合がございます。
        <br />
        位置情報の取得を許可するか、ブラウザの設定を確認してください。
        <br />
        ご了承ください。
      </div>
    </div>
  );
};

export default LocationWarning;
