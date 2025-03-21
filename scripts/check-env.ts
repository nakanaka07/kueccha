/**
 * 環境変数の検証と処理
 * @param env 環境変数オブジェクト
 * @returns 処理済み環境変数
 * @throws 必須環境変数が不足している場合にエラーをスロー
 */
function validateEnv(env: Record<string, string | undefined>): Record<string, string> {
  // scripts/check-env.ts と連携して環境変数を検証
  try {
    // 必須環境変数のチェック
    const missingRequired = APP_CONFIG.REQUIRED_ENV.filter(key => !env[key]);
    if (missingRequired.length > 0) {
      throw new Error(
        `必須環境変数が設定されていません: ${missingRequired.join(', ')}\n` +
        `.env.exampleを確認し、開発環境では.envファイルに、本番環境ではGitHub Secretsに設定してください。`
      );
    }

    // .env.exampleとの整合性チェック
    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    if (fs.existsSync(envExamplePath)) {
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
      const missingFromExample = [...APP_CONFIG.REQUIRED_ENV, ...APP_CONFIG.OPTIONAL_ENV]
        .filter(key => !envExampleContent.includes(key));
      
      if (missingFromExample.length > 0) {
        logInfo('CONFIG', 'ENV_WARNING', `以下の環境変数が.env.exampleに記載されていません: ${missingFromExample.join(', ')}`);
      }
    }

    // デフォルト値の適用
    Object.entries(APP_CONFIG.ENV_DEFAULTS).forEach(([key, defaultValue]) => {
      if (!env[key]) {
        logInfo('CONFIG', 'ENV_DEFAULT', `環境変数 ${key} にデフォルト値「${defaultValue}」を適用しました`);
        env[key] = defaultValue;
      }
    });

    // Viteのdefine用に環境変数を整形
    return [...APP_CONFIG.REQUIRED_ENV, ...APP_CONFIG.OPTIONAL_ENV].reduce((acc, key) => {
      if (env[key]) acc[`process.env.${key}`] = JSON.stringify(env[key]);
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    // エラーをログに記録し、再スロー
    logError('CONFIG', 'ENV_ERROR', error.message, error);
    throw error;
  }
}