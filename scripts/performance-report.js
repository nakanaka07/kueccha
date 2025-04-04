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

// @ts-ignore
import { fileURLToPath } from 'url';
// @ts-ignore
import { dirname, resolve } from 'path';
// @ts-ignore
import * as fs from 'fs';
// @ts-ignore
import * as path from 'path';

// ESM環境でのファイルパス取得
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// パフォーマンスログファイルのパス
const PERF_LOG_DIR = resolve(rootDir, 'logs');
const PERF_LOG_FILE = resolve(PERF_LOG_DIR, 'performance.json');
const REPORT_FILE = resolve(rootDir, 'performance-report.md');

// 必要なディレクトリの作成
if (!fs.existsSync(PERF_LOG_DIR)) {
  fs.mkdirSync(PERF_LOG_DIR, { recursive: true });
}

/**
 * パフォーマンスログデータを読み込む
 * @returns {Array<PerformanceEntry>} パフォーマンスログエントリの配列
 */
function loadPerformanceData() {
  try {
    // ファイルが存在しない場合は空の配列を返す
    if (!fs.existsSync(PERF_LOG_FILE)) {
      console.warn('🔍 パフォーマンスログファイルが見つかりません。先に計測を実行してください。');
      return [];
    }

    const data = fs.readFileSync(PERF_LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ パフォーマンスログの読み込みに失敗しました:', error);
    return [];
  }
}

/**
 * パフォーマンスデータを集計・分析する
 * @param {Array<PerformanceEntry>} entries パフォーマンスログエントリの配列
 * @returns {PerformanceAnalysis} 分析結果
 */
function analyzePerformanceData(entries) {
  if (!entries || entries.length === 0) {
    return {
      totalEntries: 0,
      operationSummary: /** @type {Record<string, OperationSummary>} */ ({}),
      slowOperations: [],
      componentPerformance: /** @type {Record<string, ComponentPerformance>} */ ({}),
      timeDistribution: /** @type {Record<string, TimeDistribution>} */ ({}),
    };
  }

  // 操作タイプごとの集計
  /** @type {Record<string, OperationSummary>} */
  const operationSummary = {};
  /** @type {Record<string, ComponentPerformance>} */
  const componentPerformance = {};

  // すべてのエントリの処理
  entries.forEach(entry => {
    // 操作タイプごとの集計
    const operation = entry.operation || 'unknown';
    if (!operationSummary[operation]) {
      operationSummary[operation] = {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
      };
    }

    const summary = operationSummary[operation];
    summary.count++;
    summary.totalDuration += entry.durationMs;
    summary.minDuration = Math.min(summary.minDuration, entry.durationMs);
    summary.maxDuration = Math.max(summary.maxDuration, entry.durationMs);

    // コンポーネントごとの集計
    if (entry.context && entry.context.component) {
      const component = entry.context.component;
      if (!componentPerformance[component]) {
        componentPerformance[component] = {
          operations: {},
          totalDuration: 0,
          count: 0,
        };
      }

      const compSummary = componentPerformance[component];
      compSummary.totalDuration += entry.durationMs;
      compSummary.count++;

      if (!compSummary.operations[operation]) {
        compSummary.operations[operation] = {
          count: 0,
          totalDuration: 0,
        };
      }
      compSummary.operations[operation].count++;
      compSummary.operations[operation].totalDuration += entry.durationMs;
    }
  });

  // 平均値の計算
  Object.values(operationSummary).forEach(summary => {
    summary.avgDuration = summary.totalDuration / summary.count;
  });

  // 遅い操作の特定（平均時間の2倍以上かかったエントリ）
  const slowOperations = entries
    .filter(entry => {
      const operation = entry.operation || 'unknown';
      const average = operationSummary[operation].avgDuration;
      return entry.durationMs > average * 2 && entry.durationMs > 100; // 100ms以上の遅延があるもののみ
    })
    .sort((a, b) => b.durationMs - a.durationMs);

  // 時間帯ごとの分布分析
  /** @type {Record<string, TimeDistribution>} */
  const timeDistribution = {};
  entries.forEach(entry => {
    const timestamp = new Date(entry.timestamp || Date.now());
    const hour = timestamp.getHours();
    const hourKey = `${hour.toString().padStart(2, '0')}:00`;

    if (!timeDistribution[hourKey]) {
      timeDistribution[hourKey] = {
        count: 0,
        totalDuration: 0,
        operations: {},
      };
    }

    timeDistribution[hourKey].count++;
    timeDistribution[hourKey].totalDuration += entry.durationMs;

    const operation = entry.operation || 'unknown';
    if (!timeDistribution[hourKey].operations[operation]) {
      timeDistribution[hourKey].operations[operation] = {
        count: 0,
        totalDuration: 0,
      };
    }
    timeDistribution[hourKey].operations[operation].count++;
    timeDistribution[hourKey].operations[operation].totalDuration += entry.durationMs;
  });

  return {
    totalEntries: entries.length,
    operationSummary,
    slowOperations: slowOperations.slice(0, 10), // 上位10件のみ
    componentPerformance,
    timeDistribution,
  };
}

/**
 * マークダウンレポートを生成する
 * @param {PerformanceAnalysis} analysis パフォーマンス分析結果
 * @returns {string} マークダウン形式のレポート
 */
function generateMarkdownReport(analysis) {
  const { totalEntries, operationSummary, slowOperations, componentPerformance, timeDistribution } =
    analysis;

  if (totalEntries === 0) {
    return `# パフォーマンスレポート

## エラー
パフォーマンスデータが見つかりません。アプリケーションを実行し、パフォーマンス計測を有効にしてください。

\`\`\`bash
npm run perf:analyze
\`\`\`
`;
  }

  let markdown = `# パフォーマンスレポート

生成日時: ${new Date().toLocaleString('ja-JP')}

## 概要

- 計測エントリ総数: ${totalEntries}
- 操作タイプ数: ${Object.keys(operationSummary).length}
- 計測対象コンポーネント数: ${Object.keys(componentPerformance).length}

## 操作タイプ別パフォーマンス

| 操作 | 回数 | 平均時間(ms) | 最小(ms) | 最大(ms) | 合計時間(ms) |
|------|------|------------|---------|---------|------------|
`;

  // 平均時間の降順でソート
  const sortedOperations = Object.entries(operationSummary).sort(
    ([, a], [, b]) => b.avgDuration - a.avgDuration
  );

  sortedOperations.forEach(([operation, stats]) => {
    markdown += `| ${operation} | ${stats.count} | ${stats.avgDuration.toFixed(2)} | ${stats.minDuration.toFixed(2)} | ${stats.maxDuration.toFixed(2)} | ${stats.totalDuration.toFixed(2)} |\n`;
  });

  // パフォーマンスの遅い操作
  markdown += `\n## 特に遅い操作 (上位10件)

`;

  if (slowOperations.length === 0) {
    markdown += '遅い操作は検出されませんでした。\n';
  } else {
    markdown += '| 操作 | 時間(ms) | タイムスタンプ | コンポーネント | 詳細 |\n';
    markdown += '|------|---------|--------------|-------------|-------|\n';

    slowOperations.forEach(entry => {
      const component = entry.context?.component || 'N/A';
      // detailsプロパティが存在しない場合に対応
      const details =
        entry.context && 'details' in entry.context
          ? JSON.stringify(entry.context.details).substring(0, 50)
          : 'N/A';
      const timestamp = new Date(entry.timestamp || Date.now()).toLocaleString('ja-JP');

      markdown += `| ${entry.operation || 'unknown'} | ${entry.durationMs.toFixed(2)} | ${timestamp} | ${component} | ${details} |\n`;
    });
  }

  // コンポーネント別パフォーマンス
  markdown += `\n## コンポーネント別パフォーマンス

`;

  const sortedComponents = Object.entries(componentPerformance).sort(
    ([, a], [, b]) => b.totalDuration - a.totalDuration
  );

  if (sortedComponents.length === 0) {
    markdown += 'コンポーネント情報が記録されていません。\n';
  } else {
    markdown += '| コンポーネント | 操作回数 | 平均時間(ms) | 合計時間(ms) | 主な操作 |\n';
    markdown += '|--------------|---------|------------|------------|--------|\n';

    sortedComponents.forEach(([component, stats]) => {
      const avgDuration = stats.totalDuration / stats.count;

      // 最も時間がかかっている操作を取得
      const mainOperation = Object.entries(stats.operations)
        .sort(([, a], [, b]) => b.totalDuration - a.totalDuration)
        .map(([op, opStats]) => `${op}(${opStats.totalDuration.toFixed(0)}ms)`)
        .slice(0, 2)
        .join(', ');

      markdown += `| ${component} | ${stats.count} | ${avgDuration.toFixed(2)} | ${stats.totalDuration.toFixed(2)} | ${mainOperation} |\n`;
    });
  }

  // 時間帯別の分布
  markdown += `\n## 時間帯別パフォーマンス分布

`;

  const timeKeys = Object.keys(timeDistribution).sort();

  if (timeKeys.length === 0) {
    markdown += 'タイムスタンプ情報が記録されていません。\n';
  } else {
    markdown += '| 時間帯 | 操作回数 | 平均時間(ms) | 合計時間(ms) | 主な操作 |\n';
    markdown += '|-------|---------|------------|------------|--------|\n';

    timeKeys.forEach(timeKey => {
      const timeStats = timeDistribution[timeKey];
      const avgDuration = timeStats.totalDuration / timeStats.count;

      // 最も頻度の高い操作を取得
      const mainOperation = Object.entries(timeStats.operations)
        .sort(([, a], [, b]) => b.count - a.count)
        .map(([op, opStats]) => `${op}(${opStats.count}回)`)
        .slice(0, 2)
        .join(', ');

      markdown += `| ${timeKey} | ${timeStats.count} | ${avgDuration.toFixed(2)} | ${timeStats.totalDuration.toFixed(2)} | ${mainOperation} |\n`;
    });
  }

  // 最適化の提案
  markdown += `\n## 最適化の提案

`;

  // 最も遅い操作タイプに基づいて提案
  if (sortedOperations.length > 0) {
    const [slowestOp, slowestStats] = sortedOperations[0];

    markdown += `### 1. "${slowestOp}" 操作の最適化

この操作は平均 ${slowestStats.avgDuration.toFixed(2)}ms かかっており、最大で ${slowestStats.maxDuration.toFixed(2)}ms に達しています。
以下の最適化を検討してください：

- メモ化（React.memo, useMemo, useCallback）の適用
- 不要な再レンダリングの防止
- データ取得ロジックの見直し
- バッチ処理の導入

`;
  }

  // 最もパフォーマンスの悪いコンポーネントに基づいて提案
  if (sortedComponents.length > 0) {
    const [slowestComp, slowestCompStats] = sortedComponents[0];

    markdown += `### 2. "${slowestComp}" コンポーネントの最適化

このコンポーネントは合計で ${slowestCompStats.totalDuration.toFixed(2)}ms の処理時間を消費しています。
特に注目すべき操作：

`;

    // コンポーネントの最も遅い操作
    const slowestCompOps = Object.entries(slowestCompStats.operations)
      .sort(([, a], [, b]) => b.totalDuration - a.totalDuration)
      .slice(0, 2);

    slowestCompOps.forEach(([op, opStats], index) => {
      markdown += `- ${op}: 合計${opStats.totalDuration.toFixed(2)}ms (${opStats.count}回実行, 平均${(opStats.totalDuration / opStats.count).toFixed(2)}ms)\n`;
    });

    markdown += `
最適化の方向性：
- コンポーネントの分割
- useCallback/useMemoによるキャッシュ
- 条件付きレンダリングの見直し
- 状態管理の最適化
`;
  }

  markdown += `
## まとめ

全体的なパフォーマンスを向上させるために、以下の一般的な改善策も検討してください：

1. バンドルサイズの最適化
   - コード分割（React.lazy）
   - 不要なライブラリの削除

2. レンダリングの最適化
   - 不要なレンダリングを回避
   - メモ化の適切な使用

3. データ取得の最適化
   - キャッシュの活用
   - データ取得の並列化

4. 状態管理の改善
   - 状態更新の最小化
   - セレクタの最適化
`;

  return markdown;
}

// メイン処理
try {
  console.log('🔍 パフォーマンスレポートの生成を開始します...');

  // データ読み込みと分析
  const performanceData = loadPerformanceData();
  console.log(`📊 ${performanceData.length} 件のパフォーマンスデータを読み込みました`);

  const analysis = analyzePerformanceData(performanceData);

  // レポート生成
  const markdownReport = generateMarkdownReport(analysis);

  // レポートの保存
  fs.writeFileSync(REPORT_FILE, markdownReport);
  console.log(`✅ パフォーマンスレポートを生成しました: ${REPORT_FILE}`);

  console.log('📋 レポート概要:');
  console.log(`  - エントリ総数: ${analysis.totalEntries}`);
  console.log(`  - 操作タイプ数: ${Object.keys(analysis.operationSummary).length}`);
  console.log(`  - 特に遅い操作: ${analysis.slowOperations.length}`);
} catch (error) {
  console.error('❌ パフォーマンスレポート生成中にエラーが発生しました:', error);
  process.exit(1);
}

/**
 * @typedef {Object} PerformanceEntry
 * @property {string} operation - 実行された操作の名前
 * @property {number} durationMs - 操作にかかった時間（ミリ秒）
 * @property {Date|string} [timestamp] - 操作が実行された時刻
 * @property {Object} [context] - 操作のコンテキスト情報
 * @property {string} [context.component] - 操作が実行されたコンポーネント名
 * @property {any} [context.details] - 操作の詳細情報
 */

/**
 * @typedef {Object} OperationSummary
 * @property {number} count - 操作の実行回数
 * @property {number} totalDuration - 合計実行時間（ミリ秒）
 * @property {number} minDuration - 最小実行時間（ミリ秒）
 * @property {number} maxDuration - 最大実行時間（ミリ秒）
 * @property {number} avgDuration - 平均実行時間（ミリ秒）
 */

/**
 * @typedef {Object} ComponentPerformance
 * @property {Record<string, {count: number, totalDuration: number}>} operations - コンポーネントで実行された操作ごとの統計
 * @property {number} totalDuration - コンポーネントの合計実行時間
 * @property {number} count - コンポーネントでの操作実行回数
 */

/**
 * @typedef {Object} TimeDistribution
 * @property {number} count - 時間帯ごとの操作回数
 * @property {number} totalDuration - 時間帯ごとの合計実行時間
 * @property {Record<string, {count: number, totalDuration: number}>} operations - 時間帯ごとの操作統計
 */

/**
 * @typedef {Object} PerformanceAnalysis
 * @property {number} totalEntries - 分析対象のエントリ総数
 * @property {Record<string, OperationSummary>} operationSummary - 操作タイプごとの統計情報
 * @property {Array<PerformanceEntry>} slowOperations - 特に遅い操作のリスト
 * @property {Record<string, ComponentPerformance>} componentPerformance - コンポーネントごとのパフォーマンス
 * @property {Record<string, TimeDistribution>} timeDistribution - 時間帯ごとのパフォーマンス分布
 */
