/**
 * ローディング状態管理ユーティリティ関数
 * 
 * ローディング状態の作成、更新、検証に関する関数を提供します。
 */

import type { LoadingState, LoadingStatus, ProgressPercentage } from '../types/loading.types';

/**
 * 進捗値を0-100の範囲内に収める
 * 
 * @param value 検証する進捗値
 * @returns 型安全な進捗率値
 */
export function validateProgress(value: number): ProgressPercentage {
  const clampedValue = Math.max(0, Math.min(100, value));
  return clampedValue as ProgressPercentage;
}

/**
 * 初期ローディング状態を作成
 * 
 * @param timeout タイムアウト時間（ミリ秒）
 * @returns 初期化されたローディング状態オブジェクト
 */
export function createInitialLoadingState(timeout?: number): LoadingState {
  return {
    status: 'idle' as LoadingStatus,
    startTime: Date.now(),
    timeout,
  };
}