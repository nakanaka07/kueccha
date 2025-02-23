// Reactと必要なフックをインポート
import React, { useState, useEffect } from 'react';
// CSSファイルをインポート
import './LocationWarning.css';
// 型定義をインポート
import type { LocationWarningProps } from '../../utils/types';

// LocationWarningコンポーネントを定義
const LocationWarning: React.FC<LocationWarningProps> = ({ onClose }) => {
  // 警告メッセージの表示状態を管理する状態変数
  const [isVisible, setIsVisible] = useState(true);

  // コンポーネントのマウント時とisVisibleの変更時に実行されるuseEffectフック
  useEffect(() => {
    console.log('LocationWarning mounted');
    // isVisibleがfalseになった場合、300ms後にonCloseを呼び出す
    if (!isVisible) {
      const timer = setTimeout(() => {
        console.log('LocationWarning closing');
        onClose();
      }, 300);
      // クリーンアップ関数でタイマーをクリア
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]); // isVisibleとonCloseが変更されるたびに実行

  return (
    // 警告メッセージのコンテナ
    <div className={`location-warning ${!isVisible ? 'hidden' : ''}`}>
      {/* 閉じるボタン */}
      <button
        className="close-button"
        onClick={() => {
          console.log('Close button clicked');
          setIsVisible(false); // isVisibleをfalseに設定
        }}
      >
        ×
      </button>
      {/* 警告メッセージ */}
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

// LocationWarningコンポーネントをエクスポート
export default LocationWarning;
