/**
 * クライアント側で実行される環境変数検証
 * ブラウザ環境でも安全に動作するよう設計
 */
import { getEnvVar } from './core';
import { logger } from '@/utils/logger';
/**
 * クライアント側で必要な環境変数を検証する
 * @returns 検証結果（成功=true、失敗=false）
 */
export function validateClientEnv() {
  try {
    // クライアント側で必要な環境変数リスト（Viteプレフィックス付き）
    const requiredVars = ['VITE_GOOGLE_API_KEY'];
    // 必須環境変数のチェック
    const missingVars = requiredVars.filter(key => {
      try {
        const value = getEnvVar({ key, defaultValue: '' });
        return !value;
      } catch {
        return true;
      }
    });
    // 欠落している変数があればエラーをログに出力
    if (missingVars.length > 0) {
      const errorMsg = `必須環境変数が欠落しています: ${missingVars.join(', ')}`;
      logger.error(errorMsg, {
        component: 'client-env-validator',
        missingVars,
      });
      return false;
    }
    logger.info('クライアント環境変数バリデーション完了', {
      component: 'client-env-validator',
      validated: true,
    });
    return true;
  } catch (error) {
    logger.error('環境変数の検証中にエラーが発生しました', {
      component: 'client-env-validator',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}
