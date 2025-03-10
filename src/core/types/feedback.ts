import { ModalBaseProps } from './ui';

export interface FeedbackFormProps extends ModalBaseProps {
  templateParams?: Record<string, unknown>;
}

export interface LocationWarningProps extends ModalBaseProps {
  onAllowLocation?: () => void;
}

export interface TemplateParams {
  [key: string]: unknown;
  name: string;
  email: string;
  message: string;
}
