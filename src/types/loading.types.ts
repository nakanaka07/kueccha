/**
 * ローディング関連の型定義ファイル
 *
 * アプリケーションのローディング状態を管理するための型を定義します。
 * これらの型はローディングコンポーネントやローディング状態の管理に使用されます。
 */

import { BaseProps } from './base.types';

// ============================================================================
// ローディング状態の基本型定義
// ============================================================================

/**
 * ローディングの状態を表す列挙型
 * より詳細なローディング状態を管理するために使用します
 */
export enum LoadingStatus {
  /** 初期状態・アイドル状態 */
  IDLE = 'idle',
  /** 初回読み込み中 */
  LOADING = 'loading',
  /** データ更新中 */
  REFRESHING = 'refreshing',
  /** エラー後の再試行中 */
  RETRYING = 'retrying',
  /** 読み込み成功 */
  SUCCESS = 'success',
  /** エラー発生 */
  ERROR = 'error',
  /** タイムアウト発生 */
  TIMEOUT = 'timeout',
}

/**
 * 進捗率の型（0-100の範囲）
 * 値の範囲が保証された進捗率を表現します
 */
export type ProgressPercentage = number & { readonly __brand: unique symbol };

/**
 * アプリケーション固有のエラー情報
 * 標準のErrorオブジェクトを拡張し、より詳細なエラー情報を提供します
 */
export interface AppError {
  /** エラーメッセージ */
  message: string;

  /** エラーコード */
  code?: string;

  /** 元のエラーオブジェクト */
  originalError?: Error;

  /** エラーに関連する追加コンテキスト情報 */
  context?: Record<string, unknown>;
}

/**
 * ローディング状態を表す拡張型。
 * アプリケーション全体でローディング状態を一貫して管理するために使用します。
 */
export interface LoadingState {
  /** 現在のローディング状態 */
  status: LoadingStatus;

  /** 0-100の間の進捗率（オプション） */
  progress?: ProgressPercentage;

  /** ローディング開始時間（ミリ秒） */
  startTime?: number;

  /** ローディングのタイムアウト時間（ミリ秒） */
  timeout?: number;

  /** ローディング操作の識別子（複数のローディングを管理する場合に使用） */
  id?: string;
}

// ============================================================================
// コンポーネントプロパティ型定義
// ============================================================================

/**
 * ローディング中のフォールバックコンポーネントのプロパティ型。
 * データ読み込み中やAPI呼び出し中の表示を制御します。
 */
export interface LoadingFallbackProps extends BaseProps {
  /**
   * 現在ローディング中かどうか。true の場合はローディング表示、false の場合はフェードアウト
   */
  isLoading: boolean;

  /**
   * ローディング中に表示するメッセージ
   * @default 'データを読み込んでいます...'
   */
  message?: string;

  /**
   * ローディングスピナーに適用するCSSクラス名
   * @default 'spinner-border text-primary'
   */
  spinnerClassName?: string;

  /**
   * フェードアウトアニメーションの時間（ミリ秒）
   * @default 1000
   */
  fadeDuration?: number;

  /**
   * 進捗率を表示するかどうか
   * @default false
   */
  showProgress?: boolean;

  /**
   * 現在の進捗率（0-100）
   */
  progress?: ProgressPercentage;

  /**
   * タイムアウト時間（ミリ秒）
   * この時間を超えるとタイムアウト表示になります
   * @default 30000
   */
  timeout?: number;

  /**
   * タイムアウト時に表示するメッセージ
   */
  timeoutMessage?: string;

  /**
   * 再試行ボタンのクリックハンドラ
   */
  onRetry?: () => void;
}

// ============================================================================
// 処理結果型定義
// ============================================================================

/**
 * ローディング処理の結果を表す型。
 * データ取得などの非同期操作の結果とローディング状態を組み合わせて管理します。
 */
export interface LoadingResult<T> {
  /** 取得したデータまたはnull */
  data: T | null;

  /** 現在のローディング状態 */
  status: LoadingStatus;

  /** 0-100の間の進捗率（オプション） */
  progress?: ProgressPercentage;

  /** エラー情報または成功時はnull */
  error: AppError | null;

  /** 最終更新時間 */
  updatedAt?: number;
}

/**
 * 進捗率を検証し、有効な値を返す関数
 * @param value - 進捗率の値
 * @returns 0-100の範囲に調整された進捗率
 */
export function validateProgress(value: number): ProgressPercentage {
  return Math.max(0, Math.min(100, value)) as ProgressPercentage;
}

/**
 * 初期ローディング状態を生成する関数
 * @param timeout - カスタムタイムアウト値（ミリ秒）
 * @returns 初期化されたローディング状態
 */
export function createInitialLoadingState(timeout: number = 30000): LoadingState {
  return {
    status: LoadingStatus.IDLE,
    progress: validateProgress(0),
    timeout,
  };
}

/**
 * 初期ローディング結果を生成する関数
 * @returns 初期化されたローディング結果
 */
export function createInitialLoadingResult<T>(): LoadingResult<T> {
  return {
    data: null,
    status: LoadingStatus.IDLE,
    progress: validateProgress(0),
    error: null,
  };
}
