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
 * 最適化ガイドライン:
 * - シンプルさ優先の原則（KISS）に基づいた明確なコードフロー
 * - 必要な機能のみを実装（YAGNI原則）
 * - コード最適化ガイドラインに基づくロガー活用
 *
 * 実行方法:
 * - pnpm run perf:report [--output=path] [--log=path]
 *
 * オプション:
 * --output=path  レポート出力先ディレクトリを指定
 * --log=path     パフォーマンスログファイルのパスを指定
 */

import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import { dirname, resolve } from 'path';
import { performance } from 'perf_hooks';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

/* eslint-env node */
/* eslint-disable no-console */
/* global process, console */

// コマンドライン引数の解析
const args = process.argv.slice(2);
const options = args.reduce(
  (acc, arg) => {
    if (arg.startsWith('--output=')) {
      acc.outputDir = arg.replace('--output=', '');
    } else if (arg.startsWith('--log=')) {
      acc.logFile = arg.replace('--log=', '');
    }
    return acc;
  },
  { outputDir: '', logFile: '' }
);

// ESM環境でのファイルパス取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

/**
 * ロギング設定
 */
const LOG_CONTEXT = {
  component: 'PerformanceReport',
  action: 'generate_report',
  timestamp: new Date().toISOString(),
};

/**
 * パフォーマンスログファイルのパス設定
 * コマンドラインオプション > 環境変数 > デフォルト値 の優先順位
 */
const PERF_LOG_DIR = process.env.PERF_LOG_DIR || resolve(rootDir, 'logs');
const PERF_LOG_FILE =
  options.logFile || process.env.PERF_LOG_FILE || resolve(PERF_LOG_DIR, 'performance.json');
const REPORT_OUTPUT_DIR =
  options.outputDir || process.env.REPORT_OUTPUT_DIR || resolve(rootDir, 'reports');

// パフォーマンス閾値設定（ミリ秒）- シンプルな固定値を使用しつつ環境変数での上書きを許可
const PERF_THRESHOLDS = {
  critical: Number(process.env.PERF_THRESHOLD_CRITICAL) || 1000, // 重大な遅延
  warning: Number(process.env.PERF_THRESHOLD_WARNING) || 300, // 警告レベルの遅延
  info: Number(process.env.PERF_THRESHOLD_INFO) || 100, // 注目すべき遅延
};

/**
 * 収集されたパフォーマンス指標を格納するオブジェクト
 * @type {Object}
 */
const performanceMetrics = {
  operations: [],
  summary: {
    totalCount: 0,
    totalDuration: 0,
    criticalCount: 0,
    warningCount: 0,
    normalCount: 0,
  },
};

/**
 * パフォーマンスの重大度レベルを判定する
 * @param {number} duration - 実行時間（ミリ秒）
 * @returns {'critical'|'warning'|'normal'} 重大度レベル
 */
function getSeverityLevel(duration) {
  if (duration >= PERF_THRESHOLDS.critical) return 'critical';
  if (duration >= PERF_THRESHOLDS.warning) return 'warning';
  return 'normal';
}

/**
 * メモリ使用量の変化を計算する
 * @param {Object} start - 開始時のメモリ使用状況
 * @param {Object} end - 終了時のメモリ使用状況
 * @returns {Object} メモリ使用量の差分
 */
function getMemoryDelta(start, end) {
  return {
    rss: formatMemory(end.rss - start.rss),
    heapTotal: formatMemory(end.heapTotal - start.heapTotal),
    heapUsed: formatMemory(end.heapUsed - start.heapUsed),
    external: formatMemory(end.external - start.external),
  };
}

/**
 * メモリサイズをフォーマットする
 * @param {number} bytes - バイト数
 * @returns {string} フォーマットされたメモリサイズ
 */
