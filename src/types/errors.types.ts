/**
 * エラー関連の型定義ファイル
 *
 * アプリケーション全体で一貫したエラー処理を実現するための型定義を提供します。
 * エラーカテゴリ、エラーコード、エラーメッセージの構造化と、
 * ErrorBoundaryコンポーネントの型定義を含みます。
 */

import type { ReactNode, ErrorInfo } from 'react';

import type { BaseProps } from './base.types';
import type { SupportedLanguage } from '../constants/i18n.constants';

// ============================================================================
// エラーカテゴリとコード
// ============================================================================

/**
 * エラーカテゴリを定義
 * アプリケーションの機能領域に基づいてエラーを分類
 */
export type ErrorCategory =
  | 'CONFIG' // 設定関連エラー
  | 'DATA' // データ操作エラー
  | 'LOADING' // リソース読み込みエラー
  | 'MAP' // 地図機能エラー
  | 'SYSTEM' // システム全般エラー
  | 'FORM' // フォーム処理エラー
  | 'ERROR_BOUNDARY' // React ErrorBoundaryエラー
  | 'GEOLOCATION'; // 位置情報関連エラー

/**
 * エラーコードの型定義
 * 各カテゴリ内の特定のエラー状態を識別するコード
 */
export type ErrorCode<T extends ErrorCategory> = string;

/**
 * すべてのカテゴリで共通して使用できるエラーコード
 */
export enum CommonErrorCode {
  UNKNOWN = 'UNKNOWN', // 不明なエラー
}

/**
 * 設定関連のエラーコード
 */
export enum ConfigErrorCode {
  INVALID = 'INVALID', // 無効な設定
  MISSING = 'MISSING', // 必要な設定が不足
}

/**
 * データ関連のエラーコード
 */
export enum DataErrorCode {
  FETCH_FAILED = 'FETCH_FAILED', // データ取得失敗
  LOADING_FAILED = 'LOADING_FAILED', // 読み込み失敗
  NOT_FOUND = 'NOT_FOUND', // データが見つからない
}

/**
 * ローディング関連のエラーコード
 */
export enum LoadingErrorCode {
  DATA = 'DATA', // データロードエラー
  MAP = 'MAP', // マップロードエラー
}

/**
 * 地図関連のエラーコード
 */
export enum MapErrorCode {
  LOAD_FAILED = 'LOAD_FAILED', // 地図読み込み失敗
  CONFIG_MISSING = 'CONFIG_MISSING', // 地図設定不足
  RETRY_MESSAGE = 'RETRY_MESSAGE', // 再試行メッセージ
}

/**
 * システム関連のエラーコード
 */
export enum SystemErrorCode {
  CONTAINER_NOT_FOUND = 'CONTAINER_NOT_FOUND', // DOMコンテナが見つからない
  UNKNOWN = CommonErrorCode.UNKNOWN, // 不明なエラー
}

/**
 * フォーム関連のエラーコード
 */
export enum FormErrorCode {
  EMPTY_NAME = 'EMPTY_NAME', // 名前未入力
  EMPTY_MESSAGE = 'EMPTY_MESSAGE', // メッセージ未入力
  INVALID_EMAIL = 'INVALID_EMAIL', // 無効なメールアドレス
  SUBMISSION_FAILED = 'SUBMISSION_FAILED', // 送信失敗
  FIELD_REQUIRED = 'FIELD_REQUIRED', // 必須フィールド
  FIELD_TOO_SHORT = 'FIELD_TOO_SHORT', // フィールド値が短すぎる
  FIELD_TOO_LONG = 'FIELD_TOO_LONG', // フィールド値が長すぎる
}

/**
 * ErrorBoundary関連のエラーコード
 */
export enum ErrorBoundaryErrorCode {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR', // 不明なバウンダリエラー
  RETRY_BUTTON = 'RETRY_BUTTON', // 再試行ボタンテキスト
}

/**
 * 位置情報関連のエラーコード
 */
