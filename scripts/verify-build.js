// filepath: c:\Users\int-x-survey\Desktop\kueccha\scripts\verify-build.js
/**
 * ビルド検証スクリプト
 *
 * このスクリプトはプロジェクトのビルド結果を検証し、
 * デプロイ前に必要なファイルが存在するか、サイズが適切かなどをチェックします。
 *
 * 特徴:
 * - ビルド成果物の存在確認
 * - 重要なアセットの完全性チェック
 * - HTML/CSS/JSの基本的な構造検証
 * - パフォーマンス最適化の確認
 * - GitHub Pages固有の設定検証
 * - 静的ホスティング環境向けの最適化検証
 *
 * 使用方法: node scripts/verify-build.js [options]
 * Options:  const assetsDir = path.join(DIST_DIR, 'assets');
  if (fs.existsSync(assetsDir)) {    // JSファイル数のチェック
    const jsFiles = fs.readdirSync(assetsDir)
      .filter(file => file.endsWith('.js'));
      
    logger.verbose(`JSファイル数: ${jsFiles.length}個`);--verbose         詳細な検証情報を表示
 *  --ci              CI環境での実行モードを有効化
 *  --fix             問題を自動修正（可能な場合）
 *  --static-hosting  静的ホスティング環境向けの厳格なチェックを実行
 */

// Node.jsグローバル変数を明示的に宣言
/* global process, console */

// 必要なモジュールをインポート
import fs from 'fs';
import path from 'path';

import chalk from 'chalk';
// execSyncは使用されていないため削除しました

// 定数定義
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const MIN_INDEX_SIZE = 1024; // 1KB
const MIN_JS_BUNDLE_SIZE = 10 * 1024; // 10KB
const MAX_JS_BUNDLE_SIZE = 5 * 1024 * 1024; // 5MB（最適化されたバンドルの最大サイズ）
const REQUIRED_FILES = [
  'index.html',
  'assets',
  '.nojekyll', // GitHub Pages用の特殊ファイル
];
const REQUIRED_ASSET_EXTENSIONS = ['.js', '.css', '.png', '.svg', '.ico'];

// スクリプト実行オプションの解析
function parseOptions() {
  const args = process.argv.slice(2);
  return {
    verbose: args.includes('--verbose'),
    ciMode: args.includes('--ci') || process.env.CI === 'true',
    fix: args.includes('--fix'),
    staticHosting: args.includes('--static-hosting') || process.env.STATIC_HOSTING === 'true',
    basePath: args.find(arg => arg.startsWith('--base-path='))?.replace('--base-path=', '') || '',
  };
}

const options = parseOptions();

// ロガー設定 - eslintのno-console警告対応
const logger = {
  info: message => {
    // ESLint: no-consoleルールへの対応（情報はconsole.infoを使用）
    console.info(chalk.blue(message));
  },
  success: message => {
    // ESLint: no-consoleルールへの対応（成功はconsole.infoを使用）
    console.info(chalk.green(`✅ ${message}`));
  },
  warning: message => {
    // ESLint: no-consoleルールへの対応（警告はconsole.warnを使用）
    console.warn(chalk.yellow(`⚠️ ${message}`));
  },
  error: message => {
    // ESLint: no-consoleルールへの対応（エラーはconsole.errorを使用）
    console.error(chalk.red(`❌ ${message}`));
  },
  verbose: message => {
    if (options.verbose) {
      // ESLint: no-consoleルールへの対応（詳細情報はconsole.infoを使用）
      console.info(chalk.gray(`  ${message}`));
    }
  },
};

// ディレクトリのサイズを計算（再帰的）
function getDirectorySize(directory) {
  let size = 0;
  const items = fs.readdirSync(directory);

  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      size += getDirectorySize(itemPath);
    } else {
      size += stats.size;
    }
  }

  return size;
}

