#!/usr/bin/env node
// @ts-check
/**
 * パフォーマンスレポート生成スクリプト
 *
 * 用途:
 * - アプリケーションのパフォーマンス測定データを解析
 * - ボトルネックの特定と最適化ポイントの提案
 * - パフォーマンスの時系列変化の追跡
 *
 * 実行方法:
 * - npm run perf:report
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { LogLevel } from '../src/utils/logger.js';

// ESM環境でのファイルパス取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

/**
 * ロギング設定
 * @type {import('../src/utils/logger').LogContext}
 */
const LOG_CONTEXT = {
  component: 'PerformanceReport',
  action: 'generate_report',
  timestamp: new Date().toISOString(),
};

/**
 * パフォーマンスログファイルのパス設定
 * 環境変数から設定を読み込み、存在しない場合はデフォルト値を使用
 */
const PERF_LOG_DIR = process.env.PERF_LOG_DIR || resolve(rootDir, 'logs');
const PERF_LOG_FILE = process.env.PERF_LOG_FILE || resolve(PERF_LOG_DIR, 'performance.json');
const REPORT_OUTPUT_DIR = process.env.REPORT_OUTPUT_DIR || resolve(rootDir, 'reports');

// パフォーマンス閾値設定（ミリ秒）
const PERF_THRESHOLDS = {
  critical: process.env.PERF_THRESHOLD_CRITICAL || 1000,
  warning: process.env.PERF_THRESHOLD_WARNING || 300,
  info: process.env.PERF_THRESHOLD_INFO || 100,
};

/**
 * コンソール出力用のESLint警告を回避するラッパー
 */
const consoleWrapper = {
  // eslint-disable-next-line no-console
  error: (msg, ...args) => console.error(msg, ...args),
  // eslint-disable-next-line no-console
  warn: (msg, ...args) => console.warn(msg, ...args),
  // eslint-disable-next-line no-console
  info: (msg, ...args) => console.info(msg, ...args),
  // eslint-disable-next-line no-console
  debug: (msg, ...args) => process.env.NODE_ENV !== 'production' && console.debug(msg, ...args),
  // eslint-disable-next-line no-console
  log: (msg, ...args) => console.log(msg, ...args),
};

/**
 * ロガーをインポートする
 * @returns {Promise<object>} ロガーインスタンス
 */
