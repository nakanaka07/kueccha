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
 * - CI/CD環境での段階的な回復戦略
 * - 構造化されたエラー情報の収集と出力
 *
 * 最適化ガイドライン:
 * - シンプルさ優先の原則（KISS）に基づく明確な処理分割
 * - 必要な機能のみを実装（YAGNI原則）
 * - エラー境界と段階的な回復戦略の実装
 *
 * 使用方法: node scripts/error-check.js [options]
 * Options:
 *  --skip-npm-check  依存関係チェックをスキップ
 *  --ci              CI環境での実行モードを有効化
 *  --log-file=PATH   エラーログをファイルに出力（例: --log-file=./errors.log）
 *  --summary         エラーの概要のみを表示（詳細は抑制）
 */

/* eslint-disable no-undef */
// Node.jsのグローバルオブジェクトを明示的に宣言
// ESLintの 'no-undef' エラーを解決するため

import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import chalk from 'chalk';

// 環境検出関数
function detectEnvironment() {
  // CI環境検出
  const isCI =
    process.env.CI === 'true' ||
    !!process.env.GITHUB_ACTIONS ||
    !!process.env.GITLAB_CI ||
    !!process.env.JENKINS_URL ||
    !!process.env.CIRCLECI;

  // Node環境検出
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    isCI,
    nodeEnv,
    platform: os.platform(),
    isWindows: os.platform() === 'win32',
    isMac: os.platform() === 'darwin',
    isLinux: os.platform() === 'linux',
  };
}

// スクリプト実行時のオプション解析
function parseOptions() {
  const args = process.argv.slice(2);
  const result = {
    skipNpmCheck: args.includes('--skip-npm-check'),
    ciMode: args.includes('--ci'),
    summaryOnly: args.includes('--summary'),
    logFile: null,
  };

  // ログファイルオプションの解析
  const logFileArg = args.find(arg => arg.startsWith('--log-file='));
  if (logFileArg) {
    result.logFile = logFileArg.split('=')[1];
  }

  return result;
}

// 環境情報とオプション
const env = detectEnvironment();
const options = parseOptions();

// CI環境の場合は自動的にCIモードを有効化
if (env.isCI && !options.ciMode) {
  options.ciMode = true;
}

// エラー情報を構造化するクラス
class ErrorInfo {
  constructor(name, message, details = null, severity = 'error') {
    this.name = name;
    this.message = message;
    this.details = details;
    this.timestamp = new Date();
    this.severity = severity; // 'error', 'warning', 'info'
  }

  toString() {
    return `[${this.severity.toUpperCase()}] ${this.name}: ${this.message}`;
  }

  // JSON形式にシリアライズ
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      severity: this.severity,
    };
  }
}

// エラーログ記録用クラス
class ErrorLogger {
  constructor() {
    this.errors = [];
  }

  add(errorInfo) {
    this.errors.push(errorInfo);
    return errorInfo;
  }

  // エラーログをファイルに保存
  saveToFile(filePath) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const content = JSON.stringify(
        this.errors.map(e => e.toJSON()),
        null,
        2
      );
      fs.writeFileSync(filePath, content);
      return true;
    } catch (err) {
      console.error(chalk.red(`エラーログの保存に失敗しました: ${err.message}`));
      return false;
    }
  }

  // エラー数を集計
  getSummary() {
    const counts = {
      total: this.errors.length,
      error: 0,
      warning: 0,
      info: 0,
    };

    this.errors.forEach(error => {
      counts[error.severity] = (counts[error.severity] || 0) + 1;
    });

    return counts;
  }

  // リセット
  clear() {
    this.errors = [];
  }
}

// グローバルエラーロガーのインスタンス
const errorLogger = new ErrorLogger();

