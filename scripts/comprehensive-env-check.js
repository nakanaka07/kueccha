// @ts-check
/**
 * 包括的な環境変数検証スクリプト
 *
 * 用途:
 * - より詳細な環境変数の検証と型チェック
 * - 環境別（開発/テスト/本番）の設定の適切さを検証
 * - 値の形式や整合性の検証
 * - ガイドラインに沿った環境変数設定の確認
 */

// @ts-ignore
import { fileURLToPath } from 'url';
// @ts-ignore
import { dirname, resolve } from 'path';
// @ts-ignore
import * as dotenv from 'dotenv';
// @ts-ignore
import * as fs from 'fs';

// ESM環境でのファイルパス取得
// @ts-ignore import.meta型定義を無視
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// 環境変数の読み込み
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : process.env.NODE_ENV === 'test'
      ? '.env.test'
      : '.env.development';

dotenv.config({ path: resolve(rootDir, '.env') });
dotenv.config({ path: resolve(rootDir, envFile), override: true });
dotenv.config({ path: resolve(rootDir, `${envFile}.local`), override: true });

// 色付きコンソール出力のためのヘルパー
const consoleColors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * @typedef {Object} EnvVarConfig
 * @property {string} key - 環境変数のキー名
 * @property {boolean} [required=false] - 必須かどうか
 * @property {any} [defaultValue] - デフォルト値
 * @property {function(string): boolean} [validator] - 値の検証関数
 * @property {string} [validationMessage] - 検証失敗時のメッセージ
 * @property {string} [description] - 環境変数の説明
 * @property {string} [environment] - 特定の環境でのみ必要（'development' | 'production' | 'test'）
 */

/**
 * 環境変数を取得し検証する
 * @param {EnvVarConfig} config - 環境変数の設定
 * @returns {[boolean, any]} - [成功フラグ, 値]
 */
function validateEnvVar(config) {
  const { key, required = false, defaultValue, validator, validationMessage } = config;
  const value = process.env[key];

  // 値が存在しない場合の処理
  if (value === undefined) {
    if (required) {
      return [false, null]; // 必須なのに存在しない
    }
    return [true, defaultValue]; // 任意で値がない場合はデフォルト値を使用
  }

  // バリデーターが指定されている場合は検証
  if (validator && !validator(value)) {
    return [false, value]; // 検証失敗
  }

  return [true, value]; // 検証成功
}

/**
 * 環境変数の詳細検証
 * @returns {[string[], string[], string[]]} - [エラー配列, 警告配列, 情報配列]
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const infos = [];
  const currentEnv = process.env.NODE_ENV || 'development';

  // チェックする環境変数の定義
  /** @type {EnvVarConfig[]} */
  const envVarConfigs = [
    // Google Maps関連
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
      key: 'VITE_GOOGLE_SPREADSHEET_ID',
      required: true,
      validator: value => value.length > 10,
      validationMessage: 'Google SpreadsheetのIDが正しくありません。',
      description: 'データソースとなるGoogleスプレッドシートID',
    },

    // ロギング設定
    {
      key: 'VITE_LOG_LEVEL',
      required: false,
      defaultValue: 'info',
      validator: value => ['debug', 'info', 'warn', 'error'].includes(value.toLowerCase()),
      validationMessage:
        'ログレベルの値が無効です。debug/info/warn/errorのいずれかを設定してください。',
      description: 'ログレベル設定（debug/info/warn/error）',
    },

    // デバッグ設定
    {
      key: 'VITE_DEBUG_MODE',
      required: false,
      defaultValue: 'false',
      validator: value => ['true', 'false'].includes(value.toLowerCase()),
      validationMessage: 'デバッグモードの値はtrue/falseで設定してください。',
      description: 'デバッグモードの有効/無効',
      environment: 'development',
    },

    // 機能フラグ
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

    // アプリケーション情報
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

    // PWA設定
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

  // 環境変数のチェック
  envVarConfigs.forEach(config => {
    // 指定された環境でのみチェックする場合
    if (config.environment && config.environment !== currentEnv) {
      return;
    }

    const [isValid, value] = validateEnvVar(config);

    // エラーの場合
    if (!isValid && config.required) {
      const message =
        config.validationMessage || `${config.key}が設定されていないか、無効な値です。`;
      errors.push(`${config.key}: ${message}`);
      return;
    }

    // 警告の場合（必須ではないが検証失敗）
    if (!isValid && !config.required) {
      const message = config.validationMessage || `${config.key}の値が最適ではありません。`;
      warnings.push(
        `${config.key}: ${message} デフォルト値の${config.defaultValue}が使用されます。`
      );
      return;
    }

    // 情報（有効な設定）
    if (value !== undefined) {
      infos.push(`${config.key}: ${config.description || ''}`);
    }
  });

  return [errors, warnings, infos];
}

/**
 * 環境変数ファイルの存在チェック
 */
