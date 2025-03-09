/*
 * 機能: フィードバックモジュールのエントリーポイント。公開コンポーネント、フック、型定義をエクスポートする
 * 依存関係:
 *   - FeedbackFormContainer、FeedbackFormUI、FeedbackSuccessコンポーネント
 *   - useFeedbackFormフック
 *   - 型定義（FeedbackFormProps、TemplateParams）
 * 注意点:
 *   - このファイルは外部モジュールへの公開APIを定義するため、変更時には互換性を考慮する必要がある
 */

export { default as FeedbackForm } from './components/FeedbackFormContainer';

export { FeedbackFormUI } from './components/FeedbackFormUI';
export { FeedbackSuccess } from './components/FeedbackSuccess';

// useFeedbackFormを1回だけエクスポート
export * from './hooks/useFeedbackForm';

// 正しいパスを使用
export type { FeedbackFormProps, TemplateParams } from '../../core/types/feedback';
