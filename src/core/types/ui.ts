/**
 * 機能: UIコンポーネントの型定義
 * 依存関係:
 *   - React (ReactNode型を使用)
 *   - common.ts (BaseProps型を使用)
 * 注意点:
 *   - コンポーネントのProps型定義は対応するコンポーネントと一致している必要がある
 *   - エラーバウンダリー関連の型はReactのライフサイクルメソッドに依存する
 */
import { ReactNode } from 'react';
import { BaseProps } from './common';

export interface ModalBaseProps extends BaseProps {
  onClose: () => void;
}

export interface LoadingFallbackProps extends BaseProps {
  isLoading?: boolean;
  isLoaded?: boolean;
  message?: string;
  spinnerClassName?: string;
  fadeDuration?: number;
  variant?: 'spinner' | 'skeleton' | 'progress';
  isFading?: boolean;
}

export interface ErrorBoundaryProps extends BaseProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: {
    componentStack: string;
  } | null;
}

export interface MenuItem {
  label: string;
  title: string;
  action: string;
}
