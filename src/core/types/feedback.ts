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
