#!/usr/bin/env node
/**
 * インタラクティブな静的ホスティング環境チェックスクリプト
 *
 * このスクリプトはユーザーとの対話形式で静的ホスティング環境設定を最適化します。
 * GitHub Pages, Netlify, Vercelなどのプラットフォームに合わせた設定を生成します。
 *
 * 実行方法：pnpm run static-hosting-setup
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 色付きログ出力
const log = {
  info: msg => console.info(`\x1b[34m${msg}\x1b[0m`),
  success: msg => console.info(`\x1b[32m✓ ${msg}\x1b[0m`),
  warning: msg => console.warn(`\x1b[33m⚠ ${msg}\x1b[0m`),
  error: msg => console.error(`\x1b[31m✗ ${msg}\x1b[0m`),
  question: msg => console.info(`\x1b[36m? ${msg}\x1b[0m`),
};

// ユーザー入力を取得するプロンプト
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// プロンプトをPromiseでラップ
function prompt(question) {
  return new Promise(resolve => {
    rl.question(`\x1b[36m? ${question}\x1b[0m `, answer => {
      resolve(answer.trim());
    });
  });
}

// 選択肢からの選択プロンプト
async function selectPrompt(message, choices) {
  log.question(message);
  choices.forEach((choice, i) => {
    console.info(`  ${i + 1}. ${choice}`);
  });

  const answer = await prompt('番号を入力してください:');
  const index = parseInt(answer, 10) - 1;
  if (index >= 0 && index < choices.length) {
    return choices[index];
  } else {
    log.error('無効な選択です。もう一度お試しください。');
    return selectPrompt(message, choices);
  }
}

// 確認プロンプト
async function confirmPrompt(message) {
  const answer = await prompt(`${message} (y/n)`);
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

// 設定用のオブジェクト
const config = {
  platform: '',
  basePath: '',
  optimizeForStaticHosting: true,
};

// パッケージ.jsonの更新
function updatePackageJson() {
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log.error('package.jsonが見つかりません');
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // scripts セクションの更新
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['verify:static'] = 'node scripts/static-hosting-check.js';
    packageJson.scripts['build:static'] = `vite build --base=/${config.basePath}/`;
    packageJson.scripts['preview:static'] = 'vite preview --base=/';

    // ホスティングプラットフォーム固有の設定
    if (config.platform === 'GitHub Pages') {
      packageJson.scripts['deploy:gh-pages'] = 'node scripts/deploy-to-gh-pages.mjs';
    } else if (config.platform === 'Netlify') {
      // netlify.toml があれば確認、なければ作成のオプションを示す
      log.info('netlify.tomlの設定を確認してください');
    }

    // package.jsonを保存
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    log.success('package.jsonを更新しました');
    return true;
  } catch (error) {
    log.error(`package.jsonの更新に失敗しました: ${error.message}`);
    return false;
  }
}

// .env.production の更新/作成
function updateEnvProduction() {
  const envPath = path.join(rootDir, '.env.production');

  try {
    // 既存の内容を読み込むか、新しいファイルを作成
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf-8');
    }

    // STATIC_HOSTINGフラグを追加/更新
    if (!content.includes('VITE_STATIC_HOSTING=')) {
      content += '\nVITE_STATIC_HOSTING=true\n';
    } else {
      content = content.replace(/VITE_STATIC_HOSTING=.*/, 'VITE_STATIC_HOSTING=true');
    }

    // UIの最適化フラグを追加
    if (!content.includes('VITE_MAPS_MINIMAL_UI=')) {
      content += 'VITE_MAPS_MINIMAL_UI=true\n';
    } else {
      content = content.replace(/VITE_MAPS_MINIMAL_UI=.*/, 'VITE_MAPS_MINIMAL_UI=true');
    }

    fs.writeFileSync(envPath, content);
    log.success('.env.productionを更新しました');
    return true;
  } catch (error) {
    log.error(`.env.productionの更新に失敗しました: ${error.message}`);
    return false;
  }
}

