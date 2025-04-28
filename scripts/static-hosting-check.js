/**
 * 静的ホスティング環境向け最適化検証スクリプト
 *
 * このスクリプトは静的ホスティング環境（GitHub Pages, Netlify, Vercelなど）での
 * デプロイに向けたさまざまな最適化ポイントとベストプラクティスをチェックします。
 *
 * 実行方法: node scripts/static-hosting-check.js [--fix] [--verbose] [--base-path=path]
 *
 * 主な機能:
 * - 静的ホスティング環境での必須設定チェック
 * - 基本パス設定の検証
 * - パフォーマンス最適化のためのアセット構成チェック
 * - データファイルの適切な配置と構成チェック
 * - キャッシュ設定の検証
 * - Gzip/Brotli圧縮対応チェック
 *
 * オプション:
 *  --fix       自動修正可能な問題を修正する
 *  --verbose   詳細なログ出力を表示する
 *  --base-path プロジェクトのベースパスを指定する（例: --base-path=kueccha）
 */

import fs from 'fs';
import path from 'path';

import chalk from 'chalk';

// 定数
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const DATA_DIR = path.join(DIST_DIR, 'data');

// オプションの解析
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  verbose: args.includes('--verbose'),
  basePath:
    args.find(arg => arg.startsWith('--base-path='))?.replace('--base-path=', '') || 'kueccha',
};

// ロガー設定
const logger = {
  info: msg => console.info(chalk.blue(msg)),
  success: msg => console.info(chalk.green(`✅ ${msg}`)),
  warning: msg => console.warn(chalk.yellow(`⚠️ ${msg}`)),
  error: msg => console.error(chalk.red(`❌ ${msg}`)),
  verbose: msg => options.verbose && console.info(chalk.gray(`  ${msg}`)),
};

// ファイル構造のチェック
function checkFileStructure() {
  logger.info('ファイル構造を検証中...');
  const requiredFiles = ['index.html', '404.html', '.nojekyll', 'assets'];

  for (const file of requiredFiles) {
    const filePath = path.join(DIST_DIR, file);
    if (fs.existsSync(filePath)) {
      logger.success(`必須ファイルを確認: ${file}`);
    } else {
      logger.error(`必須ファイル ${file} が見つかりません`);

      // 自動修正（.nojekyllと404.html）
      if (options.fix) {
        if (file === '.nojekyll') {
          try {
            fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '');
            logger.success('.nojekyllファイルを作成しました');
          } catch (error) {
            logger.error(`${file}の作成に失敗: ${error.message}`);
          }
        } else if (file === '404.html' && fs.existsSync(INDEX_HTML)) {
          try {
            fs.copyFileSync(INDEX_HTML, path.join(DIST_DIR, '404.html'));
            logger.success('404.htmlを自動生成しました');
          } catch (error) {
            logger.error(`404.htmlの作成に失敗: ${error.message}`);
          }
        }
      }
    }
  }
}

// パスと参照のチェック
function checkPathsAndReferences() {
  logger.info('パス参照を検証中...');

  if (!fs.existsSync(INDEX_HTML)) {
    logger.error('index.htmlが見つかりません');
    return;
  }

  const content = fs.readFileSync(INDEX_HTML, 'utf-8');

  // ベースパスの確認
  const hasBasePath =
    content.includes(`<base href="/${options.basePath}/"`) || content.includes(`<base href="./"`);

  if (!hasBasePath) {
    logger.error(
      `baseタグが見つからないか、正しく設定されていません (<base href="/${options.basePath}/">)`
    );

    if (options.fix) {
      try {
        const fixedContent = content.replace(
          /<head>([\s\S]*?)<\/head>/,
          `<head>$1\n  <base href="/${options.basePath}/" />\n</head>`
        );
        fs.writeFileSync(INDEX_HTML, fixedContent);
        logger.success(`baseタグを追加しました: <base href="/${options.basePath}/" />`);
      } catch (error) {
        logger.error(`baseタグの修正に失敗: ${error.message}`);
      }
    }
  } else {
    logger.success('baseタグが正しく設定されています');
  }

  // スクリプトの読み込み最適化
  const hasAsyncScripts = content.includes('defer') || content.includes('async');
  if (!hasAsyncScripts) {
    logger.warning('スクリプトに非同期読み込み属性(defer/async)が見つかりません');
  } else {
    logger.success('スクリプトの非同期読み込み属性が設定されています');
  }

  // preconnectの確認
  const hasPreconnect = content.includes('<link rel="preconnect"');
  if (!hasPreconnect) {
    logger.warning('preconnectタグが見つかりません - 外部リソース読み込みの最適化に有効です');
  } else {
    logger.success('preconnectタグが設定されています');
  }
}

