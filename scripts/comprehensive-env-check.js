// @ts-check
/**
 * 統合環境変数検証スクリプト
 *
 * 機能：
 * - 開発およびビルド前に環境変数の設定を詳細に検証
 * - 必須環境変数が不足している場合にビルドを中断
 * - 環境別（開発/テスト/本番）の設定の適切さを検証
 * - Google Maps API設定の検証とセキュリティチェック
 * - ロギング設定の検証
 * - 環境変数ファイルの存在確認
 *
 * ガイドライン適合：
 * - 環境変数管理ガイドラインに準拠した型安全な検証
 * - ロガー使用ガイドラインに沿った構造化ログの出力
 * - Google Maps統合ガイドラインに基づくAPIキー検証
 */

// ESMモジュールインポート - シンプルにする
import * as fs from 'fs';
import process from 'node:process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import * as dotenv from 'dotenv';

// ESM環境でのファイルパス取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// 環境変数の読み込み
const nodeEnv = process.env.NODE_ENV || 'development';
const baseEnvFile = '.env';
const envFile = `.env.${nodeEnv}`;
const localEnvFile = `${envFile}.local`;

// 環境変数ファイルの読み込み処理
function loadEnvFiles() {
  // ベース環境変数を読み込み
  dotenv.config({ path: resolve(rootDir, baseEnvFile) });
  // 環境固有の環境変数を読み込み（優先）
  dotenv.config({ path: resolve(rootDir, envFile), override: true });
  // ローカル開発者固有の環境変数を読み込み（最優先）
  dotenv.config({ path: resolve(rootDir, localEnvFile), override: true });
}

// 環境変数ファイルを読み込む
loadEnvFiles();

/**
 * 構造化ロガーの実装
 * ロガー使用ガイドラインに準拠
 */
