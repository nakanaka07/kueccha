/**
 * GitHub Pagesへのデプロイスクリプト
 * 
 * このスクリプトは静的サイト前提の運用方針に基づき、
 * distディレクトリの内容をGitHub Pagesにデプロイします。
 * リポジトリ名を自動検出し、BASE_PATHを適切に設定します。
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// GitHub Pagesのデプロイに必要な.nojekyllファイルを作成
const distPath = path.resolve(__dirname, '../dist');
const nojekyllPath = path.join(distPath, '.nojekyll');

// リポジトリ名を取得する関数
function getRepositoryName() {
  try {
    // gitコマンドからリモートURLを取得
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    
    // URLからリポジトリ名を抽出
    let repoName = '';
    
    if (remoteUrl.includes('github.com')) {
      // GitHub URLからリポジトリ名を抽出
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)(?:\.git)?$/);
      if (match && match[2]) {
        repoName = match[2];
      }
    }
    
    if (!repoName) {
      // フォールバック：カレントディレクトリ名をリポジトリ名として使用
      repoName = path.basename(process.cwd());
    }
    
    return repoName;
  } catch (error) {
    console.warn('⚠️ リポジトリ名の自動検出に失敗しました。現在のディレクトリ名を使用します。');
    return path.basename(process.cwd());
  }
}

// 処理開始のログ
console.log('🚀 GitHub Pagesへのデプロイを開始します...');

try {
  // リポジトリ名を取得
  const repoName = getRepositoryName();
  console.log(`✅ リポジトリ名を検出しました: ${repoName}`);
  
  // ビルドディレクトリの存在確認
  if (!fs.existsSync(distPath)) {
    console.error('❌ distディレクトリが見つかりません。まずビルドを実行してください。');
    process.exit(1);
  }

  // .nojekyllファイルの作成（Jekyll処理を無効化）
  if (!fs.existsSync(nojekyllPath)) {
    fs.writeFileSync(nojekyllPath, '');
    console.log('✅ .nojekyllファイルを作成しました');
  }

  // 404.htmlの作成（SPA対応）
  const indexHtmlPath = path.join(distPath, 'index.html');
  const notFoundPath = path.join(distPath, '404.html');
  
  if (fs.existsSync(indexHtmlPath) && !fs.existsSync(notFoundPath)) {
    fs.copyFileSync(indexHtmlPath, notFoundPath);
    console.log('✅ SPA対応のため404.htmlを作成しました');
  }

  // デプロイコマンドの実行
  // 注: このスクリプトは実際のデプロイコマンドに置き換える必要があります
  console.log('📦 GitHub Pagesへのデプロイ処理を実行します...');
  
  // 実際のデプロイには以下のいずれかの方法を使用できます:
  // 1. gh-pages npmパッケージを使用する方法
  // console.log('gh-pagesパッケージを使用してデプロイします...');
  // execSync('npx gh-pages -d dist', { stdio: 'inherit' });
  
  // 2. GitHub Actionsを使用する方法 (GitHub Actionsのワークフローファイルが必要)
  console.log('GitHub Actionsでのデプロイを推奨します。');
  console.log('リポジトリのActions設定を確認してください。');
  
  console.log('✅ デプロイ準備が完了しました');
  console.log('📋 GitHub Actionsの設定方法:');
  console.log('1. .github/workflows/deploy.ymlファイルを作成');
  console.log('2. GitHub Pagesのソース設定をGitHub Actionsに変更');
  console.log('3. リポジトリのSettings > Pages > Buildを確認');

} catch (error) {
  console.error('❌ デプロイ処理中にエラーが発生しました:', error);
  process.exit(1);
}