// 強化されたログ出力関数 - プロジェクトのロギングガイドラインに準拠
const logger = {
  info: (message, details = null) => {
    if (options.summaryOnly && !options.ciMode) return;
    console.info(chalk.blue(message));
    return errorLogger.add(new ErrorInfo('INFO', message, details, 'info'));
  },

  success: (message, details = null) => {
    if (options.summaryOnly && !options.ciMode) return;
    console.info(chalk.green(`${message} ✅`));
    return errorLogger.add(new ErrorInfo('SUCCESS', message, details, 'info'));
  },

  warning: (message, details = null) => {
    if (options.summaryOnly && !options.ciMode) return;
    console.warn(chalk.yellow(message));
    return errorLogger.add(new ErrorInfo('WARNING', message, details, 'warning'));
  },

  error: (message, error = null) => {
    console.error(chalk.red(message));

    let details = null;
    if (error) {
      if (!options.summaryOnly || options.ciMode) {
        console.error(chalk.red(`  詳細: ${error.message || error}`));
        if (error.stack && !options.summaryOnly) {
          console.error(chalk.red(`  スタック: ${error.stack.split('\n')[1]}`));
        }
      }

      details = {
        message: error.message || (typeof error === 'string' ? error : JSON.stringify(error)),
        stack: error.stack,
        code: error.code,
      };
    }

    return errorLogger.add(new ErrorInfo('ERROR', message, details, 'error'));
  },
  debug: (message, data = null) => {
    if (options.summaryOnly || options.ciMode) return;
    console.info(chalk.cyan(`[DEBUG] ${message}`));
    if (data) console.info(chalk.cyan('[DEBUG DATA]'), data);
    return errorLogger.add(new ErrorInfo('DEBUG', message, data, 'info'));
  },
};

/**
 * チェック実行関数 - 段階的な回復戦略を実装
 * @param {Object} check チェック設定オブジェクト
 * @param {number} retryCount 再試行回数
 * @returns {Promise<Object>} チェック結果オブジェクト
 */
async function runCheck(check, retryCount = 0) {
  const { name, command, required, recoveryCommands } = check;
  const maxRetries = check.maxRetries || 1;

  logger.warning(
    `${name}を実行中...${retryCount > 0 ? `(再試行: ${retryCount}/${maxRetries})` : ''}`
  );

  try {
    // コマンド実行前に環境変数を設定（CI環境用の最適化）
    const env = { ...process.env };
    if (options.ciMode) {
      env.CI = 'true';
      env.FORCE_COLOR = '1'; // CIでもカラー出力を強制
    }

    const startTime = Date.now();
    execSync(command, {
      stdio: options.summaryOnly ? 'pipe' : 'inherit',
      env,
    });
    const duration = Date.now() - startTime;

    logger.success(`${name}完了 - エラーなし (${duration}ms)`);

    return {
      success: true,
      name,
      duration,
      retryCount,
    };
  } catch (error) {
    // 失敗時の詳細情報を収集
    const errorInfo = {
      command,
      errorCode: error.status || error.code,
      errorMessage: error.message,
      stdout: error.stdout ? error.stdout.toString() : null,
      stderr: error.stderr ? error.stderr.toString() : null,
    };

    logger.error(`${name}でエラーが発生しました`, error);

    // 回復戦略の実行
    if (recoveryCommands && recoveryCommands.length > 0 && retryCount < maxRetries) {
      logger.warning(`${name}の回復処理を試みます...`);

      try {
        // 回復コマンドを順次実行
        for (const recoveryCmd of recoveryCommands) {
          logger.info(`回復コマンド実行: ${recoveryCmd}`);
          execSync(recoveryCmd, { stdio: 'inherit' });
        }

        // 回復処理後に再試行
        return await runCheck(check, retryCount + 1);
      } catch (recoveryError) {
        logger.error(`回復処理に失敗しました`, recoveryError);
      }
    }

    return {
      success: false,
      name,
      error: errorInfo,
      required,
      retryCount,
    };
  }
}

/**
 * 回復戦略パターンの定義
 * チェック失敗時の回復方法を提供
 */
const recoveryStrategies = {
  typeScript: [
    'npx tsc --noEmit --incremental', // 増分ビルドを試行
  ],
  esLint: [
    'npx eslint . --ext .js,.jsx,.ts,.tsx --fix', // 自動修正を試行
  ],
  dependencies: [
    'npm install', // 依存関係の再インストールを試行
  ],
};

