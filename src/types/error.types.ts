/**
 * エラー処理に関する型定義
 * - アプリケーションエラーの構造
 * - エラーの重要度分類
 * - 位置情報取得エラー
 * - エラーバウンダリの状態管理
 */
import { ERROR_MESSAGES } from '../constants/message.constants';
export interface AppError {
  message: string;
  code: string;
  details?: string;
  category?: keyof typeof ERROR_MESSAGES | string;
  severity?: ErrorSeverity;
}

export type ErrorSeverity = 'critical' | 'warning' | 'info' | null;

export interface GeolocationError {
  code: number;
  message: string;
  details?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  appError: AppError | null;
  componentStack?: string;
}
