/**
 * ベースパス自動設定スクリプト
 * 
 * このスクリプトは現在のリポジトリ名を自動検出し、
 * GitHub Pages用のベースパスを設定します。
 * 
 * 使用方法: デプロイ前に実行
 * node scripts/set-base-path.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// build:ghpagesスクリプトを更新する関数
function updateBuildScript(repoName) {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  
  try {
    // package.jsonを読み込み
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // 現在のbuild:ghpagesスクリプトを取得
    const currentBuildScript = packageJson.scripts['build:ghpages'] || '';
    
    // VITE_BASE_PATHの部分を更新
    const updatedBuildScript = currentBuildScript.replace(
      /VITE_BASE_PATH=\/[^/\s]+\//,
      `VITE_BASE_PATH=/${repoName}/`
    );
    
    // 変更がない場合は処理を終了
    if (currentBuildScript === updatedBuildScript) {
      console.log(`✅ ベースパスはすでに /${repoName}/ に設定されています`);
      return;
    }
    
    // 更新したスクリプトを書き込み
    packageJson.scripts['build:ghpages'] = updatedBuildScript;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log(`✅ ベースパスを /${repoName}/ に更新しました`);
    
    // 一時環境変数ファイルを作成（次回のビルドのため）
    const envFilePath = path.resolve(__dirname, '../.env.production.local');
    fs.writeFileSync(envFilePath, `VITE_BASE_PATH=/${repoName}/\n`);
    console.log(`✅ 環境変数ファイル .env.production.local を作成しました`);
    
  } catch (error) {
    console.error('❌ package.jsonの更新中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// メイン処理
try {
  // リポジトリ名を取得
  const repoName = getRepositoryName();
  console.log(`📂 検出されたリポジトリ名: ${repoName}`);
  
  // ビルドスクリプトを更新
  updateBuildScript(repoName);
  
  console.log('🚀 ベースパス設定が完了しました');
} catch (error) {
  console.error('❌ 処理中にエラーが発生しました:', error);
  process.exit(1);
}
