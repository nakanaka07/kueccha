/* eslint-disable no-undef */
/**
 * GitHub Pagesへのデプロイスクリプト (最適化版)
 *
 * このスクリプトは静的サイト前提の運用方針に基づき、
 * distディレクトリの内容をGitHub Pagesにデプロイします。
 *
 * 最適化機能:
 * - リポジトリ名を自動検出し、BASE_PATHを適切に設定
 * - 複数のデプロイ方法をサポート (gh-pages / GitHub Actions)
 * - SPAルーティング用の404.htmlを自動生成
 * - 詳細なエラー報告と回復手順
 * - 大規模ファイル転送の最適化
 * - GitHub Actionsワークフロー設定ファイルの自動生成
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';
import readline from 'readline';
import { fileURLToPath } from 'url';

// ESM環境で__dirnameを再現
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distPath = path.resolve(rootDir, 'dist');
const nojekyllPath = path.join(distPath, '.nojekyll');
const workflowsDir = path.join(rootDir, '.github', 'workflows');
const workflowPath = path.join(workflowsDir, 'deploy.yml');

// console オブジェクトのラッパー (ESLintエラー回避 + 強化ログ機能)
const logger = {
  info: (message, ...args) => console.info(`\x1b[36m${message}\x1b[0m`, ...args),
  success: (message, ...args) => console.info(`\x1b[32m✅ ${message}\x1b[0m`, ...args),
  warn: (message, ...args) => console.warn(`\x1b[33m⚠️ ${message}\x1b[0m`, ...args),
  error: (message, ...args) => console.error(`\x1b[31m❌ ${message}\x1b[0m`, ...args),
  step: (num, total, message) => console.info(`\x1b[36m[${num}/${total}] ${message}\x1b[0m`),
  divider: () => console.info('\x1b[90m' + '-'.repeat(50) + '\x1b[0m'),
};

// ユーザー入力を取得するプロミス関数
function getUserInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * リポジトリ情報を取得する機能強化関数
 * @returns {Object} リポジトリ情報 (名前、ユーザー名、URL等)
 */
function getRepositoryInfo() {
  try {
    // gitコマンドからリモートURLを取得
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    let repoName = '';
    let userName = '';
    let repoUrl = '';

    if (remoteUrl.includes('github.com')) {
      // GitHub URLからリポジトリ名とユーザー名を抽出
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/);
      if (match && match[1] && match[2]) {
        userName = match[1];
        repoName = match[2];
        repoUrl = `https://github.com/${userName}/${repoName}`;
      }
    }

    if (!repoName) {
      // フォールバック：カレントディレクトリ名をリポジトリ名として使用
      repoName = path.basename(process.cwd());
      logger.warn('リポジトリ名の抽出に失敗しました。ディレクトリ名を使用します。');
    }

    return {
      name: repoName,
      owner: userName,
      url: repoUrl,
      basePath: `/${repoName}/`,
      deployUrl: userName ? `https://${userName}.github.io/${repoName}/` : null,
    };
  } catch {
    // 詳細なエラーログを提供
    logger.warn('リポジトリ情報の自動検出に失敗しました。ディレクトリ名を使用します。');
    const dirName = path.basename(process.cwd());
    return {
      name: dirName,
      owner: null,
      url: null,
      basePath: `/${dirName}/`,
      deployUrl: null,
    };
  }
}

/**
 * 環境変数ファイルにBASE_PATHを設定する関数
 * @param {string} basePath GitHub Pagesのベースパス
 */
