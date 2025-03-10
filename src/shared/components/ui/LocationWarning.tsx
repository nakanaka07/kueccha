import React, { useState, useEffect } from 'react';

interface LocationWarningProps {
  onClose: () => void;
}

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
    <div role="alert">
      <button
        onClick={() => {
          setIsVisible(false);
        }}
        aria-label="警告メッセージを閉じる"
      >
        ×
      </button>

      <div>環境によっては正しい位置情報を取得できない場合がございます。 ご了承ください。</div>
    </div>
  );
};

export { LocationWarning };
export default LocationWarning;
