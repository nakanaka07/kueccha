/**
 * エラーチェック自動化スクリプト
 *
 * このスクリプトはTypeScriptコードのエラーチェックを自動化し、
 * プロジェクトの安定性維持を支援します。
 *
 * 特徴:
 * - 構成されたチェック処理の実行と結果表示
 * - チェック処理は個別の関数として実装し保守性を確保
 * - エラー発生時の詳細ログ出力
 *
 * 最適化ガイドライン:
 * - シンプルさ優先の原則（KISS）に基づく明確な処理分割
 * - 必要な機能のみを実装（YAGNI原則）
 *
 * 使用方法: node scripts/error-check.js [options]
 * Options:
 *  --skip-npm-check  依存関係チェックをスキップ
 */

/* eslint-disable no-undef */
// Node.jsのグローバルオブジェクトを明示的に宣言
// ESLintの 'no-undef' エラーを解決するため

import { execSync } from 'child_process';

import chalk from 'chalk';

// スクリプト実行時のオプション解析
const args = process.argv.slice(2);
const options = {
  skipNpmCheck: args.includes('--skip-npm-check'),
};

// ログ出力関数 - プロジェクトのロギングガイドラインに準拠
const logger = {
  info: message => {
    console.info(chalk.blue(message));
  },
  success: message => {
    console.info(chalk.green(`${message} ✅`));
  },
  warning: message => {
    console.warn(chalk.yellow(message));
  },
  error: (message, error) => {
    console.error(chalk.red(message));
    if (error && error.message) {
      console.error(chalk.red(`  詳細: ${error.message}`));
    }
  },
};

// チェック実行関数
async function runCheck(name, command) {
  logger.warning(`${name}を実行中...`);
  try {
    execSync(command, { stdio: 'inherit' });
    logger.success(`${name}完了 - エラーなし`);
    return true;
  } catch (error) {
    logger.error(`${name}でエラーが発生しました`, error);
    return false;
  }
}

// メイン処理
async function main() {
  logger.info('=== 佐渡で食えっちゃプロジェクト エラーチェック ===');
  logger.info(`開始時刻: ${new Date().toLocaleString()}`);
  console.info('');

  // チェック項目とその実行順序を定義
  const checks = [
    {
      name: 'TypeScriptエラーチェック',
      command: 'npx tsc --noEmit',
      required: true,
    },
    {
      name: 'ESLintチェック',
      command: 'npx eslint . --ext .js,.jsx,.ts,.tsx',
      required: true,
    },
    {
      name: '依存関係チェック',
      command: 'npx npm-check',
      required: false,
      skip: options.skipNpmCheck,
    },
  ];

  let hasErrors = false;

  // 各チェック項目を実行
  for (const check of checks) {
    if (check.skip) {
      logger.info(`${check.name}をスキップしました`);
      continue;
    }

    const success = await runCheck(check.name, check.command);
    if (!success && check.required) {
      hasErrors = true;
    }
  }

  console.info('');
  if (hasErrors) {
    logger.error('チェック中にエラーが発生しました。上記のエラーを修正してください。');
    process.exit(1);
  } else {
    logger.success('すべてのチェックが正常に完了しました！');
  }
}

// スクリプトを実行
main().catch(error => {
  logger.error('エラーチェック中に予期しない問題が発生しました：', error);
  process.exit(1);
});
