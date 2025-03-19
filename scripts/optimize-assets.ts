#!/usr/bin/env node

/**
 * ビルド後のアセット最適化スクリプト
 *
 * 機能:
 * - 画像の最適化
 * - 不要なファイルの削除
 * - キャッシュ設定の生成
 * - PWA関連ファイル生成
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import chalk from 'chalk';
import glob from 'fast-glob';
import sharp from 'sharp';

// 型定義
interface OptimizationConfig {
  distDir: string;
  srcDir: string;
  imageFormats: string[];
  imageSizes: number[];
  filesToRemove: string[];
  headers: Record<string, string>;
}

// 最適化の設定
const config: OptimizationConfig = {
  distDir: '../dist',
  srcDir: '../src',
  imageFormats: ['.jpg', '.jpeg', '.png', '.webp'],
  imageSizes: [480, 720, 1080], // レスポンシブイメージのサイズ
  filesToRemove: ['.DS_Store', 'Thumbs.db', '*.log'], // 削除する不要ファイル
  headers: {
    // 基本的なキャッシュ設定
    'Cache-Control': 'public, max-age=31536000, immutable',
    // セキュリティヘッダー
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  },
};

// パスの設定
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, config.distDir);
const srcDir = path.join(__dirname, config.srcDir);

/**
 * 非同期メイン関数
 */
async function main(): Promise<void> {
  try {
    // ビルドディレクトリの存在確認
    checkBuildDirectory();

    console.log(chalk.blue('🔄 ビルドアセットの最適化を実行中...'));

    // 各最適化タスクを並行実行
    await Promise.all([
      copyServiceWorker(),
      checkAndGenerateManifest(),
      optimizeImages(),
      removeUnnecessaryFiles(),
      generateCacheConfig(),
    ]);

    console.log(chalk.green('✅ ビルドアセットの最適化が完了しました'));
  } catch (error) {
    console.error(chalk.red(`❌ 最適化処理中にエラーが発生しました: ${error.message}`));
    process.exit(1);
  }
}

/**
 * ビルドディレクトリの存在確認
 */
function checkBuildDirectory(): void {
  if (!fs.existsSync(distDir)) {
    throw new Error('distディレクトリが見つかりません。先にビルドを実行してください。');
  }
}

/**
 * サービスワーカーファイルのコピー
 */
async function copyServiceWorker(): Promise<void> {
  const swSource = path.join(srcDir, 'service-worker.js');
  const swDest = path.join(distDir, 'service-worker.js');

  try {
    if (fs.existsSync(swSource)) {
      await fs.promises.copyFile(swSource, swDest);
      console.log(chalk.green('✅ サービスワーカーをコピーしました'));

      // サービスワーカー登録スクリプトが存在するか確認
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtmlPath)) {
        const htmlContent = await fs.promises.readFile(indexHtmlPath, 'utf-8');
        if (!htmlContent.includes('serviceWorker.register')) {
          console.log(chalk.yellow('⚠️ index.htmlにサービスワーカー登録コードがありません'));
        }
      }
    } else {
      // Workboxを使用したサービスワーカー生成
      console.log(
        chalk.yellow('⚠️ サービスワーカーファイルが見つかりません。基本的なSWを生成します。'),
      );
      await generateBasicServiceWorker();
    }
  } catch (error) {
    console.warn(
      chalk.yellow(`⚠️ サービスワーカーの処理中にエラーが発生しました: ${error.message}`),
    );
  }
}

/**
 * 基本的なサービスワーカーの生成
 */
async function generateBasicServiceWorker(): Promise<void> {
  const swContent = `// 自動生成されたサービスワーカー
const CACHE_NAME = 'kueccha-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // 主要なアセット
  '/assets/index-*.js',
  '/assets/index-*.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
`;

  await fs.promises.writeFile(path.join(distDir, 'service-worker.js'), swContent);
  console.log(chalk.green('✅ 基本的なサービスワーカーを生成しました'));
}

/**
 * PWA対応のマニフェストファイル確認と生成
 */
