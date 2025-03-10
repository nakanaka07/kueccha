import React, { useState, useEffect } from 'react';
import { useLocationWarning } from '../../../core/hooks/useLocationWarning';

interface LocationWarningProps {
  onClose: () => void;
}

const LocationWarning: React.FC<LocationWarningProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { locationError, clearError } = useLocationWarning();

  // エラーメッセージを取得
  const errorMessage =
    locationError?.message || '環境によっては正しい位置情報を取得できない場合がございます。 ご了承ください。';

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        clearError();
        onClose();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, clearError]);

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

      <div>{errorMessage}</div>
    </div>
  );
};

export { LocationWarning };
export default LocationWarning;