async function importLogger() {
  try {
    const { logger } = await import('../src/utils/logger.js');

    // スクリプト用にロガー設定を調整
    logger.configure({
      minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
      includeTimestamps: true,
      componentLevels: {
        PerformanceReport: LogLevel.DEBUG, // このコンポーネントのログは常に詳細に
      },
    });

    return logger;
  } catch (error) {
    // ロガーのインポートに失敗した場合のフォールバック
    consoleWrapper.error(
      'ロガーのインポートに失敗しました。シンプルなコンソール出力を使用します。',
      error
    );

    // シンプルなコンソールロガーを返す
    return {
      error: (msg, ctx) => consoleWrapper.error(`[ERROR] ${msg}`, ctx),
      warn: (msg, ctx) => consoleWrapper.warn(`[WARN] ${msg}`, ctx),
      info: (msg, ctx) => consoleWrapper.info(`[INFO] ${msg}`, ctx),
      debug: (msg, ctx) =>
        process.env.NODE_ENV !== 'production' && consoleWrapper.debug(`[DEBUG] ${msg}`, ctx),
      measureTime: (name, fn) => {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        consoleWrapper.debug(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
        return result;
      },
      measureTimeAsync: async (name, fn) => {
        const start = performance.now();
        try {
          const result = await (typeof fn === 'function' ? fn() : fn);
          const duration = performance.now() - start;
          consoleWrapper.debug(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
          return result;
        } catch (error) {
          const duration = performance.now() - start;
          consoleWrapper.error(`[ERROR] ${name} failed after ${duration.toFixed(2)}ms:`, error);
          throw error;
        }
      },
    };
  }
}

/**
 * ディレクトリの存在確認と作成
 * @param {string} dirPath 確認・作成するディレクトリのパス
 * @param {object} logger ロガーインスタンス
 */
async function ensureDirectoryExists(dirPath, logger) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    logger.debug(`ディレクトリを確認しました: ${dirPath}`, { ...LOG_CONTEXT });
  } catch (error) {
    logger.error(`ディレクトリの作成に失敗しました: ${dirPath}`, {
      ...LOG_CONTEXT,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * パフォーマンスログファイルの読み込み
 * @param {string} filePath ログファイルのパス
 * @param {object} logger ロガーインスタンス
 * @returns {Promise<Array<Object>>} パフォーマンスログデータ
 */
async function readPerformanceLog(filePath, logger) {
  return logger.measureTimeAsync(
    'パフォーマンスログの読み込み',
    async () => {
      try {
        // ファイルが存在するか確認
        try {
          await fs.access(filePath);
        } catch (error) {
          logger.warn(`パフォーマンスログファイルが見つかりません: ${filePath}`, {
            ...LOG_CONTEXT,
            action: 'file_access',
          });
          return [];
        }

        // 大きなファイルを効率的に処理するためのストリーム読み込み
        const logEntries = [];
        const readInterface = createInterface({
          input: createReadStream(filePath),
          crlfDelay: Infinity,
        });

        for await (const line of readInterface) {
          if (line.trim()) {
            try {
              const entry = JSON.parse(line);
              logEntries.push(entry);
            } catch (parseError) {
              logger.warn(`無効なJSONエントリをスキップしました`, {
                ...LOG_CONTEXT,
                line: line.substring(0, 100) + (line.length > 100 ? '...' : ''),
                error: parseError instanceof Error ? parseError.message : String(parseError),
              });
            }
          }
        }

        logger.info(`${logEntries.length}件のパフォーマンスログエントリを読み込みました`, {
          ...LOG_CONTEXT,
          action: 'read_complete',
          entryCount: logEntries.length,
        });

        return logEntries;
      } catch (error) {
        logger.error(`パフォーマンスログの読み込みに失敗しました`, {
          ...LOG_CONTEXT,
          filePath,
          error: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    },
    LogLevel.INFO,
    LOG_CONTEXT
  );
}

/**
 * レコメンデーションの型定義
 * @typedef {Object} Recommendation
 * @property {string} type - レコメンデーションのタイプ ('critical', 'warning', 'info' など)
 * @property {string} message - 推奨事項のメッセージ
 * @property {string[]} [affectedComponents] - 影響を受けるコンポーネントのリスト（オプション）
 * @property {string[]} [actions] - 推奨されるアクションのリスト（オプション）
 */

/**
 * パフォーマンスデータの分析
 * @param {Array<Object>} performanceData パフォーマンスログデータ
 * @param {object} logger ロガーインスタンス
 * @returns {Object} 分析結果
 */
function analyzePerformanceData(performanceData, logger) {
  return logger.measureTime(
    'パフォーマンスデータの分析',
    () => {
      // コンポーネント別のパフォーマンス統計を収集
      const componentStats = new Map();
      const actionStats = new Map();
      const slowestOperations = [];

      // 各エントリーを処理
      performanceData.forEach(entry => {
        if (!entry.durationMs || !entry.component) return;

        // コンポーネント統計の更新
        if (!componentStats.has(entry.component)) {
          componentStats.set(entry.component, {
            totalDuration: 0,
            count: 0,
            min: Infinity,
            max: 0,
            operations: [],
          });
        }
        const compStat = componentStats.get(entry.component);
        compStat.totalDuration += entry.durationMs;
        compStat.count += 1;
        compStat.min = Math.min(compStat.min, entry.durationMs);
        compStat.max = Math.max(compStat.max, entry.durationMs);
        compStat.operations.push({
          name: entry.action || entry.message || 'unknown',
          duration: entry.durationMs,
          timestamp: entry.timestamp,
        });

        // アクション統計の更新
        if (entry.action) {
          const actionKey = entry.action;
          if (!actionStats.has(actionKey)) {
            actionStats.set(actionKey, {
              totalDuration: 0,
              count: 0,
              min: Infinity,
              max: 0,
            });
          }
          const actStat = actionStats.get(actionKey);
          actStat.totalDuration += entry.durationMs;
          actStat.count += 1;
          actStat.min = Math.min(actStat.min, entry.durationMs);
          actStat.max = Math.max(actStat.max, entry.durationMs);
        }

        // 遅い操作をトラッキング
        if (entry.durationMs >= PERF_THRESHOLDS.warning) {
          slowestOperations.push({
            component: entry.component,
            action: entry.action || 'unknown',
            duration: entry.durationMs,
            timestamp: entry.timestamp,
            message: entry.message,
            context: { ...entry },
          });
        }
      });

      // コンポーネント統計に平均を追加
      componentStats.forEach(stat => {
        stat.avg = stat.count > 0 ? stat.totalDuration / stat.count : 0;
        // 操作を期間の降順でソート
        stat.operations.sort((a, b) => b.duration - a.duration);
        // 上位5件の操作のみ保持
        stat.operations = stat.operations.slice(0, 5);
      });

      // アクション統計に平均を追加
      actionStats.forEach(stat => {
        stat.avg = stat.count > 0 ? stat.totalDuration / stat.count : 0;
      });

      // 結果の集約
      const result = {
        summary: {
          totalEntries: performanceData.length,
          uniqueComponents: componentStats.size,
          uniqueActions: actionStats.size,
          slowOperationsCount: slowestOperations.length,
        },
        componentPerformance: Array.from(componentStats.entries()).map(([component, stats]) => ({
          component,
          ...stats,
        })),
        actionPerformance: Array.from(actionStats.entries()).map(([action, stats]) => ({
          action,
          ...stats,
        })),
        slowestOperations: slowestOperations.sort((a, b) => b.duration - a.duration).slice(0, 10),
        /** @type {Recommendation[]} */
        recommendations: [],
      };

      // パフォーマンス改善の推奨事項を生成
      if (slowestOperations.length > 0) {
        const componentFrequency = slowestOperations.reduce((acc, op) => {
          acc[op.component] = (acc[op.component] || 0) + 1;
          return acc;
        }, {});

        const problematicComponents = Object.entries(componentFrequency)
          .sort((a, b) => b[1] - a[1])
          .filter(([_, count]) => count >= 2)
          .map(([component]) => component);

        if (problematicComponents.length > 0) {
          result.recommendations.push({
            type: 'critical',
            message: `次のコンポーネントでパフォーマンスの問題が複数検出されました: ${problematicComponents.join(', ')}`,
            affectedComponents: problematicComponents,
          });
        }

        // 特定の処理パターンを検出
        const highFrequencyActions = Array.from(actionStats.entries())
          .filter(([_, stats]) => stats.count > 10 && stats.avg > PERF_THRESHOLDS.info)
          .map(([action]) => action);

        if (highFrequencyActions.length > 0) {
          result.recommendations.push({
            type: 'warning',
            message: `頻繁に実行される以下のアクションはキャッシュや最適化の検討が必要です: ${highFrequencyActions.join(', ')}`,
            actions: highFrequencyActions,
          });
        }
      }

      logger.info(`パフォーマンス分析が完了しました`, {
        ...LOG_CONTEXT,
        action: 'analysis_complete',
        entryCount: performanceData.length,
        componentCount: componentStats.size,
        slowOperationsCount: slowestOperations.length,
      });

      return result;
    },
    LogLevel.INFO,
    LOG_CONTEXT
  );
}

/**
 * パフォーマンスレポートの生成と保存
 * @param {Object} analysisResult 分析結果
 * @param {object} logger ロガーインスタンス
 * @returns {Promise<string>} 保存したファイルパス
 */
async function generateAndSaveReport(analysisResult, logger) {
  return logger.measureTimeAsync(
    'レポート生成と保存',
    async () => {
      // レポートの作成日時
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFilePath = resolve(REPORT_OUTPUT_DIR, `performance-report-${timestamp}.json`);

      // レポートデータの構築
      const reportData = {
        generatedAt: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        ...analysisResult,
      };

      // レポートディレクトリを確保
      await ensureDirectoryExists(REPORT_OUTPUT_DIR, logger);

      // レポートの書き込み
      await fs.writeFile(reportFilePath, JSON.stringify(reportData, null, 2), { encoding: 'utf8' });

      logger.info(`パフォーマンスレポートを保存しました: ${reportFilePath}`, {
        ...LOG_CONTEXT,
        action: 'report_saved',
        reportPath: reportFilePath,
      });

      // Markdownサマリー出力パスの生成
      const markdownPath = reportFilePath.replace(/\.json$/, '.md');

      // Markdownレポートの生成
      const markdown = [
        '# パフォーマンス分析レポート',
        '',
        `**生成日時:** ${new Date().toLocaleString('ja-JP')}`,
        `**環境:** ${process.env.NODE_ENV || 'development'}`,
        `**バージョン:** ${process.env.npm_package_version || '1.0.0'}`,
        '',
        '## サマリー',
        '',
        `- 総エントリー数: ${analysisResult.summary.totalEntries}`,
        `- 対象コンポーネント数: ${analysisResult.summary.uniqueComponents}`,
        `- アクション数: ${analysisResult.summary.uniqueActions}`,
        `- 低速操作数: ${analysisResult.summary.slowOperationsCount}`,
        '',
        '## パフォーマンス問題のあるコンポーネント',
        '',
      ];

      // 平均処理時間でソートされたコンポーネント
      const sortedComponents = [...analysisResult.componentPerformance]
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5);

      if (sortedComponents.length > 0) {
        markdown.push('| コンポーネント | 平均時間 (ms) | 最大時間 (ms) | 実行回数 |');
        markdown.push('| ------------ | ------------- | ------------ | -------- |');
        sortedComponents.forEach(comp => {
          markdown.push(
            `| ${comp.component} | ${comp.avg.toFixed(2)} | ${comp.max.toFixed(2)} | ${comp.count} |`
          );
        });
      } else {
        markdown.push('*パフォーマンスデータがありません*');
      }

      markdown.push('', '## 最も遅い操作', '');

      if (analysisResult.slowestOperations.length > 0) {
        markdown.push('| コンポーネント | アクション | 時間 (ms) |');
        markdown.push('| ------------ | --------- | --------- |');
        analysisResult.slowestOperations.forEach(op => {
          markdown.push(`| ${op.component} | ${op.action} | ${op.duration.toFixed(2)} |`);
        });
      } else {
        markdown.push('*低速操作がありません*');
      }

      markdown.push('', '## 推奨される改善点', '');

      if (analysisResult.recommendations.length > 0) {
        analysisResult.recommendations.forEach(rec => {
          markdown.push(`- **${rec.type === 'critical' ? '重要' : '警告'}**: ${rec.message}`);
        });
      } else {
        markdown.push('*特に改善が必要な点は見つかりませんでした*');
      }

      // Markdownレポートの保存
      await fs.writeFile(markdownPath, markdown.join('\n'), { encoding: 'utf8' });

      logger.info(`Markdownレポートを保存しました: ${markdownPath}`, {
        ...LOG_CONTEXT,
        action: 'markdown_saved',
        markdownPath,
      });

      return reportFilePath;
    },
    LogLevel.INFO,
    LOG_CONTEXT
  );
}

/**
 * メイン実行関数
 */
async function main() {
  const logger = await importLogger();

  try {
    logger.info('パフォーマンスレポート生成を開始します', {
      ...LOG_CONTEXT,
      logFile: PERF_LOG_FILE,
    });

    // ログディレクトリの確認
    await ensureDirectoryExists(PERF_LOG_DIR, logger);

    // パフォーマンスデータの読み込み
    const performanceData = await readPerformanceLog(PERF_LOG_FILE, logger);

    if (performanceData.length === 0) {
      logger.warn('分析可能なパフォーマンスデータがありません', LOG_CONTEXT);
      return;
    }

    // データの分析
    const analysisResult = analyzePerformanceData(performanceData, logger);

    // レポートの生成と保存
    const reportPath = await generateAndSaveReport(analysisResult, logger);

    logger.info('パフォーマンスレポート生成が完了しました', {
      ...LOG_CONTEXT,
      reportPath,
      componentAnalyzed: analysisResult.summary.uniqueComponents,
      slowOperationsFound: analysisResult.summary.slowOperationsCount,
    });

    // コンソールに結果サマリーを表示
    consoleWrapper.log('\n===== パフォーマンスレポート生成完了 =====');
    consoleWrapper.log(`レポートパス: ${reportPath}`);
    consoleWrapper.log(`分析されたコンポーネント: ${analysisResult.summary.uniqueComponents}`);
    consoleWrapper.log(`検出された低速操作: ${analysisResult.summary.slowOperationsCount}`);

    if (analysisResult.recommendations.length > 0) {
      consoleWrapper.log('\n推奨される改善点:');
      analysisResult.recommendations.forEach((rec, i) => {
        consoleWrapper.log(
          `${i + 1}. [${rec.type === 'critical' ? '重要' : '警告'}] ${rec.message}`
        );
      });
    }
    consoleWrapper.log('\nMarkdownレポートも生成されました。詳細はそちらをご確認ください。');
  } catch (error) {
    logger.error('パフォーマンスレポート生成中にエラーが発生しました', {
      ...LOG_CONTEXT,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// スクリプト実行
main().catch(error => {
  consoleWrapper.error('予期せぬエラーが発生しました:', error);
  process.exit(1);
});
