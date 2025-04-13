import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import { configLogger } from './config-logger';
/**
 * Vite用のプラグイン配列を構築
 * @param mode 実行モード
 * @returns プラグインの配列
 */
export function createPlugins(mode) {
    const isProd = mode === 'production';
    const isAnalyze = process.env.ANALYZE === 'true';
    const plugins = [
        // React HMR + JSX Fast Refresh
        react(),
    ]; // 本番環境のみPWAプラグインとバンドル分析ツールを追加
    if (isProd) {
        // PWA設定オプション
        const pwaOptions = {
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
            workbox: {
                // 大きなファイルはプリキャッシュから除外（stats.htmlなど）
                maximumFileSizeToCacheInBytes: 2 * 1024 * 1024, // 2MB
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
                // stats.htmlを明示的に除外
                globIgnores: ['**/stats.html'],
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
                        },
                    },
                ],
            },
        };
        // PWAプラグインを追加
        plugins.push(VitePWA(pwaOptions));
        // バンドル分析ツールは分析モードの場合のみ追加（YAGNI原則）
        if (isAnalyze) {
            configLogger.info('バンドル分析モードが有効です', { component: 'vite-plugins' });
            plugins.push(visualizer({
                filename: './dist/stats.html',
                open: false,
                gzipSize: true,
                brotliSize: true,
            }));
        }
    }
    // 構造化ロギングを使用してプラグイン設定情報を記録
    configLogger.info(`プラグイン設定完了 [${plugins.length}個のプラグイン]`, {
        mode,
        isProd,
        component: 'vite-plugins',
    });
    return plugins;
}
