import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

import { APP_CONFIG } from '../src/config/app.config';
import { logError, logInfo, logWarning } from '../src/utils/logger';

/**
 * ビルド設定を生成
 * @param isProd 本番モードかどうか
 * @returns ビルド設定オブジェクト
 */
function getBuildConfig(isProd: boolean) {
  const config = {
    outDir: APP_CONFIG.OUTPUT_DIR,
    sourcemap: isProd ? 'hidden' : true,
    minify: isProd ? 'terser' : false,
    terserOptions: isProd
      ? {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.debug'],
          },
          format: { comments: false },
        }
      : undefined,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'maps-vendor': [
            '@googlemaps/js-api-loader',
            '@react-google-maps/api',
            '@googlemaps/markerclusterer',
          ],
          'ui-vendor': ['@emotion/react', '@emotion/styled'],
          'data-vendor': ['lodash', 'date-fns'],
        },
        // アセットの最適化に役立つファイル名パターンの設定
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // ビルドパフォーマンスの最適化
    reportCompressedSize: isProd,
    chunkSizeWarningLimit: 1000,
    emptyOutDir: true,
    // ビルド後の処理を設定
    // ビルド後にscripts/optimize-assets.tsを実行するようにnpmスクリプトを設定することを推奨
  };

  // 最適化のヒントをログに出力
  if (isProd) {
    logInfo(
      'CONFIG',
      'BUILD',
      'ビルド後、npm run optimize-assetsを実行して静的アセットを最適化することを推奨します',
    );
  }

  return config;
}

/**
 * 画像の最適化処理
 * GitHub Pages向けに最適化
 */
