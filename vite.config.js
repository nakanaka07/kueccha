// Node.jsの組み込みモジュール - ファイルシステム操作用
import fs from 'fs';
// Node.jsの組み込みモジュール - パス操作用
import path from 'path';
// Reactアプリケーション用のViteプラグイン - JSX変換とHot Module Replacement対応
import react from '@vitejs/plugin-react';
// Viteの設定用ユーティリティ関数
// defineConfig: 型安全な設定オブジェクトを作成
// loadEnv: .envファイルから環境変数を読み込む
import { defineConfig, loadEnv } from 'vite';
// TypeScriptのパスエイリアスをViteで解決するためのプラグイン
import tsconfigPaths from 'vite-tsconfig-paths';

// Viteの設定をエクスポート
// mode: 現在の実行モード（development/production）
// command: 実行中のコマンド（serve/build）
export default defineConfig(({ mode, command }) => {
  // 環境変数を.envファイルから読み込む
  // process.cwd(): 現在の作業ディレクトリ
  // 空文字はプレフィックスなしで全ての環境変数を読み込むことを示す
  const env = loadEnv(mode, process.cwd(), '');

  // アプリケーションで使用する環境変数の定義
  // セキュリティ上重要なAPIキーや設定値
  const envVariables = [
    'VITE_GOOGLE_MAPS_API_KEY', // Google Maps APIキー
    'VITE_GOOGLE_MAPS_MAP_ID', // カスタムマップスタイル用ID
    'VITE_GOOGLE_SHEETS_API_KEY', // Google Sheets APIキー
    'VITE_GOOGLE_SPREADSHEET_ID', // 対象のスプレッドシートID
    'VITE_EMAILJS_SERVICE_ID', // EmailJS サービスID
    'VITE_EMAILJS_TEMPLATE_ID', // EmailJS テンプレートID
    'VITE_EMAILJS_PUBLIC_KEY', // EmailJS 公開キー
  ];

  // 環境変数をViteの形式に変換
  // process.env.VITE_*の形式でクライアントサイドから参照可能にする
  const defineEnv = envVariables.reduce((acc, key) => {
    acc[`process.env.${key}`] = JSON.stringify(env[key]);
    return acc;
  }, {});

  // 開発サーバー実行時かどうかを判定
  const isDev = command === 'serve';

  // 開発サーバー用の設定
  // 開発モードの場合のみHTTPS設定とHMR（Hot Module Replacement）を構成
  const serverConfig = isDev
    ? {
        // HTTPS設定（ローカル開発用の自己署名証明書）
        https: {
          key: fs.readFileSync(path.resolve(__dirname, 'localhost.key')),
          cert: fs.readFileSync(path.resolve(__dirname, 'localhost.crt')),
        },
        // キャッシュ制御ヘッダーの設定
        headers: {
          'Cache-Control': 'public, max-age=3600', // 1時間のキャッシュ
        },
        // HMR（ホットモジュールリロード）の設定
        hmr: {
          protocol: 'wss', // WebSocket Secure
          host: 'localhost', // ホスト名
          port: 5173, // WebSocketポート
          clientPort: 5173, // クライアント側ポート
          overlay: false, // エラーオーバーレイを無効化
          timeout: 5000, // 接続タイムアウト（ミリ秒）
        },
      }
    : {}; // 本番環境では空オブジェクト

  // Viteの設定オブジェクトを返す
  return {
    // アプリケーションのベースURL設定
    // 本番環境では'/kueccha/'、開発環境では'/'
    base: mode === 'production' ? '/kueccha/' : '/',

    // 使用するViteプラグイン
    plugins: [react(), tsconfigPaths()],

    // モジュール解決の設定
    resolve: {
      alias: {
        '@': '/src', // インポート文で@を使用してsrcディレクトリを参照可能に
      },
    },

    // ビルド設定
    build: {
      outDir: 'dist', // ビルド出力先ディレクトリ
      sourcemap: false, // ソースマップ生成を無効化（本番環境用）
      rollupOptions: {
        output: {
          // 生成されるファイル名のパターン設定（キャッシュバスティング用のハッシュ付き）
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
        // Rollupの警告ハンドリング
        onwarn(warning, warn) {
          // ソースマップ関連のエラーは無視
          if (warning.code === 'SOURCEMAP_ERROR') return;
          // その他の警告は通常通り表示
          warn(warning);
        },
      },
    },

    // 依存関係の最適化設定
    optimizeDeps: {
      // プリバンドルする依存パッケージの指定
      include: [
        '@googlemaps/js-api-loader',
        '@react-google-maps/api',
        '@react-google-maps/marker-clusterer',
        '@react-google-maps/infobox',
        '@googlemaps/markerclusterer',
      ],
      // esbuildの設定
      esbuildOptions: {
        sourcemap: false, // ソースマップ生成を無効化
        logOverride: {
          'this-is-undefined-in-esm': 'silent', // ESMのthis未定義警告を抑制
        },
      },
    },

    // 環境変数の定義
    define: defineEnv,

    // 開発サーバーの設定を適用
    server: serverConfig,
  };
});