export enum GeolocationErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED', // 権限がない
  POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE', // 位置情報取得不可
  TIMEOUT = 'TIMEOUT', // タイムアウト
  UNKNOWN = CommonErrorCode.UNKNOWN, // 不明なエラー
}

/**
 * カテゴリごとのエラーコード列挙型のマッピング
 * エラーカテゴリから適切なエラーコード列挙型を取得するためのオブジェクト
 */
export const ERROR_CODE_MAPPINGS = {
  CONFIG: ConfigErrorCode,
  DATA: DataErrorCode,
  LOADING: LoadingErrorCode,
  MAP: MapErrorCode,
  SYSTEM: SystemErrorCode,
  FORM: FormErrorCode,
  ERROR_BOUNDARY: ErrorBoundaryErrorCode,
  GEOLOCATION: GeolocationErrorCode,
};

// ============================================================================
// エラーメッセージと国際化
// ============================================================================

/**
 * 多言語対応のエラーメッセージ型
 */
export interface LocalizedErrorMessage {
  ja: string; // 日本語メッセージ
  en: string; // 英語メッセージ
  [key: string]: string; // その他の言語
}

/**
 * カテゴリとコードに基づくエラーメッセージスキーマ
 * エラーメッセージの構造を定義
 */
export type ErrorMessagesSchema = {
  [Category in ErrorCategory]: {
    [Code in string]: LocalizedErrorMessage;
  };
};

// ============================================================================
// アプリケーションエラー構造
// ============================================================================

/**
 * アプリケーション共通のエラー型
 * 一貫したエラー情報を提供するためのインターフェース
 *
 * @template T エラー詳細の型（オプション）
 */
export interface AppError<T = unknown> {
  category: ErrorCategory; // エラーカテゴリ
  code: string; // エラーコード
  message: string; // デフォルトメッセージ
  localized?: Record<SupportedLanguage, string>; // 多言語メッセージ
  timestamp: Date; // 発生時刻
  params?: Record<string, string | number>; // 追加パラメータ
  details?: T; // 詳細情報
  originalError?: Error; // 元のエラーオブジェクト
  context?: Record<string, unknown>; // コンテキスト情報
}

// ============================================================================
// React ErrorBoundary関連
// ============================================================================

/**
 * ErrorBoundaryコンポーネントの再設定用キーの型
 */
export type ResetKeyValue = string | number | boolean | object | null | undefined;

/**
 * ErrorBoundaryコンポーネントのプロパティ型
 */
export interface ErrorBoundaryProps extends BaseProps {
  children: ReactNode; // 子要素
  fallback?: ReactNode; // エラー時に表示する代替UI
  onError?: (error: Error, errorInfo: ErrorInfo) => void; // エラーハンドラ
  onReset?: () => void; // リセット時のコールバック
  resetKeys?: Array<ResetKeyValue>; // 再レンダリングのトリガー値
}

/**
 * ErrorBoundaryコンポーネントの状態型
 */
export interface ErrorBoundaryState {
  hasError: boolean; // エラー発生フラグ
  error: Error | null; // 捕捉したエラー
  errorInfo: ErrorInfo | null; // エラー情報
}

// ============================================================================
// エラーユーティリティ関数
// ============================================================================

/**
 * 与えられた値がAppErrorインターフェースに準拠しているか判定
 * 型ガードとして機能
 *
 * @param error 検査する値
 * @returns AppError型であればtrue
 */
export function isAppError(error: unknown): error is AppError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'category' in error &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  );
}

/**
 * 任意のエラー値をAppError形式に変換
 *
 * @param error 変換する元のエラー
 * @param defaultCategory デフォルトのエラーカテゴリ
 * @param defaultCode デフォルトのエラーコード
 * @returns 標準化されたAppErrorオブジェクト
 */
export function toAppError(
  error: unknown,
  defaultCategory: ErrorCategory = 'SYSTEM',
  defaultCode: string = CommonErrorCode.UNKNOWN,
): AppError {
  if (isAppError(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  return {
    category: defaultCategory,
    code: defaultCode,
    message,
    timestamp: new Date(),
    originalError: error instanceof Error ? error : undefined,
  };
}