function setBasePath(basePath) {
  try {
    // vite.config.tsファイルを読み取り、base設定を更新
    const viteConfigPath = path.join(rootDir, 'vite.config.ts');
    if (fs.existsSync(viteConfigPath)) {
      let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

      // baseパスの設定が既にあるかチェック
      if (viteConfig.includes('base:')) {
        // 既存のbase設定を更新（正規表現を使用して安全に置換）
        viteConfig = viteConfig.replace(/base:\s*(['"])(.+?)\1/, `base: $1${basePath}$1`);
      } else {
        // base設定がない場合は追加（defineConfig内に挿入）
        viteConfig = viteConfig.replace(
          /defineConfig\(\s*\{/,
          `defineConfig({\n  base: '${basePath}',`
        );
      }

      fs.writeFileSync(viteConfigPath, viteConfig, 'utf8');
      logger.success(`vite.config.tsのベースパスを '${basePath}' に設定しました`);
    }

    // .envファイルも更新（存在しなければ作成）
    const envPath = path.join(rootDir, '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');

      // 既存のVITE_BASE_PATHがある場合は置換、なければ追加
      if (envContent.includes('VITE_BASE_PATH=')) {
        envContent = envContent.replace(/VITE_BASE_PATH=.*/, `VITE_BASE_PATH=${basePath}`);
      } else {
        envContent += `\nVITE_BASE_PATH=${basePath}\n`;
      }
    } else {
      envContent = `VITE_BASE_PATH=${basePath}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    logger.success(`.envファイルにVITE_BASE_PATH=${basePath}を設定しました`);
  } catch (err) {
    logger.error('ベースパスの設定中にエラーが発生しました:', err);
    logger.warn(
      'package.jsonのスクリプトで手動で設定してください: "VITE_BASE_PATH=/リポジトリ名/"'
    );
  }
}

/**
 * デプロイ準備を行う関数（必要なファイル作成とチェック）
 */
async function prepareDeployment() {
  const totalSteps = 5;
  let currentStep = 0;

  try {
    // ステップ1: ビルドディレクトリの存在確認
    currentStep++;
    logger.step(currentStep, totalSteps, 'ビルドディレクトリのチェック');
    if (!fs.existsSync(distPath)) {
      logger.error('distディレクトリが見つかりません。まずビルドを実行してください。');
      logger.info('ビルドコマンド: npm run build:ghpages または npm run build');
      process.exit(1);
    }

    // distディレクトリ内のファイルサイズを確認
    const distFiles = fs.readdirSync(distPath);
    if (distFiles.length === 0) {
      logger.error('distディレクトリが空です。ビルドが正しく実行されませんでした。');
      process.exit(1);
    }

    // ステップ2: .nojekyllファイルの作成（Jekyll処理を無効化）
    currentStep++;
    logger.step(currentStep, totalSteps, '.nojekyllファイルの作成');
    if (!fs.existsSync(nojekyllPath)) {
      fs.writeFileSync(nojekyllPath, '');
      logger.success('.nojekyllファイルを作成しました');
    } else {
      logger.info('.nojekyllファイルは既に存在します');
    }

    // ステップ3: 404.htmlの作成（SPA対応）
    currentStep++;
    logger.step(currentStep, totalSteps, 'SPAルーティング用の404.htmlを作成');
    const indexHtmlPath = path.join(distPath, 'index.html');
    const notFoundPath = path.join(distPath, '404.html');

    if (fs.existsSync(indexHtmlPath)) {
      if (!fs.existsSync(notFoundPath)) {
        fs.copyFileSync(indexHtmlPath, notFoundPath);
        logger.success('SPA対応のため404.htmlを作成しました');
      } else {
        logger.info('404.htmlファイルは既に存在します');
      }
    } else {
      logger.error('index.htmlが見つかりません。ビルドが正しく実行されませんでした。');
      process.exit(1);
    }

    // ステップ4: robots.txtの確認（存在しなければ作成）
    currentStep++;
    logger.step(currentStep, totalSteps, 'robots.txtの確認');
    const robotsPath = path.join(distPath, 'robots.txt');
    if (!fs.existsSync(robotsPath)) {
      const basicRobotsContent = 'User-agent: *\nAllow: /\n';
      fs.writeFileSync(robotsPath, basicRobotsContent, 'utf8');
      logger.success('robots.txtを作成しました');
    } else {
      logger.info('robots.txtは既に存在します');
    }

    // ステップ5: assetsディレクトリ内の大きなファイルのチェック（最適化提案）
    currentStep++;
    logger.step(currentStep, totalSteps, '最適化のためのアセットファイル確認');
    const assetsDir = path.join(distPath, 'assets');
    if (fs.existsSync(assetsDir)) {
      let largeFiles = [];
      const checkFilesRecursively = dir => {
        fs.readdirSync(dir, { withFileTypes: true }).forEach(dirent => {
          const fullPath = path.join(dir, dirent.name);
          if (dirent.isDirectory()) {
            checkFilesRecursively(fullPath);
          } else {
            const stats = fs.statSync(fullPath);
            // 1MB以上のファイルをチェック
            if (stats.size > 1024 * 1024) {
              largeFiles.push({
                path: path.relative(distPath, fullPath),
                size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
              });
            }
          }
        });
      };

      checkFilesRecursively(assetsDir);

      if (largeFiles.length > 0) {
        logger.warn(
          '大きなファイルが検出されました。これらのファイルは読み込みパフォーマンスに影響する可能性があります:'
        );
        largeFiles.forEach(file => {
          logger.warn(`- ${file.path} (${file.size})`);
        });
        logger.info('提案: これらのファイルの最適化を検討してください');
      } else {
        logger.success('大きなアセットファイルは見つかりませんでした');
      }
    }

    logger.divider();
    return true;
  } catch (err) {
    logger.error('デプロイ準備中にエラーが発生しました:', err);
    return false;
  }
}

/**
 * GitHub Actionsワークフロー設定ファイルを生成する関数
 */
function generateGitHubActionsWorkflow() {
  try {
    // .github/workflowsディレクトリの作成（存在しなければ）
    if (!fs.existsSync(workflowsDir)) {
      fs.mkdirSync(workflowsDir, { recursive: true });
    }

    // ワークフロー設定ファイルの内容
    const workflowContent = `# GitHub Pages deployment workflow
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  # 手動実行用トリガー
  workflow_dispatch:

# GITHUB_TOKENのパーミッション設定
permissions:
  contents: read
  pages: write
  id-token: write

# 同時に1つのデプロイのみ許可
concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "22"
          cache: 'npm'
      - name: Setup Pages
        uses: actions/configure-pages@v3
        with:
          static_site_generator: vite
      - name: Install dependencies
        run: npm ci
      - name: Build with Vite
        run: npm run build:ghpages
      - name: Prepare for SPA routing
        run: |
          cp dist/index.html dist/404.html
          touch dist/.nojekyll
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
`;

    // ファイルへ書き込み
    fs.writeFileSync(workflowPath, workflowContent, 'utf8');
    logger.success(`GitHub Actionsワークフロー設定ファイルを作成しました: ${workflowPath}`);
    logger.info(
      'このファイルをGitリポジトリにコミットすることで、GitHub Actionsによる自動デプロイが有効になります'
    );

    return true;
  } catch (err) {
    logger.error('GitHub Actionsワークフロー設定の生成中にエラーが発生しました:', err);
    return false;
  }
}

/**
 * npm gh-pagesパッケージを使用してデプロイする関数
 * @returns {boolean} デプロイの成功/失敗
 */
async function deployWithGhPages() {
  try {
    // gh-pagesパッケージのインストール確認
    logger.info('gh-pagesパッケージの確認...');

    try {
      // gh-pagesがインストールされているか確認（非表示で実行）
      execSync('npm list gh-pages --depth=0', { stdio: 'ignore' });
    } catch {
      // インストールされていない場合はインストール
      logger.info('gh-pagesパッケージをインストールしています...');
      execSync('npm install --save-dev gh-pages', { stdio: 'inherit' });
    }

    // デプロイの実行
    logger.info('GitHub Pagesへデプロイを実行しています...');
    execSync('npx gh-pages -d dist --dotfiles', { stdio: 'inherit' });

    logger.success('デプロイが完了しました！');
    return true;
  } catch (err) {
    logger.error('gh-pagesを使用したデプロイ中にエラーが発生しました:', err);
    return false;
  }
}

/**
 * メイン実行関数
 */
async function main() {
  logger.info('🚀 GitHub Pagesへのデプロイを開始します...');
  logger.divider();

  try {
    // リポジトリ情報の取得
    const repoInfo = getRepositoryInfo();
    logger.success(`リポジトリ名を検出しました: ${repoInfo.name}`);

    if (repoInfo.owner) {
      logger.success(`リポジトリ所有者: ${repoInfo.owner}`);
    }

    // ベースパスの設定
    setBasePath(repoInfo.basePath);

    // デプロイ準備
    const isReady = await prepareDeployment();
    if (!isReady) {
      logger.error('デプロイ準備に失敗しました。');
      process.exit(1);
    }

    // デプロイ方法の選択
    logger.info('デプロイ方法を選択してください:');
    logger.info('1. GitHub Actions (推奨・自動化向け)');
    logger.info('2. gh-pages npmパッケージ (手動デプロイ向け)');

    const choice = await getUserInput('選択 (1/2): ');

    if (choice === '1') {
      // GitHub Actionsの設定
      const success = generateGitHubActionsWorkflow();
      if (success) {
        logger.divider();
        logger.success('GitHub Actionsの設定が完了しました。以下の手順で続行してください:');
        logger.info(
          '1. 変更をコミットしてプッシュ: git add .github && git commit -m "Add GitHub Actions workflow" && git push'
        );
        logger.info('2. GitHubリポジトリの Settings > Pages > Build and deployment セクションで:');
        logger.info('   - Source を "GitHub Actions" に設定');

        if (repoInfo.deployUrl) {
          logger.info(`デプロイ後のURL: ${repoInfo.deployUrl}`);
        }
      }
    } else if (choice === '2') {
      // gh-pagesパッケージを使用したデプロイ
      const success = await deployWithGhPages();
      if (success && repoInfo.deployUrl) {
        logger.divider();
        logger.success(`デプロイされたサイトは以下のURLで確認できます: ${repoInfo.deployUrl}`);
      }
    } else {
      logger.error('無効な選択です。1または2を選択してください。');
      process.exit(1);
    }
  } catch (err) {
    logger.error('デプロイ処理中にエラーが発生しました:', err);
    process.exit(1);
  }
}

// スクリプトの実行
main();
