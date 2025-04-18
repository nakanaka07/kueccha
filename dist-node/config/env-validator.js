import { configLogger } from './config-logger';
/**
 * 環境変数検証エラーの種類
 */
export var EnvValidationErrorType;
(function (EnvValidationErrorType) {
  EnvValidationErrorType['MISSING'] = 'missing';
  EnvValidationErrorType['INVALID_FORMAT'] = 'invalid_format';
  EnvValidationErrorType['INSUFFICIENT_PERMISSION'] = 'insufficient_permission';
})(EnvValidationErrorType || (EnvValidationErrorType = {}));
/**
 * 環境変数のデフォルト値（フォールバック用）
 * 注意: 本番環境では実際の値が必須です。これはローカル開発時の便宜のためです。
 */
const ENV_FALLBACKS = {
  VITE_GOOGLE_API_KEY: 'dummy-api-key-for-development-only',
  // 他のフォールバック値があれば追加
};
/**
 * 環境変数のバリデーション実行時間を測定するための開始時間
 */
let validationStartTime;
/**
 * 必須環境変数の検証を行う
 * @param env 環境変数オブジェクト
 * @returns バリデーション結果（フォールバック適用済みの環境変数を含む）
 */
export function validateEnv(env) {
  // パフォーマンス測定開始
  validationStartTime = performance.now();
  // 検証コンテキストの初期化
  const validationContext = {
    component: 'env-validator',
    fallbacksApplied: {},
  };
  // 開発環境と本番環境で必要な変数
  const requiredVars = ['VITE_GOOGLE_API_KEY'];
  // 本番環境でのみ必要な変数
  const prodOnlyVars = [];
  // エラー収集用配列
  const errors = [];
  // 環境変数のコピーを作成（フォールバック値適用のため）
  const validatedEnv = { ...env };
  // 必須環境変数のチェックと問題の収集
  const missingVars = requiredVars.filter(key => {
    const isMissing =
      !Object.prototype.hasOwnProperty.call(env, key) ||
      (Object.prototype.hasOwnProperty.call(env, key) && !env[key]);
    if (isMissing) {
      errors.push({
        key,
        type: EnvValidationErrorType.MISSING,
        message: `環境変数 "${key}" が未設定です`,
        severity: env.NODE_ENV === 'production' ? 'critical' : 'warning',
        recommendation: `${key}を.envファイルに追加するか、環境変数として設定してください`,
        fallbackAvailable: key in ENV_FALLBACKS,
      });
    }
    return isMissing;
  });
  // 本番環境の場合は追加の変数をチェック
  if (env.NODE_ENV === 'production') {
    const missingProdVars = prodOnlyVars.filter(key => {
      const isMissing =
        !Object.prototype.hasOwnProperty.call(env, key) ||
        (Object.prototype.hasOwnProperty.call(env, key) && !env[key]);
      if (isMissing) {
        errors.push({
          key,
          type: EnvValidationErrorType.MISSING,
          message: `本番環境必須の環境変数 "${key}" が未設定です`,
          severity: 'critical',
          recommendation: `CI/CDの環境変数設定を確認してください`,
          fallbackAvailable: key in ENV_FALLBACKS,
        });
      }
      return isMissing;
    });
    missingVars.push(...missingProdVars);
  }
  validationContext.errors = errors;
  validationContext.missingVars = missingVars;
  // 回復戦略の実装（段階的回復アプローチ）
  let startupMode = 'normal';
  let recoveryAttempted = false;
  if (errors.length > 0) {
    recoveryAttempted = true;
    // 段階1: フォールバック値の適用を試みる
    const criticalErrors = errors.filter(
      err => err.severity === 'critical' && !err.fallbackAvailable
    );
    // フォールバック適用
    errors.forEach(err => {
      if (err.fallbackAvailable && ENV_FALLBACKS[err.key]) {
        validatedEnv[err.key] = ENV_FALLBACKS[err.key];
        if (!validationContext.fallbacksApplied) {
          validationContext.fallbacksApplied = {};
        }
        validationContext.fallbacksApplied[err.key] = ENV_FALLBACKS[err.key];
      }
    });
    // アプリケーションモードの決定
    if (criticalErrors.length > 0 && env.NODE_ENV === 'production') {
      // 回復不能な重大エラーあり（本番環境）
      startupMode = 'limited';
    } else if (Object.keys(validationContext.fallbacksApplied || {}).length > 0) {
      // フォールバック値適用のため制限付きで動作可能
      startupMode = 'fallback';
    }
    // エラー情報をログに出力
    const errorMsg = `環境変数バリデーションエラー: ${errors.map(e => e.key).join(', ')}`;
    configLogger.error(errorMsg, {
      ...validationContext,
      recoveryAttempted,
      recoverySuccessful: startupMode !== 'limited',
      startupMode,
    });
    // 本番環境で回復不能な場合のみ例外をスロー
    if (startupMode === 'limited' && env.NODE_ENV === 'production') {
      const criticalErrorMsg = `回復不能な環境変数エラー: ${criticalErrors.map(e => e.key).join(', ')}`;
      throw new Error(criticalErrorMsg);
    }
  } else {
    // エラーなし
    configLogger.info('環境変数バリデーション完了', {
      component: 'env-validator',
      validated: true,
      startupMode,
    });
  }
  // パフォーマンス測定終了
  const duration = performance.now() - validationStartTime;
  const perfContext = {
    component: 'env-validator',
    duration,
    operationType: 'env-validation',
  };
  // パフォーマンス情報をログに記録
  configLogger.debug(`環境変数検証処理完了 (${duration.toFixed(2)}ms)`, perfContext);
  return {
    isValid: errors.length === 0,
    validatedEnv,
    errors,
    startupMode,
  };
}
