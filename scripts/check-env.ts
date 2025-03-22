import fs from 'node:fs';
import path from 'node:path';

import { APP_CONFIG } from '../src/config/app.config';
import { logError, logInfo, logWarn } from '../src/utils/logger';

/**
 * 環境変数の検証と処理
 * GitHub Pages向けに最適化
 *
 * @param env 環境変数オブジェクト
 * @returns 処理済み環境変数
 * @throws 必須環境変数が不足している場合にエラーをスロー
 */
export function validateEnv(env: Record<string, string | undefined>): Record<string, string> {
  try {
    // CI/CD環境の検出 (GitHub Actions)
    const isCI = env.CI === 'true' || env.GITHUB_ACTIONS === 'true';

    // 必須環境変数のチェック
    const missingRequired = APP_CONFIG.REQUIRED_ENV.filter((key: string) => !env[key]);
    if (missingRequired.length > 0) {
      const errorMsg = isCI
        ? `CI環境で必須環境変数が不足しています: ${missingRequired.join(', ')}\nGitHub Secretsに設定してください。`
        : `必須環境変数が設定されていません: ${missingRequired.join(', ')}\n.env.exampleを確認し、.envファイルに設定してください。`;

      throw new Error(errorMsg);
    }

    // .env.exampleとの整合性チェック (開発環境でのみ実行)
    if (!isCI) {
      const envExamplePath = path.resolve(process.cwd(), '.env.example');
      if (fs.existsSync(envExamplePath)) {
        const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
        const missingFromExample = [...APP_CONFIG.REQUIRED_ENV, ...APP_CONFIG.OPTIONAL_ENV].filter(
          (key: string) => !envExampleContent.includes(key),
        );

        if (missingFromExample.length > 0) {
          logWarn(
            'CONFIG',
            'ENV_WARNING',
            `以下の環境変数が.env.exampleに記載されていません: ${missingFromExample.join(', ')}`,
          );
        }
      }
    }

    // デフォルト値の適用
    Object.entries(APP_CONFIG.ENV_DEFAULTS).forEach(([key, defaultValue]) => {
      if (!env[key]) {
        logInfo(
          'CONFIG',
          'ENV_DEFAULT',
          `環境変数 ${key} にデフォルト値「${defaultValue}」を適用しました`,
        );
        env[key] = defaultValue;
      }
    });

    // PWA関連の追加チェック
    if (env.NODE_ENV === 'production' && !env.BASE_PATH) {
      logWarn(
        'CONFIG',
        'PWA_WARNING',
        'BASE_PATHが設定されていません。PWA機能が正常に動作しない可能性があります。',
      );
      env.BASE_PATH = '/kueccha/'; // GitHub Pages用のデフォルトパス
    }

    // Viteのdefine用に環境変数を整形
    return [...APP_CONFIG.REQUIRED_ENV, ...APP_CONFIG.OPTIONAL_ENV].reduce(
      (acc, key: string) => {
        if (env[key]) acc[`process.env.${key}`] = JSON.stringify(env[key]);
        return acc;
      },
      {} as Record<string, string>,
    );
  } catch (error: unknown) {
    // エラーをログに記録し、再スロー
    const err = error as Error;
    logError('CONFIG', 'ENV_ERROR', err.message, err);
    throw error;
  }
}

// スクリプトが直接実行された場合の処理
if (require.main === module) {
  try {
    // 環境変数を読み込み
    const env = process.env;
    validateEnv(env);
    logInfo('CONFIG', 'ENV_CHECK', '✅ 環境変数の検証に成功しました');
    process.exit(0);
  } catch (error: unknown) {
    const err = error as Error;
    logError('CONFIG', 'ENV_CHECK', '❌ 環境変数の検証に失敗しました', err);
    process.exit(1);
  }
}