function formatMemory(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/**
 * パフォーマンスメトリクスを記録する
 * @param {string} name - 操作名
 * @param {number} duration - 実行時間（ミリ秒）
 * @param {string} severity - 重大度
 * @param {Object|null} memoryInfo - メモリ使用情報
 * @param {Object} context - コンテキスト情報
 */
function recordPerformanceMetric(name, duration, severity, memoryInfo, context) {
  // 操作の記録
  performanceMetrics.operations.push({
    name,
    duration,
    timestamp: new Date().toISOString(),
    severity,
    memory: memoryInfo,
    context,
  });

  // サマリー情報の更新
  performanceMetrics.summary.totalCount++;
  performanceMetrics.summary.totalDuration += duration;

  if (severity === 'critical') {
    performanceMetrics.summary.criticalCount++;
  } else if (severity === 'warning') {
    performanceMetrics.summary.warningCount++;
  } else {
    performanceMetrics.summary.normalCount++;
  }
}

/**
 * シンプルなロガーの実装
 * ロガー使用ガイドラインに準拠しつつ、依存関係を減らす
 */
const logger = {
  error: (msg, ctx) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}${formatContext(ctx)}`),
  warn: (msg, ctx) => console.warn(`\x1b[33m[WARN]\x1b[0m ${msg}${formatContext(ctx)}`),
  info: (msg, ctx) => console.info(`\x1b[34m[INFO]\x1b[0m ${msg}${formatContext(ctx)}`),
  debug: (msg, ctx) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`\x1b[36m[DEBUG]\x1b[0m ${msg}${formatContext(ctx)}`);
    }
  },
  log: (msg, ctx) => console.log(`\x1b[32m[OK]\x1b[0m ${msg}${formatContext(ctx)}`) /**
   * パフォーマンス計測（同期関数）
   * @param {string} name - 計測する操作の名前
   * @param {Function} fn - 実行する同期関数
   * @param {Object} ctx - 追加コンテキスト情報
   * @param {Object} [options] - 計測オプション
   * @param {boolean} [options.memory] - メモリ使用量も計測するか
   * @param {number} [options.threshold] - 警告する閾値（ミリ秒）
   * @returns {any} fnの戻り値
   */,
  measureTime: (name, fn, ctx = {}, options = { memory: false, threshold: 0 }) => {
    const startTime = performance.now();
    const startMemory = options.memory ? process.memoryUsage() : null;

    try {
      const result = fn();
      const duration = performance.now() - startTime;

      // メモリ使用量の計測
      const memoryInfo = options.memory ? getMemoryDelta(startMemory, process.memoryUsage()) : null;

      // 閾値チェック
      const severity = getSeverityLevel(duration);

      // 重大度に応じたログレベルを使用（セキュリティ問題を回避）
      if (severity === 'critical') {
        logger.error(`${name} (${duration.toFixed(2)}ms) [重大な遅延]`, {
          ...ctx,
          duration,
          severity,
          ...(memoryInfo && { memory: memoryInfo }),
        });
      } else if (severity === 'warning') {
        logger.warn(`${name} (${duration.toFixed(2)}ms) [警告レベルの遅延]`, {
          ...ctx,
          duration,
          severity,
          ...(memoryInfo && { memory: memoryInfo }),
        });
      } else {
        logger.debug(`${name} (${duration.toFixed(2)}ms)`, {
          ...ctx,
          duration,
          ...(memoryInfo && { memory: memoryInfo }),
        });
      }

      // パフォーマンスメトリクスの記録（後で集計するため）
      recordPerformanceMetric(name, duration, severity, memoryInfo, ctx);

      return result;
    } catch (err) {
      const duration = performance.now() - startTime;
      logger.error(`${name} 失敗 (${duration.toFixed(2)}ms)`, {
        ...ctx,
        duration,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },
  /**
   * パフォーマンス計測（非同期関数）
   * @param {string} name - 計測する操作の名前
   * @param {Function} fn - 実行する非同期関数
   * @param {Object} ctx - 追加コンテキスト情報
   * @param {Object} [options] - 計測オプション
   * @param {boolean} [options.memory] - メモリ使用量も計測するか
   * @param {number} [options.threshold] - 警告する閾値（ミリ秒）
   * @returns {Promise<any>} fnの戻り値を含むPromise
   */
  measureTimeAsync: async (name, fn, ctx = {}, options = {}) => {
    const startTime = performance.now();
    const startMemory = options.memory ? process.memoryUsage() : null;

    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      // メモリ使用量の計測
      const memoryInfo = options.memory ? getMemoryDelta(startMemory, process.memoryUsage()) : null;

      // 閾値チェック
      const severity = getSeverityLevel(duration);

      // 重大度に応じたログレベルを使用（セキュリティ問題を回避）
      if (severity === 'critical') {
        logger.error(`${name} (${duration.toFixed(2)}ms) [重大な遅延]`, {
          ...ctx,
          duration,
          severity,
          ...(memoryInfo && { memory: memoryInfo }),
        });
      } else if (severity === 'warning') {
        logger.warn(`${name} (${duration.toFixed(2)}ms) [警告レベルの遅延]`, {
          ...ctx,
          duration,
          severity,
          ...(memoryInfo && { memory: memoryInfo }),
        });
      } else {
        logger.debug(`${name} (${duration.toFixed(2)}ms)`, {
          ...ctx,
          duration,
          ...(memoryInfo && { memory: memoryInfo }),
        });
      }

      // パフォーマンスメトリクスの記録
      recordPerformanceMetric(name, duration, severity, memoryInfo, ctx);

      return result;
    } catch (err) {
      const duration = performance.now() - startTime;
      logger.error(`${name} 失敗 (${duration.toFixed(2)}ms)`, {
        ...ctx,
        duration,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },

  /**
   * 処理のパフォーマンス指標を取得
   * @returns {Object} 蓄積されたパフォーマンス指標
   */
  getPerformanceMetrics: () => {
    return { ...performanceMetrics };
  },
};

/**
 * コンテキスト情報を文字列にフォーマット
 * @param {Object|undefined} ctx コンテキスト情報
 * @returns {string} フォーマットされたコンテキスト文字列
 */
function formatContext(ctx) {
  if (!ctx || Object.keys(ctx).length === 0) return '';
  try {
    return ` - ${JSON.stringify(ctx)}`;
  } catch {
    return ' - [コンテキスト変換エラー]';
  }
}

/**
 * ディレクトリの存在確認と作成
 * @param {string} dirPath 確認・作成するディレクトリのパス
 * @returns {Promise<void>}
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    logger.debug(`ディレクトリを確認しました: ${dirPath}`, { ...LOG_CONTEXT });
  } catch (error) {
    logger.error(`ディレクトリの作成に失敗しました: ${dirPath}`, {
      ...LOG_CONTEXT,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * パフォーマンスログファイルの読み込み
 * @param {string} filePath ログファイルのパス
 * @returns {Promise<Array<Object>>} パフォーマンスログデータ
 */
async function readPerformanceLog(filePath) {
  return logger.measureTimeAsync(
    'パフォーマンスログの読み込み',
    async () => {
      try {
        // ファイルが存在するか確認
        try {
          await fs.access(filePath);
        } catch {
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
      } catch (err) {
        logger.error(`パフォーマンスログの読み込みに失敗しました`, {
          ...LOG_CONTEXT,
          filePath,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
    LOG_CONTEXT
  );
}

/**
 * パフォーマンスデータの分析
 * @param {Array<Object>} performanceData パフォーマンスログデータ
 * @returns {Object} 分析結果
 */
function analyzePerformanceData(performanceData) {
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
        // 上位5件の操作のみ保持 (YAGNI原則に基づき、必要なデータのみを保持)
        stat.operations = stat.operations.slice(0, 5);
      });

      // アクション統計に平均を追加
      actionStats.forEach(stat => {
        stat.avg = stat.count > 0 ? stat.totalDuration / stat.count : 0;
      }); // 結果の集約
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
        slowestOperations: slowestOperations.sort((a, b) => b.duration - a.duration).slice(0, 10), // 明確な型を持った recommendations 配列
        recommendations:
          /** @type {Array<{type: string, message: string, affectedComponents?: string[], actions?: any[]}>} */ ([]),
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
    LOG_CONTEXT
  );
}

/**
 * パフォーマンスレポートの生成と保存
 * @param {Object} analysisResult 分析結果
 * @returns {Promise<string>} 保存したファイルパス
 */
async function generateAndSaveReport(analysisResult) {
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
      await ensureDirectoryExists(REPORT_OUTPUT_DIR);

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
    LOG_CONTEXT
  );
}

/**
 * メイン実行関数
 */
async function main() {
  try {
    logger.info('パフォーマンスレポート生成を開始します', {
      ...LOG_CONTEXT,
      logFile: PERF_LOG_FILE,
      environment: process.env.NODE_ENV || 'development',
    });

    // ログディレクトリの確認
    await ensureDirectoryExists(PERF_LOG_DIR);

    // パフォーマンスデータの読み込み
    const performanceData = await readPerformanceLog(PERF_LOG_FILE);

    if (performanceData.length === 0) {
      logger.warn('分析可能なパフォーマンスデータがありません', LOG_CONTEXT);
      return;
    }

    // データの分析
    const analysisResult = analyzePerformanceData(performanceData);

    // レポートの生成と保存
    const reportPath = await generateAndSaveReport(analysisResult);

    logger.info('パフォーマンスレポート生成が完了しました', {
      ...LOG_CONTEXT,
      reportPath,
      componentAnalyzed: analysisResult.summary.uniqueComponents,
      slowOperationsFound: analysisResult.summary.slowOperationsCount,
    });

    // コンソールに結果サマリーを表示
    console.log('\n===== パフォーマンスレポート生成完了 =====');
    console.log(`レポートパス: ${reportPath}`);
    console.log(`分析されたコンポーネント: ${analysisResult.summary.uniqueComponents}`);
    console.log(`検出された低速操作: ${analysisResult.summary.slowOperationsCount}`);

    if (analysisResult.recommendations.length > 0) {
      console.log('\n推奨される改善点:');
      analysisResult.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.type === 'critical' ? '重要' : '警告'}] ${rec.message}`);
      });
    }
    console.log('\nMarkdownレポートも生成されました。詳細はそちらをご確認ください。');
  } catch (err) {
    logger.error('パフォーマンスレポート生成中にエラーが発生しました', {
      ...LOG_CONTEXT,
      error: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack : undefined,
    });
    process.exit(1);
  }
}

// スクリプト実行
main().catch(err => {
  console.error('予期せぬエラーが発生しました:', err);
  process.exit(1);
});
