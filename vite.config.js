import { defineConfig, loadEnv } from 'vite'; // ViteのdefineConfigとloadEnvをインポート
import react from '@vitejs/plugin-react'; // ViteのReactプラグインをインポート
import tsconfigPaths from 'vite-tsconfig-paths'; // Viteのtsconfig-pathsプラグインをインポート

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // 環境変数をロード

  const envVariables = [
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_GOOGLE_MAPS_MAP_ID',
    'VITE_GOOGLE_SHEETS_API_KEY',
    'VITE_GOOGLE_SPREADSHEET_ID',
    'VITE_EMAILJS_SERVICE_ID',
    'VITE_EMAILJS_TEMPLATE_ID',
    'VITE_EMAILJS_PUBLIC_KEY',
  ]; // 使用する環境変数のリスト

  const defineEnv = envVariables.reduce((acc, key) => {
    acc[`process.env.${key}`] = JSON.stringify(env[key]); // 環境変数を定義
    return acc;
  }, {}); // 環境変数をオブジェクトに変換

  return {
    base: mode === 'production' ? '/kueccha/' : '/', // 本番環境では'/kueccha/'をベースURLに設定し、開発環境では'/'を使用
    plugins: [react(), tsconfigPaths()], // 使用するプラグインを設定
    resolve: {
      alias: {
        '@': '/src', // エイリアスを設定
      },
    },
    build: {
      outDir: 'dist', // 出力ディレクトリを設定
      sourcemap: false, // ソースマップを無効に設定
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'SOURCEMAP_ERROR') return; // ソースマップエラーを無視
          warn(warning); // その他の警告を表示
        },
      },
    },
    optimizeDeps: {
      include: [
        '@googlemaps/js-api-loader',
        '@react-google-maps/api',
        '@react-google-maps/marker-clusterer',
        '@react-google-maps/infobox',
        '@googlemaps/markerclusterer',
      ], // 最適化する依存関係を設定。これによりビルド時間が短縮される
      esbuildOptions: {
        sourcemap: false, // ソースマップを無効に設定
        logOverride: { 'this-is-undefined-in-esm': 'silent' }, // ログをオーバーライド
      },
    },
    define: defineEnv, // 環境変数を定義
  };
});
