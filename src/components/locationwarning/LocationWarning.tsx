/**
 * LocationWarning.tsx
 *
 * このファイルは位置情報の使用に関する警告メッセージを表示するコンポーネントを定義します。
 * ユーザーに位置情報の取得に関する制限や問題について知らせるためのモーダルウィンドウとして
 * 機能します。ユーザーが閉じるボタンをクリックすると、アニメーション付きで非表示になります。
 */

// Reactライブラリと必要なフックをインポート
import React, { useState, useEffect } from 'react';
// コンポーネント固有のスタイルをインポート
import './LocationWarning-module.css';
// 型安全性のための型定義をインポート
import type { LocationWarningProps } from '../../utils/types';

/**
 * 位置情報の警告メッセージを表示するコンポーネント
 *
 * @param onClose - 警告メッセージが閉じられたときに呼び出されるコールバック関数
 */
const LocationWarning: React.FC<LocationWarningProps> = ({ onClose }) => {
  // 警告メッセージの表示状態を管理するstate
  // 初期値はtrue（表示状態）に設定
  const [isVisible, setIsVisible] = useState(true);

  /**
   * 警告メッセージの非表示処理を制御するeffect
   * isVisibleがfalseになったとき、アニメーション完了後に
   * onClose関数を呼び出して親コンポーネントに通知する
   */
  useEffect(() => {
    // メッセージが非表示状態になった場合
    if (!isVisible) {
      // CSSトランジションアニメーション（300ms）完了後にonCloseを呼び出す
      const timer = setTimeout(() => {
        onClose(); // 親コンポーネントにメッセージが閉じられたことを通知
      }, 300);

      // コンポーネントのアンマウント時やisVisibleが変更された場合にタイマーをクリア
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]); // isVisibleまたはonClose関数が変更されたときにeffectを再実行

  return (
    // 警告メッセージのコンテナ要素
    // isVisibleの値に基づいてCSSクラスを動的に適用（非表示時に'hidden'クラスを追加）
    <div className={`location-warning ${!isVisible ? 'hidden' : ''}`}>
      {/* 閉じるボタン - ユーザーがメッセージを閉じるために使用 */}
      <button
        className="close-button"
        onClick={() => {
          setIsVisible(false); // ボタンクリック時にisVisibleをfalseにしてアニメーション開始
        }}
        aria-label="警告メッセージを閉じる" // アクセシビリティのための追加
      >
        ×
      </button>

      {/* 警告メッセージの本文 - 位置情報取得に関する注意事項を表示 */}
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

// 他のコンポーネントでインポートできるようにエクスポート
export default LocationWarning;
