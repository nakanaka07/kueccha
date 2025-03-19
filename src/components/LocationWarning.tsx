import React, { useState, useEffect } from 'react';

import type { LocationWarningProps } from '../../utils/types';

const LocationWarning: React.FC<LocationWarningProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(onClose, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div>
      <button onClick={() => setIsVisible(false)} aria-label="警告メッセージを閉じる">
        ×
      </button>
      <div>
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
