#!/usr/bin/env node

/**
 * 環境変数チェックスクリプト
 *
 * 機能:
 * - 必要な環境変数が設定されているかを確認
 * - 環境変数をカテゴリ別に検証
 * - フォールバック値の確認
 * - .env.exampleとの比較
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import chalk from 'chalk';
import dotenv from 'dotenv';

// 型定義
type EnvCategory = {
  name: string;
  variables: EnvVariable[];
};

type EnvVariable = {
  name: string;
  required: boolean;
  description?: string;
  example?: string;
  defaultValue?: string;
};

// 基本的なパスの設定
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const envFilePath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

/**
 * 環境変数の定義
 * カテゴリ別に環境変数を整理し、必須かどうかを指定
 */
const ENV_CATEGORIES: EnvCategory[] = [
  {
    name: 'Google Maps API',
    variables: [
      { name: 'VITE_GOOGLE_MAPS_API_KEY', required: true, description: '地図表示に必要なAPIキー' },
      {
        name: 'VITE_GOOGLE_MAPS_MAP_ID',
        required: true,
        description: 'カスタムマップスタイルのID',
      },
    ],
  },
  {
    name: 'Google Sheets API',
    variables: [
      {
        name: 'VITE_GOOGLE_SHEETS_API_KEY',
        required: true,
        description: 'Sheets APIアクセス用のキー',
      },
      {
        name: 'VITE_GOOGLE_SPREADSHEET_ID',
        required: true,
        description: 'データ取得元のスプレッドシートID',
      },
    ],
  },
  {
    name: 'EmailJS',
    variables: [
      { name: 'VITE_EMAILJS_SERVICE_ID', required: true, description: 'EmailJSのサービスID' },
      { name: 'VITE_EMAILJS_TEMPLATE_ID', required: true, description: 'メールテンプレートID' },
      { name: 'VITE_EMAILJS_PUBLIC_KEY', required: true, description: 'EmailJS公開キー' },
    ],
  },
  {
    name: 'アプリ設定',
    variables: [
      {
        name: 'VITE_APP_TITLE',
        required: false,
        description: 'アプリケーションのタイトル',
        defaultValue: 'Kueccha App',
      },
      {
        name: 'VITE_DEFAULT_ZOOM',
        required: false,
        description: '地図の初期ズームレベル',
        defaultValue: '13',
      },
      {
        name: 'VITE_DEFAULT_CENTER_LAT',
        required: false,
        description: '地図の初期中心位置（緯度）',
        defaultValue: '35.6812',
      },
      {
        name: 'VITE_DEFAULT_CENTER_LNG',
        required: false,
        description: '地図の初期中心位置（経度）',
        defaultValue: '139.7671',
      },
    ],
  },
];

/**
 * ファイルの存在確認を行う関数
 * @param filePath 確認するファイルのパス
 * @returns 存在すればtrue、そうでなければfalse
 */
function checkFileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * .envファイルと.env.exampleファイルからの環境変数を読み込む
 * @returns {Object} 現在の環境変数とサンプル環境変数
 */
function loadEnvironmentFiles(): {
  currentEnv: Record<string, string>;
  exampleEnv: Record<string, string>;
} {
  // 現在の.env読み込み（なければ空オブジェクト）
  const currentEnv = checkFileExists(envFilePath)
    ? dotenv.config({ path: envFilePath }).parsed || {}
    : {};

  // .env.exampleの読み込み（参照用、なければ空オブジェクト）
  const exampleEnv = checkFileExists(envExamplePath)
    ? dotenv.config({ path: envExamplePath }).parsed || {}
    : {};

  return { currentEnv, exampleEnv };
}

/**
 * 環境変数をチェックし、問題があれば報告する
 * @returns {boolean} すべての必須環境変数が設定されていればtrue
 */
function validateEnvironmentVariables(): boolean {
  const { currentEnv, exampleEnv } = loadEnvironmentFiles();

  // .envファイルの存在確認
  if (!checkFileExists(envFilePath)) {
    console.error(chalk.red('エラー: .envファイルが見つかりません。'));

    if (checkFileExists(envExamplePath)) {
      console.log(chalk.yellow('.env.exampleをコピーして.envファイルを作成してください:'));
      console.log(chalk.gray(`cp ${envExamplePath} ${envFilePath}`));
    } else {
      console.log(chalk.yellow('.envファイルを新規作成し、必要な環境変数を設定してください。'));
    }
    return false;
  }

  let hasErrors = false;
  let hasWarnings = false;

  // カテゴリ別に環境変数をチェック
  ENV_CATEGORIES.forEach((category) => {
    let categoryHasIssues = false;
    const missingRequired: string[] = [];
    const missingOptional: string[] = [];

    category.variables.forEach((variable) => {
      const envValue = process.env[variable.name] || currentEnv[variable.name];

      if (!envValue) {
        if (variable.required) {
          missingRequired.push(variable.name);
          categoryHasIssues = true;
          hasErrors = true;
        } else if (variable.defaultValue) {
          // オプションで、デフォルト値があるものは警告
          console.log(
            chalk.yellow(
              `警告: ${variable.name} が設定されていません。デフォルト値 "${variable.defaultValue}" が使用されます。`,
            ),
          );
          hasWarnings = true;
          categoryHasIssues = true;
        } else {
          // オプションだが、設定を推奨
          missingOptional.push(variable.name);
          hasWarnings = true;
          categoryHasIssues = true;
        }
      }
    });

    // カテゴリに問題があればレポート
    if (categoryHasIssues) {
      console.log(chalk.cyan(`\n[${category.name}]`));

      if (missingRequired.length > 0) {
        console.error(chalk.red('必須環境変数が設定されていません:'));
        missingRequired.forEach((varName) => {
          const variable = category.variables.find((v) => v.name === varName);
          const exampleValue = exampleEnv[varName] ? ` (例: ${exampleEnv[varName]})` : '';
          console.error(
            chalk.red(
              `  - ${varName}${variable?.description ? ': ' + variable.description : ''}${exampleValue}`,
            ),
          );
        });
      }

      if (missingOptional.length > 0) {
        console.log(chalk.yellow('推奨される環境変数が設定されていません:'));
        missingOptional.forEach((varName) => {
          const variable = category.variables.find((v) => v.name === varName);
          const exampleValue = exampleEnv[varName] ? ` (例: ${exampleEnv[varName]})` : '';
          console.log(
            chalk.yellow(
              `  - ${varName}${variable?.description ? ': ' + variable.description : ''}${exampleValue}`,
            ),
          );
        });
      }
    }
  });

  return !hasErrors;
}

/**
 * メイン実行関数
 */
function main(): void {
  console.log(chalk.blue('🔍 環境変数のチェックを実行中...'));

  const isValid = validateEnvironmentVariables();

  if (isValid) {
    console.log(chalk.green('✅ すべての必須環境変数が正しく設定されています'));
  } else {
    console.error(chalk.red('❌ 環境変数の設定に問題があります。上記のエラーを修正してください。'));
    process.exit(1);
  }
}

// スクリプト実行
main();