async function optimizeImages() {
  const distDir = path.resolve(process.cwd(), APP_CONFIG.OUTPUT_DIR);
  const imagesDir = path.join(distDir, 'assets', 'images');

  if (!fs.existsSync(imagesDir)) {
    logWarning('OPTIMIZE', 'IMAGES', '画像ディレクトリが見つかりません');
    return;
  }

  const imageFiles = fs.readdirSync(imagesDir).filter((file) => /\.(jpe?g|png)$/i.test(file));

  if (imageFiles.length === 0) {
    logInfo('OPTIMIZE', 'IMAGES', '最適化する画像ファイルがありません');
    return;
  }

  logInfo('OPTIMIZE', 'IMAGES', `${imageFiles.length}個の画像を最適化します...`);

  let optimizedCount = 0;
  const startTime = Date.now();

  for (const file of imageFiles) {
    try {
      const filePath = path.join(imagesDir, file);
      const stats = fs.statSync(filePath);
      const originalSize = stats.size;

      // WebP変換とリサイズの処理
      if (/\.(jpe?g|png)$/i.test(file)) {
        const outputPath = filePath.replace(/\.(jpe?g|png)$/i, '.webp');
        await sharp(filePath).webp({ quality: 80 }).toFile(outputPath);

        // 元ファイルは残しつつ、WebPファイルも提供
        const newStats = fs.statSync(outputPath);
        const savings = (((originalSize - newStats.size) / originalSize) * 100).toFixed(1);

        logInfo('OPTIMIZE', 'IMAGE', `${file} → WebP変換 (${savings}% 削減)`);
        optimizedCount++;
      }
    } catch (error) {
      logError('OPTIMIZE', 'IMAGE_ERROR', `${file}の最適化中にエラーが発生しました`, error);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  logInfo(
    'OPTIMIZE',
    'IMAGES_COMPLETE',
    `${optimizedCount}個の画像を${totalTime}秒で最適化しました`,
  );
}

/**
 * HTMLファイルの最適化処理
 * GitHub Pages向けに最適化
 */
function optimizeHtml() {
  const distDir = path.resolve(process.cwd(), APP_CONFIG.OUTPUT_DIR);
  const htmlFiles = fs.readdirSync(distDir).filter((file) => file.endsWith('.html'));

  if (htmlFiles.length === 0) {
    logInfo('OPTIMIZE', 'HTML', 'HTMLファイルが見つかりません');
    return;
  }

  logInfo('OPTIMIZE', 'HTML', `${htmlFiles.length}個のHTMLファイルを最適化します...`);

  for (const file of htmlFiles) {
    try {
      const filePath = path.join(distDir, file);
      let content = fs.readFileSync(filePath, 'utf8');

      // BASE_PATHの置換
      content = content.replace(/__BASE_PATH__/g, APP_CONFIG.BASE_PATH.PROD);

      // APP_VERSIONの置換
      const appVersion = process.env.npm_package_version || '0.0.0';
      content = content.replace(/__APP_VERSION__/g, appVersion);

      // BUILD_TIMEの置換
      const buildTime = new Date().toISOString();
      content = content.replace(/__BUILD_TIME__/g, buildTime);

      fs.writeFileSync(filePath, content);
      logInfo('OPTIMIZE', 'HTML', `${file}を最適化しました`);
    } catch (error) {
      logError('OPTIMIZE', 'HTML_ERROR', `${file}の最適化中にエラーが発生しました`, error);
    }
  }
}

/**
 * PWAアセットの検証と修正
 */
function verifyPwaAssets() {
  const distDir = path.resolve(process.cwd(), APP_CONFIG.OUTPUT_DIR);

  // マニフェストファイルの確認と修正
  const manifestPath = path.join(distDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      // マニフェストのstart_urlを修正
      if (manifest.start_url && !manifest.start_url.startsWith(APP_CONFIG.BASE_PATH.PROD)) {
        manifest.start_url = `${APP_CONFIG.BASE_PATH.PROD}${manifest.start_url.replace(/^\//, '')}`;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        logInfo('OPTIMIZE', 'PWA', 'マニフェストのstart_urlを修正しました');
      }

      // アイコンパスの確認
      if (manifest.icons) {
        let iconsFixed = false;
        manifest.icons = manifest.icons.map((icon) => {
          if (
            icon.src &&
            !icon.src.startsWith('http') &&
            !icon.src.startsWith(APP_CONFIG.BASE_PATH.PROD)
          ) {
            iconsFixed = true;
            return {
              ...icon,
              src: `${APP_CONFIG.BASE_PATH.PROD}${icon.src.replace(/^\//, '')}`,
            };
          }
          return icon;
        });

        if (iconsFixed) {
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
          logInfo('OPTIMIZE', 'PWA', 'マニフェストのアイコンパスを修正しました');
        }
      }
    } catch (error) {
      logError(
        'OPTIMIZE',
        'PWA_ERROR',
        'マニフェストファイルの処理中にエラーが発生しました',
        error,
      );
    }
  } else {
    logWarning('OPTIMIZE', 'PWA', 'マニフェストファイルが見つかりません');
  }

  // サービスワーカーの確認
  const swFiles = ['service-worker.js', 'sw.js'];
  let swFound = false;

  for (const swFile of swFiles) {
    const swPath = path.join(distDir, swFile);
    if (fs.existsSync(swPath)) {
      swFound = true;
      logInfo('OPTIMIZE', 'PWA', `サービスワーカー(${swFile})を確認しました`);
      break;
    }
  }

  if (!swFound) {
    logWarning('OPTIMIZE', 'PWA', 'サービスワーカーファイルが見つかりません');
  }
}

/**
 * GitHub Pages向けの追加設定ファイル生成
 */
function generateGitHubPagesConfigs() {
  const distDir = path.resolve(process.cwd(), APP_CONFIG.OUTPUT_DIR);

  // 404.htmlの生成（SPA向け）
  const indexPath = path.join(distDir, 'index.html');
  const notFoundPath = path.join(distDir, '404.html');

  if (fs.existsSync(indexPath) && !fs.existsSync(notFoundPath)) {
    fs.copyFileSync(indexPath, notFoundPath);
    logInfo('OPTIMIZE', 'GITHUB_PAGES', '404.htmlを生成しました（SPA用）');
  }

  // .nojekyllファイルの生成
  const nojekyllPath = path.join(distDir, '.nojekyll');
  if (!fs.existsSync(nojekyllPath)) {
    fs.writeFileSync(nojekyllPath, '');
    logInfo('OPTIMIZE', 'GITHUB_PAGES', '.nojekyllファイルを生成しました');
  }
}

/**
 * メインの最適化処理関数
 */
async function optimizeAssets() {
  try {
    const startTime = Date.now();
    logInfo('OPTIMIZE', 'START', 'アセット最適化処理を開始します...');

    // 各種最適化処理を実行
    await optimizeImages();
    optimizeHtml();
    verifyPwaAssets();
    generateGitHubPagesConfigs();

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    logInfo('OPTIMIZE', 'COMPLETE', `アセット最適化処理が完了しました（${totalTime}秒）`);
  } catch (error) {
    logError(
      'OPTIMIZE',
      'FATAL_ERROR',
      'アセット最適化処理中に致命的なエラーが発生しました',
      error,
    );
    process.exit(1);
  }
}

// スクリプトが直接実行された場合に実行
if (require.main === module) {
  optimizeAssets();
}

// 設定を外部から利用できるようにエクスポート
export { getBuildConfig, optimizeAssets };
