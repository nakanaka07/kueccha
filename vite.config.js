import { defineConfig, loadEnv } from 'vite'; // Viteの設定と環境変数の読み込みをインポート
import react from '@vitejs/plugin-react'; // Reactプラグインをインポート
import tsconfigPaths from 'vite-tsconfig-paths'; // TypeScriptのパス解決プラグインをインポート
import fs from 'fs'; // ファイルシステムモジュールをインポート
import path from 'path'; // パスモジュールをインポート

export default defineConfig(({ mode, command }) => {
  // Viteの設定をエクスポート
  const env = loadEnv(mode, process.cwd(), ''); // 環境変数を読み込む

  const envVariables = [
    // 使用する環境変数のリスト
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_GOOGLE_MAPS_MAP_ID',
    'VITE_GOOGLE_SHEETS_API_KEY',
    'VITE_GOOGLE_SPREADSHEET_ID',
    'VITE_EMAILJS_SERVICE_ID',
    'VITE_EMAILJS_TEMPLATE_ID',
    'VITE_EMAILJS_PUBLIC_KEY',
  ];

  const defineEnv = envVariables.reduce((acc, key) => {
    // 環境変数を定義するオブジェクトを作成
    acc[`process.env.${key}`] = JSON.stringify(env[key]);
    return acc;
  }, {});

  const isDev = command === 'serve'; // 開発モードかどうかを判定

  return {
    base: mode === 'production' ? '/kueccha/' : '/', // ベースURLを設定
    plugins: [react(), tsconfigPaths()], // 使用するプラグインを設定
    resolve: {
      alias: {
        '@': '/src', // エイリアスを設定
      },
    },
    build: {
      outDir: 'dist', // 出力ディレクトリを設定
      sourcemap: false, // ソースマップを無効化
      rollupOptions: {
        onwarn(warning, warn) {
          // 警告をカスタマイズ
          if (warning.code === 'SOURCEMAP_ERROR') return;
          warn(warning);
        },
      },
    },
    optimizeDeps: {
      include: [
        // 依存関係に含めるパッケージを設定
        '@googlemaps/js-api-loader',
        '@react-google-maps/api',
        '@react-google-maps/marker-clusterer',
        '@react-google-maps/infobox',
        '@googlemaps/markerclusterer',
      ],
      esbuildOptions: {
        sourcemap: false, // ソースマップを無効化
        logOverride: { 'this-is-undefined-in-esm': 'silent' }, // ログのオーバーライド設定
      },
    },
    define: defineEnv, // 環境変数を定義
    server: isDev // 開発モードの場合
      ? {
          https: {
            key: fs.readFileSync(path.resolve(__dirname, 'localhost.key')), // HTTPS用のキーを読み込む
            cert: fs.readFileSync(path.resolve(__dirname, 'localhost.crt')), // HTTPS用の証明書を読み込む
          },
          headers: {
            'Cache-Control': 'public, max-age=3600', // Cache-Controlヘッダーを追加
          },
          hmr: {
            protocol: 'wss', // WebSocketのプロトコルを指定
            host: 'localhost',
            port: 5173,
            clientPort: 5173, // クライアントポートを指定
          },
        }
      : {}, // 開発モードでない場合は空のオブジェクトを返す
  };
});