const logger = {
  error: (message, context = {}) => {
    const formattedContext = formatContext(context);
    process.stderr.write(`\x1b[31m[ERROR]\x1b[0m ${message}${formattedContext}\n`);
  },

  warn: (message, context = {}) => {
    const formattedContext = formatContext(context);
    process.stderr.write(`\x1b[33m[WARN]\x1b[0m ${message}${formattedContext}\n`);
  },

  info: (message, context = {}) => {
    const formattedContext = formatContext(context);
    process.stdout.write(`\x1b[34m[INFO]\x1b[0m ${message}${formattedContext}\n`);
  },

  debug: (message, context = {}) => {
    const formattedContext = formatContext(context);
    process.stdout.write(`\x1b[36m[DEBUG]\x1b[0m ${message}${formattedContext}\n`);
  },

  log: (message, context = {}) => {
    const formattedContext = formatContext(context);
    process.stdout.write(`\x1b[32m[OK]\x1b[0m ${message}${formattedContext}\n`);
  },

  // パフォーマンス計測 (ロガーガイドラインに準拠)
  measureTimeAsync: async (label, fn, context = {}) => {
    const start = process.hrtime();
    try {
      const result = await fn();
      const [seconds, nanoseconds] = process.hrtime(start);
      const durationMs = (seconds * 1000 + nanoseconds / 1000000).toFixed(2);
      logger.debug(`${label} - 完了`, { ...context, durationMs });
      return result;
    } catch (error) {
      const [seconds, nanoseconds] = process.hrtime(start);
      const durationMs = (seconds * 1000 + nanoseconds / 1000000).toFixed(2);
      logger.error(`${label} - エラー`, {
        ...context,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  measureTime: (label, fn, context = {}) => {
    const start = process.hrtime();
    try {
      const result = fn();
      const [seconds, nanoseconds] = process.hrtime(start);
      const durationMs = (seconds * 1000 + nanoseconds / 1000000).toFixed(2);
      logger.debug(`${label} - 完了`, { ...context, durationMs });
      return result;
    } catch (error) {
      const [seconds, nanoseconds] = process.hrtime(start);
      const durationMs = (seconds * 1000 + nanoseconds / 1000000).toFixed(2);
      logger.error(`${label} - エラー`, {
        ...context,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
};

/**
 * コンテキスト情報をフォーマットする
 * @param {Object} context - コンテキスト情報
 * @returns {string} フォーマット済みコンテキスト
 */
function formatContext(context) {
  if (!context || Object.keys(context).length === 0) return '';

  // エラーオブジェクトの特別処理
  if (context instanceof Error) {
    return ` - ${context.message}`;
  }
  // オブジェクトの場合はJSON形式に変換
  try {
    return ` - ${JSON.stringify(context)}`;
  } catch {
    // エラーの詳細は不要なので変数を省略
    return ` - [コンテキスト変換エラー]`;
  }
}

/**
 * 文字列をブール値に変換
 * @param {string} value - 変換する文字列
 * @returns {boolean} 変換後のブール値
 */
function toBool(value) {
  if (value === undefined || value === null) return false;
  return ['true', '1', 'yes'].includes(String(value).toLowerCase());
}

/**
 * 文字列が空白文字のみで構成されているかを確認
 * @param {string} str - 検査する文字列
 * @returns {boolean} 空白文字のみの場合はtrue、それ以外はfalse
 */
function isWhitespaceOnly(str) {
  if (str === null || str === undefined) return false;
  const strValue = String(str);
  if (strValue === '') return false;
  return strValue.trim() === '';
}

/**
 * 環境変数を型安全に取得する関数 (環境変数管理ガイドラインに準拠)
 * @template T
 * @param {Object} config - 設定オブジェクト
 * @param {string} config.key - 環境変数キー
 * @param {T} [config.defaultValue] - デフォルト値
 * @param {boolean} [config.required=false] - 必須かどうか
 * @param {(value: string) => T} [config.transform] - 変換関数
 * @returns {T} 環境変数の値
 */
function getEnvVar(config) {
  const { key, defaultValue, required = false, transform } = config;
  // キーの安全性チェック - 基本的なバリデーション
  if (typeof key !== 'string' || !key) {
    throw new Error('環境変数キーは文字列かつ空でない必要があります');
  }

  // 安全なアクセス方法に変更
  // Object.prototype.hasOwnPropertyで存在確認後、Object.getプロパティを使用して安全にアクセス
  const value = Object.prototype.hasOwnProperty.call(process.env, key)
    ? Object.getOwnPropertyDescriptor(process.env, key)?.value
    : undefined;

  // 未設定で必須の場合
  if (value === undefined) {
    if (required) {
      throw new Error(`必須環境変数 "${key}" が設定されていません`);
    }
    // defaultValueがundefinedでも型的に安全なように処理
    return /** @type {T} */ (defaultValue);
  }

  // 空文字列の場合
  if (value === '') {
    if (required) {
      throw new Error(`必須環境変数 "${key}" が空です`);
    }
    logger.warn(`環境変数 "${key}" が空です。デフォルト値を使用します。`, {
      component: 'EnvValidator',
      key,
      defaultValue,
    });
    // defaultValueがundefinedでも型的に安全なように処理
    return /** @type {T} */ (defaultValue);
  }

  // 変換関数がある場合は変換
  if (transform && value !== undefined) {
    try {
      return transform(value);
    } catch (error) {
      logger.error(`環境変数 "${key}" の変換中にエラー`, {
        component: 'EnvValidator',
        key,
        error,
      });
      // defaultValueがundefinedでも型的に安全なように処理
      return /** @type {T} */ (defaultValue);
    }
  }

  // 型変換なしの場合。valueはstringだが、Tとして扱われることを明示
  return /** @type {T} */ (value);
}

/**
 * @typedef {Object} EnvVarConfig
 * @property {string} key - 環境変数のキー名
 * @property {boolean} [required=false] - 必須かどうか
 * @property {any} [defaultValue] - デフォルト値
 * @property {function(string): boolean} [validator] - 値の検証関数
 * @property {string} [validationMessage] - 検証失敗時のメッセージ
 * @property {string} [description] - 環境変数の説明
 * @property {string} [environment] - 特定の環境でのみ必要
 */

/**
 * 環境変数設定の一元管理（カテゴリごとに分割）
 * @returns {EnvVarConfig[]} - 環境変数設定の配列
 */
function getEnvVarConfigs() {
  return [
    // Google Maps関連
    ...getGoogleMapsEnvConfigs(),

    // ロギング設定
    ...getLoggingEnvConfigs(),

    // 機能フラグとアプリケーション設定
    ...getFeatureFlagEnvConfigs(),

    // アプリケーション情報
    ...getAppInfoEnvConfigs(),
  ];
}

/**
 * Google Maps関連の環境変数設定
 * @returns {EnvVarConfig[]}
 */
function getGoogleMapsEnvConfigs() {
  return [
    {
      key: 'VITE_GOOGLE_API_KEY',
      required: true,
      validator: value => value.length > 10,
      validationMessage:
        'Google APIキーの形式が正しくありません。10文字以上のキーを設定してください。',
      description: 'Google APIキー（Maps API等で使用）',
    },
    {
      key: 'VITE_GOOGLE_MAPS_MAP_ID',
      required: false,
      validator: value => value.length > 5,
      validationMessage: 'Google Maps Map IDの形式が正しくない可能性があります。',
      description: 'Google Maps用のマップID（Advanced Markerで必要）',
    },
    {
      key: 'VITE_GOOGLE_API_KEY_RESTRICTIONS',
      required: false,
      validator: value => ['true', 'false'].includes(value.toLowerCase()),
      validationMessage: 'APIキー制限の値はtrue/falseで設定してください。',
      description: 'Google APIキーに制限が設定されているか（セキュリティ対策）',
    },
    {
      key: 'VITE_GOOGLE_MAPS_VERSION',
      required: false,
      defaultValue: 'weekly',
      validator: value =>
        ['weekly', 'quarterly', 'latest'].includes(value.toLowerCase()) || /^\d+\.\d+$/.test(value),
      validationMessage:
        'Maps APIバージョンは weekly, quarterly, latest または特定のバージョン番号を指定してください。',
      description: 'Google Maps APIバージョン',
    },
    {
      key: 'VITE_GOOGLE_SPREADSHEET_ID',
      required: true,
      validator: value => value.length > 10,
      validationMessage: 'Google SpreadsheetのIDが正しくありません。',
      description: 'データソースとなるGoogleスプレッドシートID',
    },
  ];
}

/**
 * ロギング関連の環境変数設定
 * @returns {EnvVarConfig[]}
 */
function getLoggingEnvConfigs() {
  return [
    {
      key: 'VITE_LOG_LEVEL',
      required: false,
      defaultValue: 'info',
      validator: value => ['debug', 'info', 'warn', 'error'].includes(value.toLowerCase()),
      validationMessage:
        'ログレベルの値が無効です。debug/info/warn/errorのいずれかを設定してください。',
      description: 'ログレベル設定（debug/info/warn/error）',
    },
    {
      key: 'VITE_DEBUG_MODE',
      required: false,
      defaultValue: 'false',
      validator: value => ['true', 'false'].includes(value.toLowerCase()),
      validationMessage: 'デバッグモードの値はtrue/falseで設定してください。',
      description: 'デバッグモードの有効/無効',
      environment: 'development',
    },
  ];
}

/**
 * 機能フラグ関連の環境変数設定
 * @returns {EnvVarConfig[]}
 */
function getFeatureFlagEnvConfigs() {
  return [
    {
      key: 'VITE_ENABLE_MARKER_CLUSTERING',
      required: false,
      defaultValue: 'true',
      validator: value => ['true', 'false'].includes(value.toLowerCase()),
      validationMessage: 'マーカークラスタリング設定はtrue/falseで設定してください。',
      description: 'マーカークラスタリングの有効/無効',
    },
    {
      key: 'VITE_ENABLE_OFFLINE_MODE',
      required: false,
      defaultValue: 'false',
      validator: value => ['true', 'false'].includes(value.toLowerCase()),
      validationMessage: 'オフラインモード設定はtrue/falseで設定してください。',
      description: 'オフラインモードの有効/無効',
    },
  ];
}

/**
 * アプリケーション情報関連の環境変数設定
 * @returns {EnvVarConfig[]}
 */
function getAppInfoEnvConfigs() {
  return [
    {
      key: 'VITE_APP_NAME',
      required: false,
      defaultValue: '佐渡で食えっちゃ',
      description: 'アプリケーション名称',
    },
    {
      key: 'VITE_APP_SHORT_NAME',
      required: false,
      defaultValue: '佐渡マップ',
      description: 'アプリケーション略称（PWA用）',
    },
    {
      key: 'VITE_ENABLE_PWA',
      required: false,
      defaultValue: 'false',
      validator: value => ['true', 'false'].includes(value.toLowerCase()),
      validationMessage: 'PWA機能設定はtrue/falseで設定してください。',
      description: 'PWA機能の有効/無効',
      environment: 'production',
    },
  ];
}

/**
 * 環境変数を検証する
 * @param {EnvVarConfig} config - 環境変数の設定
 * @returns {[boolean, string | null]} - [成功フラグ, エラーメッセージ]
 */
function validateEnvVar(config) {
  try {
    const { key, required = false, validator, validationMessage } = config;

    // 安全にアクセス
    const value = Object.prototype.hasOwnProperty.call(process.env, key)
      ? process.env[Object.prototype.hasOwnProperty.call(process.env, key) ? key : '']
      : undefined;

    // 値が存在しない場合の処理
    if (value === undefined) {
      if (required) {
        return [false, `必須環境変数 "${key}" が設定されていません。`];
      }
      return [true, null]; // 任意で値がない場合はOK
    }

    // バリデーターが指定されている場合は検証
    if (validator && !validator(value)) {
      return [false, validationMessage || `"${key}"の値が無効です。`];
    }

    return [true, null]; // 検証成功
  } catch (error) {
    return [false, `"${config.key}"の検証中にエラーが発生しました: ${error.message}`];
  }
}

/**
 * Google Maps APIキーセキュリティの検証
 * Google Maps統合ガイドラインに準拠
 * @param {string} apiKey - APIキー
 * @returns {{isSecure: boolean, warnings: string[]}} - 検証結果
 */
function checkApiKeySecurity(apiKey) {
  const warnings = [];
  let isSecure = true;

  // キーが未設定または空
  if (!apiKey || apiKey.trim() === '') {
    return {
      isSecure: false,
      warnings: ['Google Maps APIキーが設定されていません'],
    };
  }

  // キーの長度チェック (通常は39文字)
  if (apiKey.length < 20) {
    isSecure = false;
    warnings.push('APIキーは短すぎる可能性があります (通常は39文字)');
  }

  // 明らかに本番用でないキーかチェック (テスト用キーなど)
  if (apiKey.includes('test') || apiKey.includes('demo') || apiKey.includes('example')) {
    isSecure = false;
    warnings.push('APIキーにテスト/デモ関連の文字列が含まれています');
  }

  // 非推奨のワイルドカードパターンチェック
  const hasRestrictions = getEnvVar({
    key: 'VITE_GOOGLE_API_KEY_RESTRICTIONS',
    defaultValue: false,
    transform: toBool,
  });

  if (!hasRestrictions) {
    warnings.push(
      'APIキーに制限が設定されていない可能性があります (VITE_GOOGLE_API_KEY_RESTRICTIONS=true を設定)'
    );
    isSecure = nodeEnv !== 'production'; // 本番環境では制限が必須
  }

  return { isSecure, warnings };
}

/**
 * 必須環境変数を検証
 * @returns {{valid: boolean, missing: string[]}} - 検証結果
 */
function validateRequiredVars() {
  return logger.measureTime(
    '必須環境変数の検証',
    () => {
      const requiredConfigs = getEnvVarConfigs().filter(config => config.required);
      const missing = [];

      for (const config of requiredConfigs) {
        const [isValid] = validateEnvVar(config);
        if (!isValid) {
          missing.push(config.key);
        }
      }

      return {
        valid: missing.length === 0,
        missing,
      };
    },
    { component: 'EnvValidator', action: 'validate_required' }
  );
}

/**
 * Google Maps API関連の環境変数を検証
 * Google Maps統合ガイドラインに準拠
 * @returns {{isValid: boolean, warnings: string[]}} - 検証結果
 */
function validateGoogleMapsEnv() {
  return logger.measureTime(
    'Google Maps API設定の検証',
    () => {
      const warnings = [];
      let isValid = true;

      try {
        // APIキー検証
        const apiKey = getEnvVar({
          key: 'VITE_GOOGLE_API_KEY',
          defaultValue: '',
        });

        const apiKeySecurity = checkApiKeySecurity(apiKey);

        if (!apiKeySecurity.isSecure) {
          isValid = false;
          warnings.push(...apiKeySecurity.warnings);
        }

        // MapIDの検証
        const mapId = getEnvVar({
          key: 'VITE_GOOGLE_MAPS_MAP_ID',
          defaultValue: '',
        });

        // MapIDが存在し、かつ空白文字のみで構成されている場合
        if (mapId && isWhitespaceOnly(mapId)) {
          warnings.push('Google Maps MapIDが設定されていますが、空白文字のみです');
        }

        // Google Maps統合ガイドラインに基づくセキュリティチェック
        const apiKeyRestrictions = getEnvVar({
          key: 'VITE_GOOGLE_API_KEY_RESTRICTIONS',
          defaultValue: false,
          transform: toBool,
        });

        if (apiKey && apiKeyRestrictions === false && nodeEnv === 'production') {
          warnings.push(
            '本番環境ではGoogle Maps APIキーに制限の設定が強く推奨されます。' +
              'VITE_GOOGLE_API_KEY_RESTRICTIONS=trueを設定し、Google Cloud Consoleでリファラー制限を追加してください。'
          );
        }
      } catch (error) {
        isValid = false;
        warnings.push(
          `Google Maps設定の検証中にエラーが発生しました: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      return { isValid, warnings };
    },
    { component: 'EnvValidator', action: 'validate_google_maps' }
  );
}

/**
 * 環境固有の設定の整合性チェック
 * @returns {string[]} - 警告メッセージ配列
 */
function checkEnvironmentConsistency() {
  return logger.measureTime(
    '環境固有の設定の整合性確認',
    () => {
      const warnings = [];

      // 環境別の推奨設定 (環境変数管理ガイドラインに基づく)
      const envRecommendations = {
        development: {
          VITE_LOG_LEVEL: 'debug',
          VITE_DEBUG_MODE: 'true',
        },
        production: {
          VITE_LOG_LEVEL: 'warn',
          VITE_DEBUG_MODE: 'false',
          VITE_ENABLE_MARKER_CLUSTERING: 'true',
          VITE_GOOGLE_API_KEY_RESTRICTIONS: 'true',
        },
        test: {
          VITE_LOG_LEVEL: 'error',
        },
      }; // 現在の環境に対する推奨設定をチェック
      const recommendations = Object.prototype.hasOwnProperty.call(envRecommendations, nodeEnv)
        ? Object.getOwnPropertyDescriptor(envRecommendations, nodeEnv)?.value
        : {};
      Object.entries(recommendations).forEach(([key, recommendedValue]) => {
        // Object.getOwnPropertyDescriptor を使用して安全にアクセス
        const hasKey = Object.prototype.hasOwnProperty.call(process.env, key);
        const actualValue = hasKey
          ? Object.getOwnPropertyDescriptor(process.env, key)?.value
          : undefined;
        if (actualValue && actualValue !== recommendedValue) {
          warnings.push(
            `${key}の値が${nodeEnv}環境での推奨値（${recommendedValue}）と異なります。現在の値: ${actualValue}`
          );
        }
      });

      return warnings;
    },
    { component: 'EnvValidator', action: 'check_consistency', environment: nodeEnv }
  );
}

/**
 * 環境変数ファイルの存在チェック
 * @returns {[string[], string[]]} - [警告配列, 情報配列]
 */
function checkEnvFiles() {
  return logger.measureTime(
    '環境変数ファイルの確認',
    () => {
      const warnings = [];
      const infos = [];

      // 確認すべき環境変数ファイル
      const envFiles = ['.env', '.env.development', '.env.production', '.env.test', '.env.example'];

      // ファイルの存在確認
      envFiles.forEach(file => {
        const filePath = resolve(rootDir, file);
        if (fs.existsSync(filePath)) {
          infos.push(`${file} ファイルが存在します。`);
        } else {
          if (file === '.env.example') {
            warnings.push(
              `${file} ファイルが存在しません。新規開発者向けのサンプル環境変数ファイルを作成することを推奨します。`
            );
          } else if (file === '.env') {
            warnings.push(
              `${file} ファイルが存在しません。基本設定が不足している可能性があります。`
            );
          } else {
            warnings.push(
              `${file} ファイルが存在しません。環境別の最適な設定が行われていない可能性があります。`
            );
          }
        }
      });

      return [warnings, infos];
    },
    { component: 'EnvValidator', action: 'check_env_files' }
  );
}

/**
 * 環境変数の詳細検証
 * @returns {Promise<[string[], string[], string[]]>} - [エラー配列, 警告配列, 情報配列]
 */
async function validateEnvironment() {
  return logger.measureTimeAsync(
    '環境変数の詳細検証',
    async () => {
      const errors = [];
      const warnings = [];
      const infos = [];

      try {
        const envVarConfigs = getEnvVarConfigs();

        // 環境変数のチェック
        for (const config of envVarConfigs) {
          // 指定された環境でのみチェックする場合
          if (config.environment && config.environment !== nodeEnv) {
            continue;
          }

          const [isValid, errorMessage] = validateEnvVar(config);

          // エラーの場合
          if (!isValid && config.required) {
            errors.push(`${config.key}: ${errorMessage}`);
            continue;
          }

          // 警告の場合（必須ではないが検証失敗）
          if (!isValid && !config.required) {
            warnings.push(
              `${config.key}: ${errorMessage} デフォルト値の「${config.defaultValue}」が使用されます。`
            );
            continue;
          }

          // 情報（有効な設定）          // 安全にアクセス
          if (Object.prototype.hasOwnProperty.call(process.env, config.key)) {
            const value = process.env[config.key];
            if (value !== undefined) {
              // 値が存在する場合は有効な設定としてinfosに追加
              infos.push(`${config.key}: 有効な設定があります`);
            }
          }
        }

        // Google Maps特有のセキュリティ検証
        const mapsEnvCheck = validateGoogleMapsEnv();
        if (!mapsEnvCheck.isValid) {
          warnings.push(...mapsEnvCheck.warnings);
        }

        return [errors, warnings, infos];
      } catch (error) {
        errors.push(`環境変数の検証中にエラーが発生しました: ${error.message}`);
        return [errors, warnings, infos];
      }
    },
    { component: 'EnvValidator', action: 'validate_environment' }
  );
}

// YAGNI原則に基づき、現在使用されていない機能は削除
// 機密情報のマスク処理が必要になった時点で再実装する

/**
 * 検証結果の表示
 * @param {string[]} errors - エラーメッセージの配列
 * @param {string[]} warnings - 警告メッセージの配列
 * @param {string[]} infos - 情報メッセージの配列
 */
function displayResults(errors, warnings, infos) {
  // エラーの表示
  if (errors.length > 0) {
    logger.error(`環境変数エラー:`, { count: errors.length });
    errors.forEach(err => logger.error(`   - ${err}`));
    logger.info('');
  }

  // 警告の表示
  if (warnings.length > 0) {
    logger.warn(`環境変数の警告:`, { count: warnings.length });
    warnings.forEach(warn => logger.warn(`   - ${warn}`));
    logger.info('');
  }

  // 情報の表示
  if (infos.length > 0) {
    logger.info(`環境変数の情報:`, { count: infos.length });
    infos.forEach(info => logger.info(`   - ${info}`));
    logger.info('');
  }

  // 結果のサマリー
  if (errors.length === 0) {
    logger.log(`必須環境変数の検証に成功しました。`, { component: 'EnvValidator' });
  } else {
    logger.error(`${errors.length}個の環境変数エラーがあります。修正してください。`, {
      component: 'EnvValidator',
    });
  }

  if (warnings.length > 0) {
    logger.warn(`${warnings.length}個の警告があります。改善を検討してください。`, {
      component: 'EnvValidator',
    });
  }

  // クラスタリング設定の検証と表示
  const enableClustering = getEnvVar({
    key: 'VITE_ENABLE_MARKER_CLUSTERING',
    defaultValue: true,
    transform: toBool,
  });

  if (enableClustering) {
    logger.info('マーカークラスタリングが有効です。大量のPOI表示時のパフォーマンスが向上します。', {
      component: 'EnvValidator',
      featureFlag: 'markerClustering',
    });
  } else {
    logger.info(
      'マーカークラスタリングが無効です。必要に応じて VITE_ENABLE_MARKER_CLUSTERING=true を設定してください。',
      {
        component: 'EnvValidator',
        featureFlag: 'markerClustering',
      }
    );
  }
}

// 未使用の関数を削除 (YAGNI原則に従い、必要になるまで実装しない)

/**
 * メイン実行関数
 * @returns {Promise<void>}
 */
async function main() {
  try {
    logger.info(`環境変数の検証を開始します`, {
      environment: nodeEnv,
      envFiles: [baseEnvFile, envFile, nodeEnv !== 'production' ? localEnvFile : null].filter(
        Boolean
      ),
    });

    // 必須環境変数の検証
    const requiredVarsCheck = validateRequiredVars();
    if (!requiredVarsCheck.valid) {
      logger.error('以下の必須環境変数が設定されていません:', {
        component: 'EnvValidator',
        missingVars: requiredVarsCheck.missing,
      });

      requiredVarsCheck.missing.forEach(varName => {
        logger.error(`  - ${varName}`);
      });

      logger.error('.env ファイルを確認し、必要な環境変数を設定してください。');
      logger.error('サンプルとして .env.example ファイルを参照してください。');
      process.exit(1);
    }

    // 環境変数の詳細検証
    const [errors, warnings, infos] = await validateEnvironment();

    // 環境変数ファイルの確認
    const [fileWarnings, fileInfos] = checkEnvFiles();

    // 環境固有の設定の整合性チェック
    const consistencyWarnings = checkEnvironmentConsistency();

    // 結果の表示
    displayResults(
      errors,
      [...warnings, ...fileWarnings, ...consistencyWarnings],
      [...infos, ...fileInfos]
    );

    logger.info(`環境変数の検証が完了しました。`, {
      component: 'EnvValidator',
      errorsCount: errors.length,
      warningsCount: warnings.length + fileWarnings.length + consistencyWarnings.length,
    });

    // エラーがあればプロセスを終了
    if (errors.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    logger.error(`環境変数の検証中にエラーが発生しました:`, {
      component: 'EnvValidator',
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// 検証の実行
main();
