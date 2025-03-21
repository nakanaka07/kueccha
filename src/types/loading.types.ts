/**
 * ローディング状態管理に関する型定義ファイル
 *
 * このファイルでは、アプリケーション全体でのローディング状態の表現と管理に
 * 関連する型定義を提供します。AsyncThunk、非同期フック、データフェッチングに
 * 一貫したローディングUIを提供するために使用されます。
 */

import type { BaseProps } from './base.types';
import type { AppError } from '../utils/errors';

// ============================================================================
// ローディング状態の基本型
// ============================================================================

/**
 * ローディング状態を表す列挙型
 */
export enum LoadingStatus {
  IDLE = 'idle', // 初期状態
  LOADING = 'loading', // ローディング中
  REFRESHING = 'refreshing', // データ更新中
  RETRYING = 'retrying', // エラー後の再試行中
  SUCCESS = 'success', // 読み込み成功
  ERROR = 'error', // エラー発生
  TIMEOUT = 'timeout', // タイムアウト発生
}

/**
 * ProgressPercentage のブランド型定義
 * 0-100の範囲に制限された進捗率を表現する型安全な数値型
 *
 * @example
 * // 正しい使用法:
 * import { validateProgress } from '../utils/loading.utils';
 * const progress: ProgressPercentage = validateProgress(75);
 */
export type ProgressPercentage = number & { readonly __brand: unique symbol };

/**
 * ローディング状態を表す基本型
 */
export interface LoadingState {
  status: LoadingStatus; // 現在のローディング状態
  progress?: ProgressPercentage; // 0-100の間の進捗率
  startTime?: number; // ローディング開始時間
  timeout?: number; // タイムアウト時間（ミリ秒）
  id?: string; // ローディング操作の識別子
}

// ============================================================================
// ローディングUI関連
// ============================================================================

/**
 * ローディングコンポーネントのプロパティ型
 */
export interface LoadingFallbackProps extends BaseProps {
  message?: string; // 表示メッセージ
  delay?: number; // 表示遅延時間（ミリ秒）
  fadeDuration?: number; // フェードイン時間（ミリ秒）
  showProgress?: boolean; // 進捗率表示フラグ
  progress?: ProgressPercentage; // 進捗率
  timeout?: number; // タイムアウト時間（ミリ秒）
  timeoutMessage?: string; // タイムアウト時メッセージ
  onRetry?: () => void; // 再試行ハンドラ
}

// ============================================================================
// ローディング結果と操作
// ============================================================================

/**
 * ローディング処理の結果を表す型
 */
export interface LoadingResult<T> {
  data: T | null; // 取得データ
  status: LoadingStatus; // ローディング状態
  progress?: ProgressPercentage; // 進捗率
  error: AppError | null; // エラー情報
  updatedAt?: number; // 最終更新時間（タイムスタンプ）
}
