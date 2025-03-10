/**
 * 機能: エラー処理を行うカスタムフック
 * 依存関係:
 *   - services/errors.ts (useErrorHandling関数の実際の実装)
 * 注意点:
 *   - サービスレイヤーからフックをリエクスポートすることで一貫した構造を維持
 */

export { useErrorHandling } from '../services/errors';
