import { configLogger } from './config-logger';
/**
 * 必須環境変数の検証を行う
 * @param env 環境変数オブジェクト
 */
export function validateEnv(env) {
    // 開発環境と本番環境で必要な変数
    const requiredVars = ['VITE_GOOGLE_API_KEY'];
    // 本番環境でのみ必要な変数
    const prodOnlyVars = [];
    // 必須環境変数のチェック
    const missingVars = requiredVars.filter(key => {
        // Object.prototype.hasOwnProperty.callを使用して安全にプロパティの存在を確認
        return (!Object.prototype.hasOwnProperty.call(env, key) ||
            // プロパティが存在する場合のみ値にアクセスする
            (Object.prototype.hasOwnProperty.call(env, key) && !env[key]));
    });
    // 本番環境の場合は追加の変数をチェック
    if (env.NODE_ENV === 'production') {
        const missingProdVars = prodOnlyVars.filter(key => {
            return (!Object.prototype.hasOwnProperty.call(env, key) ||
                (Object.prototype.hasOwnProperty.call(env, key) && !env[key]));
        });
        missingVars.push(...missingProdVars);
    }
    // 欠落している変数があればエラーをログに出力
    if (missingVars.length > 0) {
        const errorMsg = `必須環境変数が欠落しています: ${missingVars.join(', ')}`;
        configLogger.error(errorMsg, {
            component: 'env-validator',
            missingVars,
        });
        // 本番環境では致命的なエラーとする
        if (env.NODE_ENV === 'production') {
            throw new Error(errorMsg);
        }
    }
    configLogger.info('環境変数バリデーション完了', {
        component: 'env-validator',
        validated: true,
    });
}
