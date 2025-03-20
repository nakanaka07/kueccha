/**
 * エラー関連の型定義ファイル
 */

import type { BaseProps } from './base.types';
import type { SupportedLanguage } from '../constants/i18n.constants';
import type { ReactNode, ErrorInfo } from 'react';

/**
 * エラーカテゴリを定義
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
 */
export type ErrorCode<T extends ErrorCategory> = string;

/**
 * すべてのエラータイプに共通するエラーコード
 */
export enum CommonErrorCode {
  UNKNOWN = 'UNKNOWN',
}

/**
 * 各カテゴリのエラーコード
 */
export enum ConfigErrorCode {
  INVALID = 'INVALID',
  MISSING = 'MISSING',
}

export enum DataErrorCode {
  FETCH_FAILED = 'FETCH_FAILED',
  LOADING_FAILED = 'LOADING_FAILED',
  NOT_FOUND = 'NOT_FOUND',
}

export enum LoadingErrorCode {
  DATA = 'DATA',
  MAP = 'MAP',
}

export enum MapErrorCode {
  LOAD_FAILED = 'LOAD_FAILED',
  CONFIG_MISSING = 'CONFIG_MISSING',
  RETRY_MESSAGE = 'RETRY_MESSAGE',
}

export enum SystemErrorCode {
  CONTAINER_NOT_FOUND = 'CONTAINER_NOT_FOUND',
  UNKNOWN = CommonErrorCode.UNKNOWN,
}

export enum FormErrorCode {
  EMPTY_NAME = 'EMPTY_NAME',
  EMPTY_MESSAGE = 'EMPTY_MESSAGE',
  INVALID_EMAIL = 'INVALID_EMAIL',
  SUBMISSION_FAILED = 'SUBMISSION_FAILED',
  FIELD_REQUIRED = 'FIELD_REQUIRED',
  FIELD_TOO_SHORT = 'FIELD_TOO_SHORT',
  FIELD_TOO_LONG = 'FIELD_TOO_LONG',
}

export enum ErrorBoundaryErrorCode {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  RETRY_BUTTON = 'RETRY_BUTTON',
}

export enum GeolocationErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = CommonErrorCode.UNKNOWN,
}

/**
 * エラーコード列挙型のマッピング
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

/**
 * エラーメッセージの型定義
 */
export interface LocalizedErrorMessage {
  ja: string;
  en: string;
  [key: string]: string;
}

/**
 * 各カテゴリのエラーメッセージの型
 */
export type ErrorMessagesSchema = {
  [Category in ErrorCategory]: {
    [Code in string]: LocalizedErrorMessage;
  };
};

/**
 * アプリケーションエラーの型定義
 */
export interface AppError<T = unknown> {
  category: ErrorCategory;
  code: string;
  message: string;
  localized?: Record<SupportedLanguage, string>;
  timestamp: Date;
  params?: Record<string, string | number>;
  details?: T;
  originalError?: Error;
  context?: Record<string, unknown>;
}

/**
 * エラーバウンダリ関連の型定義
 */
export type ResetKeyValue = string | number | boolean | object | null | undefined;

export interface ErrorBoundaryProps extends BaseProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: Array<ResetKeyValue>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * エラーユーティリティ関数
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