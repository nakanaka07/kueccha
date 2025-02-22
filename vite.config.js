// ファイルシステムモジュールをインポート
import fs from 'fs';
// パスモジュールをインポート
import path from 'path';
// Vite用のReactプラグインをインポート
import react from '@vitejs/plugin-react';
// Viteの設定関数と環境変数読み込み関数をインポート
import { defineConfig, loadEnv } from 'vite';
// TypeScriptのパス解決プラグインをインポート
import tsconfigPaths from 'vite-tsconfig-paths';

// Viteの設定をエクスポート
export default defineConfig(({ mode, command }) => {
  // 環境変数を読み込む
  const env = loadEnv(mode, process.cwd(), '');

  // 使用する環境変数のリスト
  const envVariables = [
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_GOOGLE_MAPS_MAP_ID',
    'VITE_GOOGLE_SHEETS_API_KEY',
    'VITE_GOOGLE_SPREADSHEET_ID',
    'VITE_EMAILJS_SERVICE_ID',
    'VITE_EMAILJS_TEMPLATE_ID',
    'VITE_EMAILJS_PUBLIC_KEY',
  ];

  // 環境変数をViteのdefineオプション用に変換
  const defineEnv = envVariables.reduce((acc, key) => {
    acc[`process.env.${key}`] = JSON.stringify(env[key]);
    return acc;
  }, {});

  // 開発モードかどうかを判定
  const isDev = command === 'serve';

  // Viteの設定を返す
  return {
    // ベースURLを設定
    base: mode === 'production' ? '/kueccha/' : '/',
    // 使用するプラグインを設定
    plugins: [react(), tsconfigPaths()],
    // モジュール解決の設定
    resolve: {
      alias: {
        '@': '/src', // '@'を'/src'にエイリアス
      },
    },
    // ビルド設定
    build: {
      outDir: 'dist', // 出力ディレクトリ
      sourcemap: false, // ソースマップを無効化
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js', // エントリーファイル名のパターン
          chunkFileNames: 'assets/[name].[hash].js', // チャンクファイル名のパターン
          assetFileNames: 'assets/[name].[hash].[ext]', // アセットファイル名のパターン
        },
        // 警告をカスタム処理
        onwarn(warning, warn) {
          if (warning.code === 'SOURCEMAP_ERROR') return; // SOURCEMAP_ERRORは無視
          warn(warning); // その他の警告は表示
        },
      },
    },
    // 依存関係の最適化設定
    optimizeDeps: {
      include: [
        '@googlemaps/js-api-loader',
        '@react-google-maps/api',
        '@react-google-maps/marker-clusterer',
        '@react-google-maps/infobox',
        '@googlemaps/markerclusterer',
      ],
      esbuildOptions: {
        sourcemap: false, // ソースマップを無効化
        logOverride: { 'this-is-undefined-in-esm': 'silent' }, // 特定のログを無効化
      },
    },
    // 環境変数をdefineオプションに設定
    define: defineEnv,
    // 開発サーバーの設定
    server: isDev
      ? {
          https: {
            key: fs.readFileSync(path.resolve(__dirname, 'localhost.key')), // HTTPS用のキー
            cert: fs.readFileSync(path.resolve(__dirname, 'localhost.crt')), // HTTPS用の証明書
          },
          headers: {
            'Cache-Control': 'public, max-age=3600', // キャッシュ制御ヘッダー
          },
          hmr: {
            protocol: 'wss', // ホットモジュールリプレースメントのプロトコル
            host: 'localhost', // ホスト名
            port: 5173, // ポート番号
            clientPort: 5173, // クライアントポート番号
          },
        }
      : {},
  };
});
