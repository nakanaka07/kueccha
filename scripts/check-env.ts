import fs from 'node:fs';
import path from 'node:path';

// 設定を直接定義して依存関係を削減
const APP_CONFIG = {
  REQUIRED_ENV: ['VITE_GOOGLE_API_KEY'] as const,
  OPTIONAL_ENV: [
    'VITE_GOOGLE_MAPS_MAP_ID',
    'VITE_GOOGLE_SPREADSHEET_ID',
    'VITE_EMAILJS_SERVICE_ID',
    'VITE_EMAILJS_TEMPLATE_ID',
    'VITE_EMAILJS_PUBLIC_KEY',
    'VITE_DEFAULT_ZOOM',
    'VITE_DEFAULT_CENTER_LAT',
    'VITE_DEFAULT_CENTER_LNG',
    'VITE_APP_TITLE',
  ] as const,
  ENV_DEFAULTS: {
    VITE_DEFAULT_ZOOM: '12',
    VITE_DEFAULT_CENTER_LAT: '38.0503',
    VITE_DEFAULT_CENTER_LNG: '138.3716',
    VITE_APP_TITLE: '佐渡で食えっちゃ',
  } as const,
};

// 型定義
type RequiredEnvKeys = typeof APP_CONFIG.REQUIRED_ENV[number];
type OptionalEnvKeys = typeof APP_CONFIG.OPTIONAL_ENV[number];
type ValidEnvKeys = RequiredEnvKeys | OptionalEnvKeys;

// 有効な環境変数キーのリストを定義
const VALID_ENV_KEYS = [...APP_CONFIG.REQUIRED_ENV, ...APP_CONFIG.OPTIONAL_ENV];

// 型定義
type LogCategory = 'CONFIG' | 'ENV' | 'PWA';
type LogCode = 'ENV_ERROR' | 'ENV_WARNING' | 'ENV_DEFAULT' | 'ENV_CHECK' | 'PWA_WARNING';

// セーフなenv値取得関数
function safeGetEnvValue(env: Record<string, string | undefined>, key: string): string | undefined {
  if (isValidEnvKey(key)) {
    // eslint-disable-next-line security/detect-object-injection
    return env[key];
  }
  return undefined;
}

// セーフなenv値設定関数
function safeSetEnvValue(env: Record<string, string | undefined>, key: string, value: string): void {
  if (isValidEnvKey(key)) {
    // eslint-disable-next-line security/detect-object-injection
    env[key] = value;
  }
}

// キーが有効な環境変数キーかどうかを判定する型ガード関数
function isValidEnvKey(key: string): key is ValidEnvKeys {
  return VALID_ENV_KEYS.includes(key as ValidEnvKeys);
}

// シンプルなロガー実装
const logInfo = (category: LogCategory, code: LogCode, message: string): void => 
  console.info(`[${category}:${code}] ${message}`);

const logWarn = (category: LogCategory, code: LogCode, message: string): void => 
  console.warn(`[${category}:${code}] ${message}`);

const logError = (category: LogCategory, code: LogCode, message: string, error?: Error | unknown): void => {
  console.error(`[${category}:${code}] ${message}`);
  if (error) console.error(error);
};

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
    const missingRequired = APP_CONFIG.REQUIRED_ENV.filter((key) => !safeGetEnvValue(env, key));
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
        const missingFromExample = VALID_ENV_KEYS.filter(
          (key) => !envExampleContent.includes(key),
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
      if (!safeGetEnvValue(env, key) && Object.prototype.hasOwnProperty.call(APP_CONFIG.ENV_DEFAULTS, key)) {
        logInfo(
          'CONFIG',
          'ENV_DEFAULT',
          `環境変数 ${key} にデフォルト値「${defaultValue}」を適用しました`,
        );
        safeSetEnvValue(env, key, defaultValue);
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
    return VALID_ENV_KEYS.reduce(
      (acc, key) => {
        const value = safeGetEnvValue(env, key);
        if (value) {
          acc[`process.env.${key}`] = JSON.stringify(value);
        }
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
    const env = { ...process.env } as Record<string, string | undefined>;
    validateEnv(env);
    logInfo('CONFIG', 'ENV_CHECK', '✅ 環境変数の検証に成功しました');
    process.exit(0);
  } catch (error: unknown) {
    const err = error as Error;
    logError('CONFIG', 'ENV_CHECK', '❌ 環境変数の検証に失敗しました', err);
    process.exit(1);
  }
}