// .gitignoreの更新
function updateGitignore() {
  const gitignorePath = path.join(rootDir, '.gitignore');

  try {
    let content = '';
    if (fs.existsSync(gitignorePath)) {
      content = fs.readFileSync(gitignorePath, 'utf-8');
    }

    // .env.productionが.gitignoreに含まれてないことを確認
    if (content.includes('.env.production')) {
      content = content.replace(/\.env\.production/g, '# .env.production - 静的デプロイ用に必要');
      fs.writeFileSync(gitignorePath, content);
      log.success('.gitignoreから.env.productionを除外しました');
    }

    return true;
  } catch (error) {
    log.error(`.gitignoreの更新に失敗しました: ${error.message}`);
    return false;
  }
}

// インデックスHTMLのベースパスを更新
function checkAndUpdateIndexHtml() {
  const indexPath = path.join(rootDir, 'index.html');

  try {
    if (fs.existsSync(indexPath)) {
      let content = fs.readFileSync(indexPath, 'utf-8');

      // baseタグがあるか確認
      const baseTagRegex = /<base\s+href="[^"]*"\s*\/?>/i;
      const hasBaseTag = baseTagRegex.test(content);

      if (!hasBaseTag) {
        log.info('baseタグが見つかりません。ビルド時に自動追加されます。');
      } else {
        log.success('baseタグが見つかりました');
      }
    } else {
      log.error('index.htmlが見つかりません');
    }

    return true;
  } catch (error) {
    log.error(`index.htmlの確認に失敗しました: ${error.message}`);
    return false;
  }
}

// メイン実行関数
async function main() {
  try {
    log.info('=== 静的ホスティング環境設定ウィザード ===');
    log.info('このウィザードでは、静的ホスティング環境向けの最適な設定を行います。');

    // ホスティングプラットフォームの選択
    config.platform = await selectPrompt('デプロイ先のプラットフォームを選択してください:', [
      'GitHub Pages',
      'Netlify',
      'Vercel',
      'Firebase Hosting',
      'その他',
    ]);
    log.success(`選択されたプラットフォーム: ${config.platform}`);

    // ベースパスの設定
    if (config.platform === 'GitHub Pages') {
      const defaultBasePath = path.basename(rootDir); // 現在のフォルダ名をデフォルトに
      config.basePath = await prompt(
        `ベースパスを入力してください (デフォルト: ${defaultBasePath}):`
      );
      if (!config.basePath) {
        config.basePath = defaultBasePath;
      }
      log.success(`ベースパスを設定: /${config.basePath}/`);
    } else {
      // 他のプラットフォームではルートデプロイが一般的
      config.basePath = '';
    }

    // 確認
    log.info('以下の設定を適用します:');
    console.info(`プラットフォーム: ${config.platform}`);
    console.info(`ベースパス: ${config.basePath ? '/' + config.basePath + '/' : '/ (ルート)'}`);

    const confirmed = await confirmPrompt('これらの設定を適用してよろしいですか?');
    if (!confirmed) {
      log.info('設定を中止しました。');
      rl.close();
      return;
    }

    // 各設定を適用
    log.info('設定を適用しています...');

    updatePackageJson();
    updateEnvProduction();
    updateGitignore();
    checkAndUpdateIndexHtml();

    log.success('静的ホスティング環境の設定が完了しました！');
    log.info('ビルド・デプロイ方法:');
    console.info(`1. 'pnpm run build:static' でビルド`);
    console.info(`2. 'pnpm run verify:static' で検証`);

    if (config.platform === 'GitHub Pages') {
      console.info(`3. 'pnpm run deploy:gh-pages' でGitHub Pagesへデプロイ`);
    } else {
      console.info(`3. distフォルダを${config.platform}にデプロイ`);
    }

    rl.close();
  } catch (error) {
    log.error(`エラーが発生しました: ${error.message}`);
    rl.close();
  }
}

main();
