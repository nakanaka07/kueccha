import { useState, useEffect, useMemo, useCallback } from 'react';

import { validateEnv, EnvValidationError } from '../../config/env-validator';

import { logger } from '@/utils/logger';

/**
 * 環境変数の検証を行うカスタムフック
 *
 * 環境変数の検証プロセスをカプセル化し、エラーがあれば状態として保持する。
 * エラーハンドリングとロギングを統合し、詳細なエラー情報を提供する。
 *
 * @returns {object} 検証結果を含むオブジェクト
 * @returns {string|null} envError - エラーメッセージ（エラーがなければnull）
 * @returns {EnvValidationError[]} errors - 詳細なエラー情報の配列
 * @returns {boolean} isValidating - 検証処理中かどうか
 * @returns {Function} validateManually - 手動で再検証を行うための関数
 */
export const useEnvValidator = () => {
  // 状態管理の定義
  const [envError, setEnvError] = useState<string | null>(null);
  const [errors, setErrors] = useState<EnvValidationError[]>([]);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);

  /**
   * 環境変数検証の実行と結果処理を行う関数
   * 単一責任の原則に基づき、検証ロジックを分離
   */
  const performValidation = useCallback(() => {
    const startTime = performance.now();
    setIsValidating(true);

    try {
      logger.info('環境変数検証を開始', {
        component: 'EnvValidator',
        action: 'validate',
        timestamp: new Date().toISOString(),
      });

      // 環境変数を検証
      const validationResult = validateEnv(import.meta.env);

      // 検証結果からエラーがあるか確認
      if (validationResult.errors && validationResult.errors.length > 0) {
        // 警告レベルとクリティカルレベルのエラーを分離
        const criticalErrors = validationResult.errors.filter(err => err.severity === 'critical');

        if (criticalErrors.length > 0) {
          // クリティカルエラーがある場合はエラーメッセージを設定
          const errorMessage = `環境変数の検証中に重大なエラーが発生しました: ${criticalErrors.map(err => err.key).join(', ')}`;
          setEnvError(errorMessage);

          logger.error(errorMessage, {
            component: 'EnvValidator',
            action: 'validation_failed',
            errors: criticalErrors,
            startupMode: validationResult.startupMode,
            timestamp: new Date().toISOString(),
          });
        } else {
          // 警告のみの場合
          logger.warn('環境変数に問題が見つかりましたが、アプリケーションは動作可能です', {
            component: 'EnvValidator',
            action: 'validation_warning',
            warnings: validationResult.errors,
            startupMode: validationResult.startupMode,
            timestamp: new Date().toISOString(),
          });
          // 警告のみの場合はエラーとして扱わない
          setEnvError(null);
        }

        // すべてのエラー情報を保持
        setErrors(validationResult.errors);
      } else {
        // エラーがない場合
        logger.info('環境変数検証 完了', {
          component: 'EnvValidator',
          action: 'validation_success',
          duration: `${(performance.now() - startTime).toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
        });
        setEnvError(null);
        setErrors([]);
      }
    } catch (error) {
      // 予期せぬエラーの処理
      const errorMessage =
        error instanceof Error
          ? `環境変数の検証中にエラーが発生しました: ${error.message}`
          : '環境変数の検証中に不明なエラーが発生しました';

      logger.error(errorMessage, {
        error,
        component: 'EnvValidator',
        action: 'validation_exception',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      setEnvError(errorMessage);
    } finally {
      setIsValidating(false);
      setLastValidated(new Date());
    }
  }, []);

  // 初期化時に一度だけ検証を実行
  useEffect(() => {
    performValidation();
  }, [performValidation]);

  // 検証結果オブジェクトをメモ化
  const validationResult = useMemo(
    () => ({
      envError,
      errors,
      isValidating,
      lastValidated,
      validateManually: performValidation,
    }),
    [envError, errors, isValidating, lastValidated, performValidation]
  );

  return validationResult;
};
