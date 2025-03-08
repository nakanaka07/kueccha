/*
 * 機能: UIコンポーネントを一元的にエクスポートするためのバレル（barrel）ファイル
 * 依存関係:
 *   - 同じディレクトリにある各UIコンポーネントファイル
 *   - 各コンポーネントの型定義
 * 注意点:
 *   - 個別のコンポーネントファイルから直接インポートするのではなく、
 *     このファイルを通してインポートすることでインポート文を整理できます
 *   - デフォルトエクスポートと名前付きエクスポートの両方が含まれています
 */

// コンポーネントのエクスポート
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as LoadingFallback, MemoizedLoadingFallback } from './LoadingFallback';
export { default as Spinner } from './SpinnerController';
export { default as SkeletonLoader } from './SkeletonLoader';
export { default as LocationWarning } from './LocationWarning';
export { default as HamburgerMenu } from './HamburgerMenu';

// 分割したコンポーネントのエクスポート
export { ErrorDisplay } from './ErrorDisplay';
export { LoadingVariant } from './LoadingVariant';

// 型定義のエクスポート
export type { SkeletonLoaderProps } from './SkeletonLoader';
export type { ErrorDisplayProps } from './ErrorDisplay';
export type { LoadingVariantProps } from './LoadingVariant';