function checkEnvFiles() {
  const warnings = [];
  const infos = [];

  // 確認すべき環境変数ファイル
  const envFiles = ['.env', '.env.development', '.env.production', '.env.test', '.env.example'];

  // ファイルの存在確認
  envFiles.forEach(file => {
    const filePath = resolve(rootDir, file);
    if (fs.existsSync(filePath)) {
      infos.push(`${file}ファイルが存在します。`);
    } else {
      if (file === '.env.example') {
        warnings.push(
          `${file}ファイルが存在しません。新規開発者向けのサンプル環境変数ファイルを作成することを推奨します。`
        );
      } else if (file === '.env') {
        warnings.push(`${file}ファイルが存在しません。基本設定が不足している可能性があります。`);
      } else {
        warnings.push(
          `${file}ファイルが存在しません。環境別の最適な設定が行われていない可能性があります。`
        );
      }
    }
  });

  return [warnings, infos];
}

/**
 * 環境固有の設定の整合性チェック
 */
function checkEnvironmentConsistency() {
  const warnings = [];
  const currentEnv = process.env.NODE_ENV || 'development';

  // 環境別の推奨設定
  const envRecommendations = {
    development: {
      VITE_LOG_LEVEL: 'debug',
      VITE_DEBUG_MODE: 'true',
    },
    production: {
      VITE_LOG_LEVEL: 'warn',
      VITE_DEBUG_MODE: 'false',
      VITE_ENABLE_MARKER_CLUSTERING: 'true',
    },
    test: {
      VITE_LOG_LEVEL: 'error',
    },
  };

  // 現在の環境に対する推奨設定をチェック
  const recommendations = envRecommendations[currentEnv] || {};

  Object.entries(recommendations).forEach(([key, recommendedValue]) => {
    const actualValue = process.env[key];
    if (actualValue && actualValue !== recommendedValue) {
      warnings.push(
        `${key}の値が${currentEnv}環境での推奨値（${recommendedValue}）と異なります。現在の値: ${actualValue}`
      );
    }
  });

  return warnings;
}

/**
 * メイン検証関数
 */
function main() {
  try {
    console.log(
      `${consoleColors.bright}${consoleColors.cyan}🔍 包括的な環境変数検証を開始します...${consoleColors.reset}`
    );
    console.log(
      `${consoleColors.blue}現在の環境: ${process.env.NODE_ENV || 'development'}${consoleColors.reset}\n`
    );

    // 環境変数の検証
    const [errors, warnings, infos] = validateEnvironment();

    // 環境変数ファイルの確認
    const [fileWarnings, fileInfos] = checkEnvFiles();

    // 環境固有の設定の整合性チェック
    const consistencyWarnings = checkEnvironmentConsistency();

    // エラーの表示
    if (errors.length > 0) {
      console.error(`${consoleColors.red}❌ 環境変数エラー:${consoleColors.reset}`);
      errors.forEach(err => console.error(`   - ${err}`));
      console.log('');
    }

    // 警告の表示
    if (warnings.length > 0 || fileWarnings.length > 0 || consistencyWarnings.length > 0) {
      console.warn(`${consoleColors.yellow}⚠️ 環境変数の警告:${consoleColors.reset}`);
      warnings.forEach(warn => console.warn(`   - ${warn}`));
      fileWarnings.forEach(warn => console.warn(`   - ${warn}`));
      consistencyWarnings.forEach(warn => console.warn(`   - ${warn}`));
      console.log('');
    }

    // 情報の表示
    if (infos.length > 0) {
      console.log(`${consoleColors.green}ℹ️ 環境変数の情報:${consoleColors.reset}`);
      infos.forEach(info => console.log(`   - ${info}`));
      fileInfos.forEach(info => console.log(`   - ${info}`));
      console.log('');
    }

    // 結果のサマリー
    if (errors.length === 0) {
      console.log(
        `${consoleColors.green}✅ 必須環境変数の検証に成功しました。${consoleColors.reset}`
      );
    } else {
      console.error(
        `${consoleColors.red}❌ ${errors.length}個の環境変数エラーがあります。修正してください。${consoleColors.reset}`
      );
      process.exit(1);
    }

    if (warnings.length > 0 || fileWarnings.length > 0 || consistencyWarnings.length > 0) {
      console.warn(
        `${consoleColors.yellow}⚠️ ${warnings.length + fileWarnings.length + consistencyWarnings.length}個の警告があります。改善を検討してください。${consoleColors.reset}`
      );
    }

    console.log(
      `${consoleColors.bright}${consoleColors.cyan}🎯 環境変数の検証が完了しました。${consoleColors.reset}`
    );
  } catch (error) {
    console.error(`${consoleColors.red}❌ 環境変数の検証中にエラーが発生しました:`, error);
    process.exit(1);
  }
}

// 検証の実行
main();