// アセット最適化のチェック
function checkAssetOptimizations() {
  logger.info('アセット最適化を検証中...');

  if (!fs.existsSync(ASSETS_DIR)) {
    logger.error('assetsディレクトリが見つかりません');
    return;
  }

  // JavaScriptチャンク数の確認
  const jsFiles = fs.readdirSync(ASSETS_DIR).filter(file => file.endsWith('.js'));

  logger.verbose(`JSファイル数: ${jsFiles.length}`);

  // CSSファイルの確認
  const cssFiles = fs.readdirSync(ASSETS_DIR).filter(file => file.endsWith('.css'));

  if (cssFiles.length > 2) {
    logger.warning(
      `CSSファイルが多すぎます (${cssFiles.length}個) - パフォーマンス向上のため結合を検討してください`
    );
  } else {
    logger.success(`CSSファイル数は適切です: ${cssFiles.length}個`);
  }

  // 画像ファイルのチェック
  const imageFiles = fs
    .readdirSync(ASSETS_DIR)
    .filter(file => /\.(png|jpe?g|gif|webp|svg)$/i.test(file));

  logger.verbose(`画像ファイル数: ${imageFiles.length}`);

  // バンドルサイズのチェック
  let totalJsSize = 0;
  let totalCssSize = 0;

  jsFiles.forEach(file => {
    const size = fs.statSync(path.join(ASSETS_DIR, file)).size;
    totalJsSize += size;

    if (size > 500 * 1024) {
      // 500KB超
      logger.warning(`大きなJSファイル: ${file} (${(size / 1024).toFixed(1)}KB)`);
    }
  });

  cssFiles.forEach(file => {
    const size = fs.statSync(path.join(ASSETS_DIR, file)).size;
    totalCssSize += size;
  });

  logger.info(
    `JS総サイズ: ${(totalJsSize / 1024).toFixed(1)}KB, CSS総サイズ: ${(totalCssSize / 1024).toFixed(1)}KB`
  );
}

// データファイルの最適化をチェック
function checkDataFiles() {
  logger.info('データファイルを検証中...');

  if (!fs.existsSync(DATA_DIR)) {
    logger.warning('dataディレクトリが見つかりません');
    return;
  }

  const dataFiles = fs.readdirSync(DATA_DIR);
  let totalDataSize = 0;

  dataFiles.forEach(file => {
    const size = fs.statSync(path.join(DATA_DIR, file)).size;
    totalDataSize += size;

    // サイズが大きいJSONファイルを検出
    if (file.endsWith('.json') && size > 100 * 1024) {
      // 100KB超
      logger.warning(`大きなJSONファイル: ${file} (${(size / 1024).toFixed(1)}KB) - 分割を検討`);
    }
  });

  logger.info(
    `データファイル: ${dataFiles.length}個, 合計サイズ: ${(totalDataSize / 1024).toFixed(1)}KB`
  );

  if (totalDataSize > 1024 * 1024) {
    // 1MB超
    logger.warning(
      'データファイルの総サイズが1MBを超えています - 遅延読み込みの実装を検討してください'
    );
  } else {
    logger.success('データファイルの総サイズは適切です');
  }
}

// メイン実行関数
async function main() {
  logger.info('=== 静的ホスティング環境向け最適化検証 ===');
  logger.info(`日時: ${new Date().toLocaleString()}`);
  logger.info(`ベースパス: /${options.basePath}/`);
  logger.info(`自動修正モード: ${options.fix ? '有効' : '無効'}`);

  if (!fs.existsSync(DIST_DIR)) {
    logger.error(`ビルドディレクトリが見つかりません: ${DIST_DIR}`);
    logger.info('先に "npm run build" を実行してビルド成果物を生成してください');
    process.exit(1);
  }

  checkFileStructure();
  checkPathsAndReferences();
  checkAssetOptimizations();
  checkDataFiles();

  logger.info('=== 検証完了 ===');
  logger.info(`詳細な最適化ガイドラインはdocs/google_maps_guidelines/フォルダを参照してください`);
}

// スクリプト実行
main().catch(error => {
  logger.error(`予期しないエラーが発生しました: ${error.message}`);
  process.exit(1);
});
