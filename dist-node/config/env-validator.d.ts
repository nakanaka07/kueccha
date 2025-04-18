import { LogContext } from './config-logger';
/**
 * 環境変数検証エラーの種類
 */
export declare enum EnvValidationErrorType {
  MISSING = 'missing',
  INVALID_FORMAT = 'invalid_format',
  INSUFFICIENT_PERMISSION = 'insufficient_permission',
}
/**
 * 環境変数検証エラー情報
 */
export interface EnvValidationError {
  key: string;
  type: EnvValidationErrorType;
  message: string;
  severity: 'critical' | 'warning';
  recommendation?: string;
  fallbackAvailable: boolean;
}
/**
 * 環境変数検証のコンテキスト
 */
export interface EnvValidationContext extends LogContext {
  errors?: EnvValidationError[];
  missingVars?: string[];
  invalidFormatVars?: string[];
  recoveryAttempted?: boolean;
  recoverySuccessful?: boolean;
  fallbacksApplied?: Record<string, string>;
  startupMode?: 'normal' | 'fallback' | 'limited';
}
/**
 * 必須環境変数の検証を行う
 * @param env 環境変数オブジェクト
 * @returns バリデーション結果（フォールバック適用済みの環境変数を含む）
 */
export declare function validateEnv(env: Record<string, string>): {
  isValid: boolean;
  validatedEnv: Record<string, string>;
  errors: EnvValidationError[];
  startupMode: 'normal' | 'fallback' | 'limited';
};