async function checkAndGenerateManifest(): Promise<void> {
  const manifestPath = path.join(distDir, 'manifest.json');

  try {
    if (!fs.existsSync(manifestPath)) {
      console.log(
        chalk.yellow('⚠️ manifest.jsonが見つかりません。基本的なマニフェストを生成します。'),
      );

      // 基本的なマニフェストファイルを生成
      const manifest = {
        name: 'Kueccha App',
        short_name: 'Kueccha',
        description: 'Google Maps を活用した位置情報アプリケーション',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4285f4',
        icons: [
          {
            src: '/assets/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/assets/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      };

      await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(chalk.green('✅ 基本的なmanifest.jsonを生成しました'));

      // マニフェストアイコンのプレースホルダー作成
      await ensureManifestIcons();
    } else {
      console.log(chalk.green('✅ manifest.jsonが存在します'));

      // マニフェストが有効かチェック
      const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf-8'));
      if (!manifest.icons || manifest.icons.length === 0) {
        console.log(chalk.yellow('⚠️ マニフェストにアイコンが定義されていません'));
      }

      // アイコンファイルの存在確認
      if (manifest.icons) {
        for (const icon of manifest.icons) {
          const iconPath = path.join(distDir, icon.src.replace(/^\//, ''));
          if (!fs.existsSync(iconPath)) {
            console.log(chalk.yellow(`⚠️ マニフェストアイコンが見つかりません: ${icon.src}`));
          }
        }
      }
    }
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ マニフェスト処理中にエラーが発生しました: ${error.message}`));
  }
}

/**
 * マニフェスト用のアイコンを確保
 */
async function ensureManifestIcons(): Promise<void> {
  const assetsDir = path.join(distDir, 'assets');

  // アセットディレクトリが存在しなければ作成
  if (!fs.existsSync(assetsDir)) {
    await fs.promises.mkdir(assetsDir, { recursive: true });
  }

  // プレースホルダーの色 (PWAが必須とするアイコン)
  const placeholderColor = { r: 66, g: 133, b: 244, alpha: 1 }; // Google Blue

  // 必要なサイズのアイコンを生成
  for (const size of [192, 512]) {
    const iconPath = path.join(assetsDir, `icon-${size}x${size}.png`);

    if (!fs.existsSync(iconPath)) {
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: placeholderColor,
        },
      })
        .png()
        .toFile(iconPath);

      console.log(chalk.green(`✅ プレースホルダーアイコンを生成しました: ${size}x${size}`));
    }
  }
}

/**
 * 画像ファイルの最適化
 */
async function optimizeImages(): Promise<void> {
  try {
    // 画像ファイルを検索
    const imageExtensions = config.imageFormats.join('|').replace(/\./g, '');
    const imagePattern = `${distDir}/**/*.@(${imageExtensions})`;

    const imageFiles = await glob(imagePattern, { onlyFiles: true });

    if (imageFiles.length === 0) {
      console.log(chalk.yellow('⚠️ 最適化対象の画像ファイルが見つかりませんでした'));
      return;
    }

    console.log(chalk.blue(`🖼️ ${imageFiles.length}枚の画像を最適化中...`));

    // 各画像を最適化
    const optimizationPromises = imageFiles.map(async (imagePath) => {
      const extension = path.extname(imagePath).toLowerCase();
      const filename = path.basename(imagePath, extension);
      const dirname = path.dirname(imagePath);

      try {
        // 画像の最適化
        const image = sharp(imagePath);

        // フォーマット別の最適化オプション
        if (extension === '.jpg' || extension === '.jpeg') {
          await image
            .jpeg({ quality: 80, progressive: true })
            .toBuffer()
            .then((data) => fs.promises.writeFile(imagePath, data));
        } else if (extension === '.png') {
          await image
            .png({ compressionLevel: 9, palette: true })
            .toBuffer()
            .then((data) => fs.promises.writeFile(imagePath, data));
        } else if (extension === '.webp') {
          await image
            .webp({ quality: 80 })
            .toBuffer()
            .then((data) => fs.promises.writeFile(imagePath, data));
        }

        // WebP版の生成 (jpg/pngの場合)
        if (extension === '.jpg' || extension === '.jpeg' || extension === '.png') {
          await image.webp({ quality: 80 }).toFile(path.join(dirname, `${filename}.webp`));
        }

        return imagePath;
      } catch (error) {
        console.warn(
          chalk.yellow(
            `⚠️ 画像の最適化に失敗しました ${path.basename(imagePath)}: ${error.message}`,
          ),
        );
        return null;
      }
    });

    const optimizedImages = (await Promise.all(optimizationPromises)).filter(Boolean);
    console.log(chalk.green(`✅ ${optimizedImages.length}枚の画像を最適化しました`));
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ 画像最適化中にエラーが発生しました: ${error.message}`));
  }
}

/**
 * 不要なファイルの削除
 */
async function removeUnnecessaryFiles(): Promise<void> {
  try {
    const patterns = config.filesToRemove.map((pattern) => `${distDir}/**/${pattern}`);
    const filesToRemove = await glob(patterns);

    if (filesToRemove.length === 0) {
      console.log(chalk.green('✅ 削除すべき不要ファイルはありません'));
      return;
    }

    console.log(chalk.blue(`🗑️ ${filesToRemove.length}個の不要ファイルを削除中...`));

    for (const file of filesToRemove) {
      await fs.promises.unlink(file);
    }

    console.log(chalk.green(`✅ ${filesToRemove.length}個の不要ファイルを削除しました`));
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ 不要ファイルの削除中にエラーが発生しました: ${error.message}`));
  }
}

/**
 * キャッシュ設定の生成 (_headers ファイル)
 */
async function generateCacheConfig(): Promise<void> {
  try {
    const headersPath = path.join(distDir, '_headers');

    let headersContent = `# Netlify/Vercel/Cloudflare Pages 用のヘッダー設定\n`;
    headersContent += `/*\n`;

    Object.entries(config.headers).forEach(([key, value]) => {
      headersContent += `  ${key}: ${value}\n`;
    });

    // キャッシュしない特定のファイルに対する設定
    headersContent += `\n# サービスワーカーはキャッシュさせない\n`;
    headersContent += `/service-worker.js\n`;
    headersContent += `  Cache-Control: no-cache, no-store, must-revalidate\n`;

    headersContent += `\n# マニフェストファイルは短期キャッシュ\n`;
    headersContent += `/manifest.json\n`;
    headersContent += `  Cache-Control: public, max-age=86400\n`;

    await fs.promises.writeFile(headersPath, headersContent);
    console.log(chalk.green('✅ _headers ファイルを生成しました'));
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ キャッシュ設定生成中にエラーが発生しました: ${error.message}`));
  }
}

// スクリプト実行
main().catch((error) => {
  console.error(chalk.red(`致命的なエラーが発生しました: ${error.message}`));
  process.exit(1);
});
