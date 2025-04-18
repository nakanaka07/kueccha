import { getEnvVar } from '../src/utils/env/core';
/**
 * Vite用のビルド設定を生成
 * @param isProd 本番環境かどうか
 * @returns ビルド設定オブジェクト
 */
export function createBuildOptions(isProd) {
    // 静的サイト向け最適化設定
    const optimizeMaps = isProd && getEnvVar({ key: 'VITE_OPTIMIZE_MAPS', defaultValue: 'true' }) === 'true';
    // BuildOptionsオブジェクトを構築
    const buildOptions = {
        outDir: 'dist',
        sourcemap: !isProd, // 本番環境では圧縮アルゴリズムとしてterserを使用（最大限の圧縮）
        // GitHub Pages向けに最適な圧縮を選択
        minify: isProd
            ? getEnvVar({ key: 'VITE_USE_TERSER', defaultValue: 'true' }) === 'true'
                ? 'terser'
                : 'esbuild'
            : false,
        emptyOutDir: true,
        // 静的サイトの最初のロード速度向上のためにCSSを一つのファイルに結合
        cssCodeSplit: false,
        reportCompressedSize: true, // チャンクサイズの警告閾値を調整（KB単位）- GitHub Pagesの転送量最適化
        chunkSizeWarningLimit: 1000,
        target: 'esnext', // 最新ブラウザ向け最適化
        assetsInlineLimit: 8192, // 小さな画像をインライン化（8KB以下）- HTTP/2環境を想定
        rollupOptions: {
            output: {
                // GitHub Pages向けに最適化されたチャンク分割戦略
                manualChunks: (id) => {
                    // コア依存関係 - アプリ起動に必須のもの
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                        return 'vendor-react-core';
                    }
                    // React関連ユーティリティ - useContext, useReducerなどの上級機能
                    if (id.includes('node_modules/react/jsx-runtime') ||
                        id.includes('node_modules/react/jsx-dev-runtime')) {
                        return 'vendor-react-runtime';
                    }
                    // Google Maps関連ライブラリ - さらに詳細に分割
                    if ((optimizeMaps && id.includes('@googlemaps')) || id.includes('@react-google-maps')) {
                        // 地図の基本機能と拡張機能を分離
                        if (id.includes('markerclusterer') || id.includes('js-api-loader')) {
                            return 'vendor-maps-core';
                        }
                        return 'vendor-maps-extended';
                    }
                    // UI関連ライブラリ
                    if (id.includes('@mui/') || id.includes('@emotion/')) {
                        // コアUIとテーマを分離
                        if (id.includes('@mui/material/styles') || id.includes('@emotion/styled')) {
                            return 'vendor-ui-core';
                        }
                        return 'vendor-ui-components';
                    }
                    // ユーティリティライブラリ
                    if (id.includes('dayjs') ||
                        id.includes('axios') ||
                        id.includes('lodash-es') ||
                        id.includes('csv-parse')) {
                        return 'vendor-utils';
                    }
                    // コンポーネント単位のコード分割 - さらに詳細に分割
                    if (id.includes('/src/components/map')) {
                        // 地図のコア機能と拡張機能を分離
                        if (id.includes('MapContainer') || id.includes('useGoogleMaps')) {
                            return 'component-map-core';
                        }
                        return 'component-map-features';
                    }
                    if (id.includes('/src/components/POI')) {
                        // POIリストと詳細表示を分離
                        if (id.includes('POIDetails') || id.includes('InfoWindow')) {
                            return 'component-poi-details';
                        }
                        return 'component-poi-list';
                    }
                    // フィルター関連のコンポーネント
                    if (id.includes('/src/components/Filter') || id.includes('useFilterLogic')) {
                        return 'component-filters';
                    }
                    // 非同期データ取得とCSV処理
                    if (id.includes('/src/utils/') && (id.includes('fetch') || id.includes('csv'))) {
                        return 'utils-data-processing';
                    }
                    // それ以外の依存関係
                    if (id.includes('node_modules')) {
                        return 'vendor-others';
                    }
                    return undefined;
                },
                // 静的サイト向け出力形式の最適化（キャッシュ戦略に配慮）
                entryFileNames: isProd ? 'assets/[name].[hash].js' : 'assets/[name].js',
                chunkFileNames: isProd ? 'assets/[name].[hash].js' : 'assets/[name].js',
                assetFileNames: isProd ? 'assets/[name].[hash].[ext]' : 'assets/[name].[ext]',
            },
        },
    };
    // 本番環境の場合のみterserOptionsを設定
    if (isProd) {
        const terserOptions = {
            compress: {
                drop_console: getEnvVar({ key: 'VITE_DROP_CONSOLE', defaultValue: 'true' }) === 'true',
                pure_funcs: getEnvVar({ key: 'VITE_DROP_CONSOLE', defaultValue: 'true' }) === 'true'
                    ? ['console.log', 'console.debug', 'console.info']
                    : [],
                // デッドコード除去を強化
                passes: 3,
                unsafe_arrows: true,
                unsafe_methods: true,
                reduce_vars: true,
                toplevel: true, // トップレベル変数・関数の圧縮を強化
                booleans_as_integers: true, // ブール値を数値に変換して圧縮
            },
            mangle: {
                safari10: false, // モダンブラウザのみをサポート
                properties: {
                    // プライベートプロパティ名のみマングル
                    regex: /^_/,
                },
            },
            format: {
                comments: false, // コメントを削除
                ecma: 2020, // 最新のECMAScript形式
            },
        };
        buildOptions.terserOptions = terserOptions;
    }
    return buildOptions;
}
