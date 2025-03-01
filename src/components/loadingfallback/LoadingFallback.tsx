/**
 * LoadingFallback.tsx
 *
 * @description
 * データの読み込み状態やエラー状態を視覚的に表示するローディングインジケーターコンポーネント。
 * 非同期処理の進行状況をユーザーに伝え、エラー発生時には適切なフィードバックと再試行オプションを提供します。
 *
 * @usage
 * 以下のようなケースで使用します：
 * - APIからのデータフェッチング中の表示
 * - 大きなコンポーネントの初期化中
 * - ファイルのアップロード/ダウンロード処理中
 * - 画面遷移や重い処理の実行中
 *
 * @features
 * - 3種類の表示バリアント（spinner, skeleton, progress）
 * - スムーズなフェードアウトアニメーション
 * - エラー状態の表示と再試行機能
 * - オーバーレイモードによる操作ブロック
 * - アクセシビリティ対応（適切なARIA属性）
 * - React.memoによるパフォーマンス最適化
 *
 * @props
 * - isLoading: boolean - ローディング中かどうかを示すフラグ
 * - isLoaded: boolean - ロード完了したかどうかを示すフラグ
 * - error?: Error | null - エラー情報（存在する場合はエラー表示モードになる）
 * - message?: string - ローディング中に表示するメッセージ
 * - errorMessage?: string - エラー時に表示するカスタムメッセージ
 * - fadeDuration?: number - フェードアウトアニメーションの時間（ミリ秒）
 * - onRetry?: () => void - エラー時の再試行ボタン押下時のコールバック
 * - variant?: 'spinner' | 'skeleton' | 'progress' - 表示スタイル
 * - showOverlay?: boolean - 背景をオーバーレイで覆うかどうか
 *
 * @example
 * // 基本的な使用例
 * <LoadingFallback
 *   isLoading={isDataLoading}
 *   isLoaded={!!data}
 *   message="データを取得中です..."
 * />
 *
 * // エラーハンドリング付きの使用例
 * <LoadingFallback
 *   isLoading={isLoading}
 *   isLoaded={isLoaded}
 *   error={error}
 *   onRetry={handleRetryFetch}
 *   showOverlay={true}
 * />
 *
 * // スケルトンローディングの使用例
 * <LoadingFallback
 *   isLoading={isLoading}
 *   isLoaded={isLoaded}
 *   variant="skeleton"
 * />
 *
 * @bestPractices
 * - ロード時間が予測できる場合は'progress'バリアントの使用を検討する
 * - ユーザーにとって重要な操作中は'showOverlay'をtrueにして誤操作を防止する
 * - 短時間で終わる操作には表示を遅延させ、ちらつきを防止する
 *
 * @dependencies
 * - useLoadingState: ローディング状態の管理ロジックを分離したカスタムフック
 * - ERROR_MESSAGES: エラーメッセージ定数
 * - SkeletonLoader: スケルトン表示用のサブコンポーネント（要インポート）
 */

import React, { memo } from 'react';
import styles from './LoadingFallback.module.css';
import { useLoadingState } from '../../hooks/useLoadingState';
import { ERROR_MESSAGES } from '../../utils/constants';
import { SkeletonLoader } from '../skeleton/SkeletonLoader';
import { Spinner } from '../spinner/Spinner';

// Props型の拡張に spinnerClassName プロパティを追加
interface LoadingFallbackProps {
  isLoading: boolean;
  isLoaded: boolean;
  error?: Error | null;
  message?: string;
  errorMessage?: string;
  fadeDuration?: number;
  onRetry?: () => void;
  variant?: 'spinner' | 'skeleton' | 'progress';
  showOverlay?: boolean;
  spinnerClassName?: string; // 追加: スピナーに適用する追加のクラス名
  isFading?: boolean; // 追加: 外部から渡されるフェード状態
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  isLoading,
  isLoaded,
  error = null,
  message = ERROR_MESSAGES.LOADING.DATA,
  errorMessage = ERROR_MESSAGES.DATA.LOADING_FAILED,
  fadeDuration = 3000,
  onRetry,
  variant = 'spinner',
  showOverlay = false,
  spinnerClassName = '', // 追加: デフォルト値は空文字列
  isFading: externalFading, // 追加: 外部から渡されるフェード状態
}) => {
  // カスタムフックで状態管理ロジックを分離（外部のisFadingが渡された場合はそれを優先）
  const { isVisible, isFading: internalFading } = useLoadingState(isLoading, isLoaded, fadeDuration);
  const isFading = externalFading !== undefined ? externalFading : internalFading;

  // 表示されない場合は何もレンダリングしない
  if (!isVisible) return null;

  return (
    <div
      className={`${styles.loadingFallback} ${isFading ? styles.fading : ''} ${showOverlay ? styles.overlay : ''}`}
      style={isFading ? { animationDuration: `${fadeDuration}ms` } : undefined}
      role={error ? 'alert' : 'status'}
      aria-live={error ? 'assertive' : 'polite'}
    >
      <div className={styles.loadingContent}>
        {!error ? (
          <>
            {variant === 'spinner' && (
              <>
                <Spinner size="large" className={`${styles.spinnerMargin} ${spinnerClassName}`} />
                <p>{message}</p>
              </>
            )}
            {variant === 'skeleton' && (
              <div className={styles.skeletonContainer}>
                <SkeletonLoader type="rectangle" width="100%" height="20px" count={3} />
              </div>
            )}
            {variant === 'progress' && (
              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div className={styles.progressIndicator} />
                </div>
                <p>{message}</p>
              </div>
            )}
          </>
        ) : (
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon} aria-hidden="true" />
            <p>{errorMessage || error.message}</p>
            {onRetry && (
              <button className={styles.retryButton} onClick={onRetry}>
                再試行
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

LoadingFallback.displayName = 'LoadingFallback';

// メモ化したコンポーネントをエクスポート
export const MemoizedLoadingFallback = memo(LoadingFallback);
export { LoadingFallback };
export default memo(LoadingFallback);
