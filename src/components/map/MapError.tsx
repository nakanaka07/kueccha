import React from 'react';

// MapErrorコンポーネントのプロパティの型を定義します。
// message: エラーメッセージを表示するための文字列。
// onRetry: 再試行ボタンがクリックされたときに呼び出される関数。
type MapErrorProps = {
  message: string; // エラーメッセージを格納するプロパティ
  onRetry: () => void; // 再試行ボタンがクリックされたときに呼び出される関数
};

// MapErrorコンポーネントを定義します。
// エラーメッセージと再試行ボタンを表示します。
export const MapError: React.FC<MapErrorProps> = ({ message, onRetry }) => (
  // エラーコンテナを定義し、役割をalertに設定します。
  <div className="error-container" role="alert">
    {/* 地図の読み込みエラーを示すメッセージを表示します。 */}
    <p>地図の読み込み中にエラーが発生しました。</p>
    {/* 受け取ったエラーメッセージを表示します。 */}
    <p>{message}</p>
    {/* インターネット接続の確認を促すメッセージを表示します。 */}
    <p>インターネット接続を確認し、再度お試しください。</p>
    {/* 再試行ボタンを表示し、クリック時にonRetry関数を呼び出します。 */}
    <button onClick={onRetry}>再読み込み</button>
  </div>
);