// メイン処理
async function main() {
  const startTime = Date.now();

  logger.info('=== 佐渡で食えっちゃプロジェクト エラーチェック ===');
  logger.info(`開始時刻: ${new Date().toLocaleString()}`);
  logger.info(
    `実行環境: ${env.nodeEnv}${env.isCI ? ' (CI環境)' : ''}${options.ciMode ? ' (CIモード)' : ''}`
  );
  console.info('');

  // より高度なチェック項目とその実行順序を定義
  const checks = [
    {
      name: 'TypeScriptエラーチェック',
      command: 'npx tsc --noEmit',
      required: true,
      maxRetries: 2,
      recoveryCommands: recoveryStrategies.typeScript,
    },
    {
      name: 'ESLintチェック',
      command: 'npx eslint . --ext .js,.jsx,.ts,.tsx',
      required: true,
      maxRetries: 1,
      recoveryCommands: recoveryStrategies.esLint,
    },
    {
      name: '依存関係チェック',
      command: 'npx npm-check',
      required: false,
      skip: options.skipNpmCheck,
      maxRetries: 1,
      recoveryCommands: recoveryStrategies.dependencies,
    },
  ];

  // 結果統計の初期化
  const results = {
    total: checks.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    partiallySuccessful: 0,
    requiredFailed: 0,
    details: [],
  };

  // 各チェック項目を実行
  for (const check of checks) {
    if (check.skip) {
      logger.info(`${check.name}をスキップしました`);
      results.skipped++;
      results.details.push({
        name: check.name,
        status: 'skipped',
        required: check.required,
      });
      continue;
    }

    const result = await runCheck(check);
    results.details.push({
      name: check.name,
      status: result.success ? 'success' : 'failed',
      required: check.required,
      retryCount: result.retryCount,
    });

    if (result.success) {
      results.successful++;
      if (result.retryCount > 0) {
        results.partiallySuccessful++;
      }
    } else {
      results.failed++;
      if (check.required) {
        results.requiredFailed++;
      }
    }
  }

  // 終了処理と結果の表示
  const duration = Date.now() - startTime;
  console.info('');

  // エラーログのファイル出力
  if (options.logFile) {
    const logFilePath = path.resolve(options.logFile);
    if (errorLogger.saveToFile(logFilePath)) {
      logger.info(`エラーログを保存しました: ${logFilePath}`);
    }
  }

  // 結果サマリーの表示
  logger.info(
    `チェック完了: ${results.successful}/${results.total} 成功 (${results.skipped} スキップ)`
  );
  logger.info(`実行時間: ${(duration / 1000).toFixed(2)}秒`);

  if (results.partiallySuccessful > 0) {
    logger.warning(`注意: ${results.partiallySuccessful}つのチェックは回復処理後に成功しました`);
  }

  // 重大なエラーの有無で終了ステータスを決定
  if (results.requiredFailed > 0) {
    logger.error(
      `必須チェック(${results.requiredFailed}件)でエラーが発生しました。上記のエラーを修正してください。`
    );

    // CIモードの場合は詳細なエラーサマリーを表示
    if (options.ciMode) {
      console.error(chalk.red('=== エラーサマリー ==='));
      results.details
        .filter(d => d.status === 'failed' && d.required)
        .forEach(detail => {
          console.error(chalk.red(`- ${detail.name}`));
        });
    }

    process.exit(1);
  } else if (results.failed > 0) {
    logger.warning(
      `非必須チェック(${results.failed}件)でエラーが発生しました。問題ないか確認してください。`
    );
    process.exit(0); // 非必須エラーのみなので正常終了
  } else {
    logger.success('すべてのチェックが正常に完了しました！');
  }
}

// スクリプトを実行
main().catch(error => {
  logger.error('エラーチェック中に予期しない問題が発生しました：', error);
  process.exit(1);
});
