/**
 * 機能: フィードバックフォームと位置情報警告に関する型定義
 * 依存関係:
 *   - ui.ts (ModalBaseProps型を使用)
 * 注意点:
 *   - フィードバックメール送信時のテンプレートパラメータをサポート
 *   - 位置情報アクセス許可のプロンプト関連機能を含む
 *   - モーダルダイアログとしての共通基盤を継承
 */
import { ModalBaseProps } from './ui';

export interface FeedbackFormProps extends ModalBaseProps {
  templateParams?: Record<string, unknown>; // メールテンプレート用パラメータ
}

export interface LocationWarningProps extends ModalBaseProps {
  onAllowLocation?: () => void; // 位置情報アクセス許可時の処理
}

export interface TemplateParams {
  [key: string]: unknown;
  name: string;
  email: string;
  message: string;
}
