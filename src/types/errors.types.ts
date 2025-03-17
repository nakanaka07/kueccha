/**
 * エラー関連の型定義ファイル
 * 
 * エラー処理に関連する型を定義します。エラーバウンダリ、エラーコード、
 * エラーメッセージ、およびアプリケーションエラーの構造を含みます。
 */

import { ReactNode, ErrorInfo } from 'react';
import { BaseProps } from './base.types';

// i18n関連の型をインポート
import { SupportedLanguage } from '../constants/i18n.constants';

// ============================================================================
// エラーカテゴリとコードの型定義
// ============================================================================

/**
 * エラーカテゴリを定義
 * エラーメッセージのトップレベルカテゴリ
 */
export type ErrorCategory = 
  | 'CONFIG'
  | 'DATA' 
  | 'LOADING' 
  | 'MAP' 
  | 'SYSTEM' 
  | 'FORM' 
  | 'ERROR_BOUNDARY' 
  | 'GEOLOCATION';

/**
 * エラーコードの型定義
 * 特定のカテゴリに属するエラーコード
 */
export type ErrorCode<T extends ErrorCategory> = string;

// ============================================================================
// 共通エラーコード
// ============================================================================

/**
 * すべてのエラータイプに共通するエラーコード
 */
export enum CommonErrorCode {
  /** 不明なエラー */
  UNKNOWN = 'UNKNOWN'
}

// ============================================================================
// エラーコードの列挙型定義
// ============================================================================

/**
 * 設定関連のエラーコード
 */
export enum ConfigErrorCode {
  /** 設定が無効 */
  INVALID = 'INVALID',
  /** 必要な設定が見つからない */
  MISSING = 'MISSING'
}

/**
 * データ操作関連のエラーコード
 */
export enum DataErrorCode {
  /** データの取得に失敗 */
  FETCH_FAILED = 'FETCH_FAILED',
  /** データの読み込みに失敗 */
  LOADING_FAILED = 'LOADING_FAILED',
  /** データが見つからない */
  NOT_FOUND = 'NOT_FOUND'
}

/**
 * ローディング関連のエラーコード
 */
export enum LoadingErrorCode {
  /** データ読み込みエラー */
  DATA = 'DATA',
  /** マップ読み込みエラー */
  MAP = 'MAP'
}

/**
 * マップ関連のエラーコード
 */
export enum MapErrorCode {
  /** マップの読み込みに失敗 */
  LOAD_FAILED = 'LOAD_FAILED',
  /** マップ設定が見つからない */
  CONFIG_MISSING = 'CONFIG_MISSING',
  /** 再試行メッセージ */
  RETRY_MESSAGE = 'RETRY_MESSAGE'
}

/**
 * システム関連のエラーコード
 */
export enum SystemErrorCode {
  /** コンテナ要素が見つからない */
  CONTAINER_NOT_FOUND = 'CONTAINER_NOT_FOUND',
  /** 不明なシステムエラー */
  UNKNOWN = CommonErrorCode.UNKNOWN
}

/**
 * フォーム関連のエラーコード
 */
export enum FormErrorCode {
  /** 名前が入力されていない */
  EMPTY_NAME = 'EMPTY_NAME',
  /** メッセージが入力されていない */
  EMPTY_MESSAGE = 'EMPTY_MESSAGE',
  /** メールアドレスが無効 */
  INVALID_EMAIL = 'INVALID_EMAIL',
  /** 送信に失敗 */
  SUBMISSION_FAILED = 'SUBMISSION_FAILED',
  /** 必須フィールド */
  FIELD_REQUIRED = 'FIELD_REQUIRED',
  /** フィールドが短すぎる */
  FIELD_TOO_SHORT = 'FIELD_TOO_SHORT',
  /** フィールドが長すぎる */
  FIELD_TOO_LONG = 'FIELD_TOO_LONG'
}

/**
 * エラーバウンダリ関連のエラーコード
 */
export enum ErrorBoundaryErrorCode {
  /** 不明なエラー */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  /** 再試行ボタン */
  RETRY_BUTTON = 'RETRY_BUTTON'
}

/**
 * 位置情報関連のエラーコード
 */