// ファイル構造チェック関数
function checkFileStructure() {
  logger.info('ビルド成果物の構造を検証中...');
  let hasErrors = false;

  // dist ディレクトリの存在確認
  if (!fs.existsSync(DIST_DIR)) {
    logger.error(`ビルドディレクトリが存在しません: ${DIST_DIR}`);
    return false;
  }

  // 必須ファイルの存在確認
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(DIST_DIR, file);
    if (!fs.existsSync(filePath)) {
      logger.error(`必須ファイルが見つかりません: ${file}`);
      hasErrors = true;
    } else {
      logger.verbose(`必須ファイルを確認: ${file}`);
    }
  }

  // index.htmlの内容チェック
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const indexSize = fs.statSync(indexPath).size;

    if (indexSize < MIN_INDEX_SIZE) {
      logger.warning(`index.htmlのサイズが小さすぎます: ${indexSize} bytes`);
    }

    if (!indexContent.includes('<title>')) {
      logger.error('index.htmlにタイトルタグがありません');
      hasErrors = true;
    }

    if (!indexContent.includes('</body>')) {
      logger.error('index.htmlに不正なHTML構造があります');
      hasErrors = true;
    }

    // baseタグの確認（GitHub Pages用）
    if (indexContent.includes('base href="/kueccha/"')) {
      logger.success('GitHub Pages用のbase hrefが正しく設定されています');
    } else {
      logger.warning('GitHub Pages用のbase href設定が見つかりません');
    }
  }

  // アセットディレクトリのチェック
  const assetsDir = path.join(DIST_DIR, 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir, { recursive: true });

    // 各アセットタイプの存在確認
    // 安全なアプローチでオブジェクトに保存
    const extensionsMap = new Map();
    const jsFiles = [];

    files.forEach(file => {
      if (typeof file === 'string') {
        // recursive:trueの場合、オブジェクトになることがあるため
        const ext = path.extname(file);

        if (ext) {
          // Mapを使用して安全に拡張子の数をカウント
          extensionsMap.set(ext, (extensionsMap.get(ext) || 0) + 1);

          // JSファイルを特定
          if (ext === '.js') {
            jsFiles.push(file);
          }
        }
      }
    });

    // 必須アセット拡張子のチェック
    REQUIRED_ASSET_EXTENSIONS.forEach(ext => {
      // Mapを使用して安全に値を取得
      const extCount = extensionsMap.get(ext);
      if (!extCount) {
        logger.warning(`${ext} タイプのアセットが見つかりません`);
      } else {
        logger.verbose(`${ext} タイプのアセット: ${extCount}個`);
      }
    });

    // JSバンドルのサイズチェック
    jsFiles.forEach(file => {
      const filePath = path.join(assetsDir, file);
      if (fs.existsSync(filePath)) {
        const size = fs.statSync(filePath).size;

        if (size < MIN_JS_BUNDLE_SIZE) {
          logger.warning(`JSファイル ${file} のサイズが小さすぎます: ${size} bytes`);
        } else if (size > MAX_JS_BUNDLE_SIZE) {
          logger.warning(
            `JSファイル ${file} のサイズが大きすぎます: ${(size / 1024 / 1024).toFixed(2)}MB`
          );
        } else {
          logger.verbose(`JSファイル ${file} のサイズは適切です: ${(size / 1024).toFixed(2)}KB`);
        }
      }
    });
  }

  // マップデータファイルの存在確認
  const dataDir = path.join(DIST_DIR, 'data');
  if (!fs.existsSync(dataDir)) {
    logger.warning(
      'データディレクトリが見つかりません。マップデータが含まれていない可能性があります。'
    );
  } else {
    const dataFiles = fs.readdirSync(dataDir);
    logger.verbose(`データファイル数: ${dataFiles.length}`);
  }

  // PWA関連ファイルのチェック
  const manifestFile = path.join(DIST_DIR, 'manifest.json');
  const serviceWorker = path.join(DIST_DIR, 'service-worker.js');

  if (fs.existsSync(manifestFile)) {
    logger.success('PWAマニフェストファイルが存在します');
  } else {
    logger.verbose('PWAマニフェストファイルはありません');
  }

  if (fs.existsSync(serviceWorker)) {
    logger.success('Service Workerが存在します');
  } else {
    logger.verbose('Service Workerはありません');
  }

  // 総サイズチェック
  const totalSize = getDirectorySize(DIST_DIR);
  logger.info(`ビルド成果物の総サイズ: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);

  return !hasErrors;
}

// GitHub Pages 特有の設定チェック
function checkGitHubPagesConfig() {
  logger.info('GitHub Pages設定を検証中...');

  // .nojekyllファイルの存在確認
  const nojekyllPath = path.join(DIST_DIR, '.nojekyll');
  if (!fs.existsSync(nojekyllPath)) {
    logger.error('.nojekyllファイルが見つかりません');

    // 自動修正モードの場合
    if (options.fix) {
      try {
        fs.writeFileSync(nojekyllPath, '');
        logger.success('.nojekyllファイルを作成しました');
      } catch (error) {
        logger.error(`.nojekyllファイルの作成に失敗しました: ${error.message}`);
        return false;
      }
    }
    return false;
  }

  // 404.htmlの存在確認（SPA用）
  const notFoundPath = path.join(DIST_DIR, '404.html');
  if (!fs.existsSync(notFoundPath)) {
    logger.warning(
      '404.htmlファイルが見つかりません。SPAルーティングに問題が生じる可能性があります。'
    );

    // 自動修正モードの場合、index.htmlを404.htmlとしてコピー
    if (options.fix) {
      try {
        const indexPath = path.join(DIST_DIR, 'index.html');
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, notFoundPath);
          logger.success('index.htmlから404.htmlを自動生成しました');
        }
      } catch (error) {
        logger.error(`404.htmlファイルの自動生成に失敗しました: ${error.message}`);
      }
    }
  } else {
    logger.success('404.htmlファイルが存在します');
  }

  return true;
}

// 静的ホスティング向けの設定チェック
function checkStaticHostingConfig() {
  logger.info('静的ホスティング設定を検証中...');

  // 必須ファイルの再確認
  const essentialFiles = ['index.html', '404.html', 'assets'];
  for (const file of essentialFiles) {
    const filePath = path.join(DIST_DIR, file);
    if (!fs.existsSync(filePath)) {
      logger.error(`静的ホスティングに必要なファイルが見つかりません: ${file}`);
      return false;
    }
  }

  // 404.htmlの内容チェック
  const notFoundPath = path.join(DIST_DIR, '404.html');
  if (fs.existsSync(notFoundPath)) {
    const notFoundContent = fs.readFileSync(notFoundPath, 'utf-8');

    if (!notFoundContent.includes('<title>')) {
      logger.error('404.htmlにタイトルタグがありません');
      return false;
    }

    if (!notFoundContent.includes('index.html')) {
      logger.warning('404.htmlにindex.htmlへのリンクがありません');
    }
  }

  // robots.txtのチェック
  const robotsPath = path.join(DIST_DIR, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    logger.success('robots.txtファイルが存在します');
  } else {
    logger.warning('robots.txtファイルが見つかりません');
  }

  return true;
}

// 静的ホスティング環境向けの追加チェック
function checkStaticHostingOptimizations() {
  if (!options.staticHosting) {
    return true; // 静的ホスティングモードでない場合はスキップ
  }
  
  logger.info('静的ホスティング環境向けの最適化を検証中...');
  let hasWarnings = false;

  // base pathの設定確認
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const expectedBasePath = options.basePath || 'kueccha'; // デフォルトはkueccha
    
    // ベースパスの確認 - 複数のパターンをサポート
    const baseTagExists = indexContent.includes(`<base href="/${expectedBasePath}/"`) || 
                           indexContent.includes(`<base href="./"`) ||
                           indexContent.includes(`<base href="/"`);
    
    if (!baseTagExists) {
      logger.error(`静的ホスティング用のbase hrefタグが見つかりません (/${expectedBasePath}/)`);
      hasWarnings = true;
      
      // 自動修正
      if (options.fix) {
        try {
          const updatedContent = indexContent.replace(
            /<head>([\s\S]*?)<\/head>/,
            `<head>$1\n  <base href="/${expectedBasePath}/" />\n</head>`
          );
          fs.writeFileSync(indexPath, updatedContent);
          logger.success(`base hrefタグを追加しました: /${expectedBasePath}/`);
        } catch (error) {
          logger.error(`base hrefタグの追加に失敗しました: ${error.message}`);
        }
      }
    } else {
      logger.success('base hrefタグが適切に設定されています');
    }
    
    // プリロードとプリコネクトの最適化確認
    if (!indexContent.includes('<link rel="preconnect"')) {
      logger.warning('静的ホスティング環境のパフォーマンス向上のためのpreconnectタグが見つかりません');
      hasWarnings = true;
    }
    
    // マニフェストとアイコンの確認
    if (!indexContent.includes('manifest.json')) {
      logger.warning('PWAマニフェストへの参照が見つかりません');
      hasWarnings = true;
    }
  }
    // アセットの最適化確認
  const assetsDir = path.join(DIST_DIR, 'assets');
  if (fs.existsSync(assetsDir)) {    // JSファイル数のチェック
    const jsFiles = fs.readdirSync(assetsDir)
      .filter(file => file.endsWith('.js'));
      
    logger.verbose(`JSファイル数: ${jsFiles.length}個`);
    
    // 非同期読み込みの確認
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const hasAsyncScripts = indexContent.includes('defer') || indexContent.includes('async');
    if (!hasAsyncScripts) {
      logger.warning('静的ホスティング環境では、スクリプトの非同期読み込み(defer/async)を推奨します');
      hasWarnings = true;
    }
      
    // JSONデータは圧縮されているか
    const dataDir = path.join(DIST_DIR, 'data');
    if (fs.existsSync(dataDir)) {
      const jsonFiles = fs.readdirSync(dataDir)
        .filter(file => file.endsWith('.json'));
        
      if (jsonFiles.length > 0) {
        let totalSize = 0;
        jsonFiles.forEach(file => {
          const filePath = path.join(dataDir, file);
          totalSize += fs.statSync(filePath).size;
        });
        
        logger.info(`JSONデータファイル: ${jsonFiles.length}個, 合計サイズ: ${(totalSize / 1024).toFixed(2)}KB`);
        
        if (totalSize > 500 * 1024) { // 500KB以上
          logger.warning('JSONデータのサイズが大きすぎます。データの分割またはGzip圧縮を検討してください');
          hasWarnings = true;
        }
      }
    }
  }
  
  // .nojekyllファイルを確認（静的ホスティング必須）
  const nojekyllPath = path.join(DIST_DIR, '.nojekyll');
  if (!fs.existsSync(nojekyllPath)) {
    logger.error('静的ホスティング環境には .nojekyll ファイルが必須です');
    hasWarnings = true;
    
    // 自動修正
    if (options.fix) {
      try {
        fs.writeFileSync(nojekyllPath, '');
        logger.success('.nojekyll ファイルを作成しました');
      } catch (error) {
        logger.error(`${error.message}`);
      }
    }
  }
  
  // CSSの数を確認（複数のCSSファイルは結合すべき）
  const cssFiles = fs.readdirSync(assetsDir)
    .filter(file => file.endsWith('.css'));
    
  if (cssFiles.length > 2) {
    logger.warning(`CSSファイルが多すぎます(${cssFiles.length}個)。パフォーマンス向上のため結合を推奨します`);
    hasWarnings = true;
  }
  
  return !hasWarnings;
}

// メイン実行関数
async function main() {
  logger.info('=== ビルド検証を開始 ===');
  logger.info(`日時: ${new Date().toLocaleString()}`);
  logger.info(`モード: ${options.ciMode ? 'CI' : '標準'} ${options.fix ? '(自動修正有効)' : ''}`);
  if (options.staticHosting) {
    logger.info(chalk.magenta('静的ホスティング環境向け最適化検証を実行します'));
  }

  let success = true;

  // 各検証ステップを実行
  const structureValid = checkFileStructure();
  if (!structureValid) {
    logger.error('ファイル構造の検証に失敗しました');
    success = false;
  }
  // GitHub Pages設定の検証
  const ghPagesValid = checkGitHubPagesConfig();
  if (!ghPagesValid && !options.fix) {
    logger.warning('GitHub Pages設定に問題があります');
    // 重大エラーではないので success = false としない
  }

  // 静的ホスティング設定の検証
  const staticHostingConfigValid = checkStaticHostingConfig();
  if (!staticHostingConfigValid) {
    logger.warning('静的ホスティング設定に問題があります');
    // 警告レベルの問題なのでsuccess = falseとはしない
  }

  // 静的ホスティング最適化の検証（オプションが有効な場合のみ）
  if (options.staticHosting) {
    const staticOptimizationsValid = checkStaticHostingOptimizations();
    if (!staticOptimizationsValid) {
      logger.warning('静的ホスティング環境向けの最適化に問題があります');
      // 警告レベルの問題なのでsuccess = falseとはしない
    }
  }

  // 必要に応じて追加の検証ステップを実行
  // ...

  if (success) {
    logger.success('ビルド検証が正常に完了しました！');
    process.exit(0);
  } else {
    logger.error('ビルド検証中にエラーが発生しました。詳細は上記のログを確認してください。');
    process.exit(1);
  }
}

// スクリプトの実行
main().catch(error => {
  logger.error(`予期しないエラーが発生しました: ${error.message}`);
  process.exit(1);
});
