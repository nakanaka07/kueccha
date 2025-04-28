import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { type PluginOption } from 'vite';
import { splitVendorChunkPlugin } from 'vite';
import { compression } from 'vite-plugin-compression2';
import { VitePWA, type VitePWAOptions } from 'vite-plugin-pwa';

import { configLogger } from '../src/config/config-logger';

/**
 * Vite用のプラグイン配列を構築
 * @param mode 実行モード
 * @returns プラグインの配列
 */
export function createPlugins(mode: string): PluginOption[] {
  const isProd = mode === 'production';
  const isAnalyze = process.env.ANALYZE === 'true';
  const isGitHubPages = process.env.DEPLOY_TARGET === 'gh-pages';
  // リポジトリ名を環境変数から取得（デフォルトは現在のリポジトリ名）
  const repoName = process.env.REPO_NAME || 'kueccha';

  // ベースプラグイン設定
  const plugins: PluginOption[] = [
    // React HMR + JSX Fast Refresh
    react(),

    // ベンダーコード分割（node_modulesを別チャンクに分離）
    // コア機能と外部ライブラリを分割してキャッシュ効率を向上
    splitVendorChunkPlugin(),
  ];

  // 開発環境固有の設定
  if (!isProd) {
    plugins
      .push
      // 開発時のみの最適化プラグインがあれば追加
      ();
  }

  // 本番環境のみの設定
  if (isProd) {
    // GitHub Pages向け圧縮設定
    if (isGitHubPages) {
      plugins.push(
        compression({
          algorithm: 'gzip',
          exclude: [/\.(br)$/, /\.(gz)$/, /\.(png|jpg|jpeg|webp|ico)$/],
          threshold: 1024, // 1KB以上のファイルのみ圧縮
          deleteOriginalAssets: false, // オリジナルファイルも残す
        }),
        compression({
          algorithm: 'brotliCompress',
          exclude: [/\.(br)$/, /\.(gz)$/, /\.(png|jpg|jpeg|webp|ico)$/],
          threshold: 1024,
          deleteOriginalAssets: false,
        })
      );
    }

    // PWA設定オプション
    const pwaOptions: VitePWAOptions = {
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: '佐渡で食えっちゃ',
        short_name: '食えっちゃ',
        description: '佐渡島の飲食店・観光スポット情報マップ',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      // シンプルな設定を優先（KISS原則）
      injectRegister: 'auto',
      minify: true,
      includeManifestIcons: true,
      // 型エラー回避のため必須プロパティを追加
      injectManifest: {},
      disable: false,
      strategies: 'generateSW', // サービスワーカー生成戦略を明示的に指定
      workbox: {
        // 大きなファイルはプリキャッシュから除外（stats.htmlなど）
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024, // 2MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        // stats.htmlを明示的に除外
        globIgnores: ['**/stats.html'],
        // オフライン機能の設定
        navigateFallback: 'index.html',
        // キャッシュ名にバージョンを含めて更新を容易に
        cacheId: 'kueccha-v1',
        // GitHub Pages向けのパス設定
        navigateFallbackDenylist: [/^\/api\//], // APIパスはフォールバックしない
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-maps-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
              },
              cacheableResponse: {
                statuses: [0, 200], // 成功レスポンスとOPTIONSレスポンスをキャッシュ
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // 静的データファイル(CSV)のキャッシュ設定を追加
          {
            urlPattern: /\/data\/.*\.csv$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'csv-data-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7日
              },
            },
          },
        ],
      },
    };

    // GitHub Pages環境の場合、ベースパスを適用
    if (isGitHubPages) {
      configLogger.info('GitHub Pages向けPWA設定を適用します', {
        component: 'vite-plugins',
        repoName,
      });

      // GitHub Pages用のPWA追加設定
      pwaOptions.base = `/${repoName}/`; // 環境変数からリポジトリ名を取得
      pwaOptions.scope = `/${repoName}/`; // スコープも同様に設定
    }

    // PWAプラグインを追加
    plugins.push(VitePWA(pwaOptions));

    // バンドル分析ツールは分析モードの場合のみ追加（YAGNI原則）
    if (isAnalyze) {
      configLogger.info('バンドル分析モードが有効です', { component: 'vite-plugins' });
      plugins.push(
        visualizer({
          filename: './dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
          // トリーマップとネットワーク図の両方を生成
          template: 'treemap',
        }) as unknown as PluginOption
      );
    }
  }

  // 構造化ロギングを使用してプラグイン設定情報を記録
  configLogger.info(`プラグイン設定完了 [${plugins.length}個のプラグイン]`, {
    mode,
    isProd,
    isGitHubPages: isGitHubPages || false,
    component: 'vite-plugins',
  });

  return plugins;
}
