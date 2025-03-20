/**
 * ローディング状態関連の型定義ファイル
 */

import type { BaseProps } from './base.types';
import type { AppError } from './errors.types';

/**
 * ローディング状態を表す列挙型
 */
export enum LoadingStatus {
  IDLE = 'idle',        // 初期状態
  LOADING = 'loading',  // ローディング中
  REFRESHING = 'refreshing', // データ更新中
  RETRYING = 'retrying',  // エラー後の再試行中
  SUCCESS = 'success',  // 読み込み成功
  ERROR = 'error',      // エラー発生
  TIMEOUT = 'timeout',  // タイムアウト発生
}

/**
 * 進捗率の型（0-100の範囲）
 */
export type ProgressPercentage = number & { readonly __brand: unique symbol };

/**
 * ローディング状態を表す拡張型
 */
export interface LoadingState {
  status: LoadingStatus;          // 現在のローディング状態
  progress?: ProgressPercentage;  // 0-100の間の進捗率
  startTime?: number;             // ローディング開始時間
  timeout?: number;               // タイムアウト時間（ミリ秒）
  id?: string;                    // ローディング操作の識別子
}

/**
 * ローディングコンポーネントのプロパティ型
 */
export interface LoadingFallbackProps extends BaseProps {
  message?: string;               // 表示メッセージ
  delay?: number;                 // 表示遅延時間
  fadeDuration?: number;          // フェードイン時間
  showProgress?: boolean;         // 進捗率表示フラグ
  progress?: ProgressPercentage;  // 進捗率
  timeout?: number;               // タイムアウト時間
  timeoutMessage?: string;        // タイムアウト時メッセージ
  onRetry?: () => void;           // 再試行ハンドラ
}

/**
 * ローディング処理の結果を表す型
 */
export interface LoadingResult<T> {
  data: T | null;                 // 取得データ
  status: LoadingStatus;          // ローディング状態
  progress?: ProgressPercentage;  // 進捗率
  error: AppError | null;         // エラー情報
  updatedAt?: number;             // 最終更新時間
}

/**
 * 進捗率を検証し、有効な値を返す関数
 */
export function validateProgress(value: number): ProgressPercentage {
  return Math.max(0, Math.min(100, value)) as ProgressPercentage;
}

/**
 * 初期ローディング状態を生成する関数
 */
export function createInitialLoadingState(timeout: number = 30000): LoadingState {
  return {
    status: LoadingStatus.IDLE,
    progress: validateProgress(0),
    timeout,
  };
}