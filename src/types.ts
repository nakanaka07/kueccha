import { ERROR_MESSAGES } from '@/messages';

/**
 * アプリケーションエラーの基本型
 */
export interface AppError {
  message: string; // ユーザー向けエラーメッセージ
  code: string; // エラーコード (例: "MAP_LOAD_FAILED")
  details?: string; // 技術的な詳細（オプション）
  category?: keyof typeof ERROR_MESSAGES | string; // エラーカテゴリ
  severity?: ErrorSeverity; // エラーの重大度
}

export type ErrorSeverity = 'critical' | 'warning' | 'info' | null;

/**
 * 位置情報エラー型
 */
export interface GeolocationError {
  code: number; // GeolocationPositionErrorのコード
  message: string; // エラーメッセージ
  details?: string; // 追加の詳細情報
}

/**
 * エラーバウンダリ状態型
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  appError: AppError | null;
  componentStack?: string;
}