export enum GeolocationErrorCode {
  /** 位置情報へのアクセス権限が拒否された */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  /** 位置情報が利用できない */
  POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE',
  /** 位置情報の取得がタイムアウトした */
  TIMEOUT = 'TIMEOUT',
  /** 不明な位置情報エラー */
  UNKNOWN = CommonErrorCode.UNKNOWN
}

/**
 * エラーコード列挙型のマッピングオブジェクト
 * errors.utils.tsのvalidateErrorMessages関数で使用
 */
export const ERROR_CODE_MAPPINGS = {
  CONFIG: ConfigErrorCode,
  DATA: DataErrorCode,
  LOADING: LoadingErrorCode,
  MAP: MapErrorCode,
  SYSTEM: SystemErrorCode,
  FORM: FormErrorCode,
  ERROR_BOUNDARY: ErrorBoundaryErrorCode,
  GEOLOCATION: GeolocationErrorCode
};

/**
 * エラーメッセージの型定義
 * constants.tsで定義される実際のメッセージの型を表します
 */
export interface LocalizedErrorMessage {
  ja: string;
  en: string;
  [key: string]: string;
}

/**
 * 各カテゴリのエラーメッセージの型
 * constants.tsでエクスポートされるERROR_MESSAGESオブジェクトの型を表します
 */
export type ErrorMessagesSchema = {
  [Category in ErrorCategory]: {
    [Code in string]: LocalizedErrorMessage;
  };
};

// ============================================================================
// アプリケーションエラーの型定義
// ============================================================================

/**
 * アプリケーションエラーの型定義。
 * エラーの種類、コード、メッセージ、発生時刻、および追加情報を含みます。
 * T型パラメータで詳細情報の型を指定できます。
 */
export interface AppError<T = unknown> {
  /** エラーカテゴリ */
  category: ErrorCategory;
  
  /** エラーコード */
  code: string;
  
  /** エラーメッセージ */
  message: string;
  
  /** 多言語対応メッセージ */
  localized?: Record<SupportedLanguage, string>;
  
  /** エラー発生時刻 */
  timestamp: Date;
  
  /** パラメータの値 */
  params?: Record<string, string | number>;
  
  /** 追加の詳細情報 */
  details?: T;
  
  /** 元のエラー */
  originalError?: Error;
  
  /** エラーのコンテキスト情報 */
  context?: Record<string, unknown>;
}

// ============================================================================
// エラーバウンダリ関連の型定義
// ============================================================================

/**
 * エラーバウンダリでのリセット用キー値の有効な型
 */
export type ResetKeyValue = string | number | boolean | object | null | undefined;

/**
 * エラーバウンダリコンポーネントのプロパティ型。
 * コンポーネントツリー内でエラーをキャッチし、フォールバックUIを表示するために使用されます。
 */
export interface ErrorBoundaryProps extends BaseProps {
  /** エラーバウンダリで保護する子コンポーネント */
  children: ReactNode;
  
  /** エラー発生時に表示する代替UI */
  fallback?: ReactNode;
  
  /** エラー通知コールバック */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /** リセット時のコールバック */
  onReset?: () => void;
  
  /** これらの値が変更されたらエラー状態をリセット */
  resetKeys?: Array<ResetKeyValue>;
}

/**
 * エラーバウンダリコンポーネントの内部状態を表す型。
 * エラー情報を保持し、適切なUIレンダリングを判断するために使用されます。
 */
export interface ErrorBoundaryState {
  /** エラーが発生したかどうかのフラグ */
  hasError: boolean;
  
  /** キャッチされたエラーオブジェクト */
  error: Error | null;
  
  /** エラーが発生したコンポーネントのスタック情報 */
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// エラーユーティリティ関数の型定義
// ============================================================================

/**
 * 値がAppErrorかどうかをチェックする型ガード関数
 * 
 * @param error - チェックする値
 * @returns AppError型かどうかを示すブール値
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
 * エラーをAppError型に変換する
 * 
 * @param error - 変換する元のエラー
 * @param defaultCategory - デフォルトのエラーカテゴリ
 * @param defaultCode - デフォルトのエラーコード
 * @returns AppError型に変換されたエラー
 */
export function toAppError(
  error: unknown, 
  defaultCategory: ErrorCategory = 'SYSTEM', 
  defaultCode: string = CommonErrorCode.UNKNOWN
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
    originalError: error instanceof Error ? error : undefined
  };
}