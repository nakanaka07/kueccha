import { memo } from 'react';

/**
 * LoadingStateコンポーネントのプロパティ定義
 * @property {string} message - ロード中に表示されるメッセージ
 */
interface LoadingStateProps {
  /** ロード中に表示されるメッセージ */
  message: string;
}

/**
 * ローディング状態を表示するシンプルなコンポーネント
 *
 * マップやデータのロード中にユーザーにフィードバックを提供します。
 * アクセシビリティのためにaria-labelを使用しています。
 *
 * @param {LoadingStateProps} props - コンポーネントのプロパティ
 * @returns ローディング状態を表示するオーバーレイ要素
 */
export const LoadingState = memo(function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className='map-info-overlay' aria-label={`ロード中: ${message}`} role='status'>
      {message}
    </div>
  );
});

export default LoadingState;
