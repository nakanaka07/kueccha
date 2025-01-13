import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  // 環境変数をロード
  const env = loadEnv(mode, process.cwd(), '');

  // 環境変数のキーを配列で定義
  const envVariables = [
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_GOOGLE_MAPS_MAP_ID',
    'VITE_GOOGLE_SHEETS_API_KEY',
    'VITE_GOOGLE_SPREADSHEET_ID',
    'VITE_EMAILJS_SERVICE_ID',
    'VITE_EMAILJS_TEMPLATE_ID',
    'VITE_EMAILJS_PUBLIC_KEY',
  ];

  // 環境変数を定義オブジェクトに変換
  const defineEnv = envVariables.reduce((acc, key) => {
    acc[`process.env.${key}`] = JSON.stringify(env[key]);
    return acc;
  }, {});

  return {
    // プロダクションモードの場合のベースURLを設定
    base: mode === 'production' ? '/kueccha/' : '/',
    // 使用するプラグインを設定
    plugins: [react(), tsconfigPaths()],
    // モジュール解決の設定
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    // ビルド設定
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        onwarn(warning, warn) {
          // ソースマップの警告を無視
          if (warning.code === 'SOURCEMAP_ERROR') return;
          warn(warning);
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
        sourcemap: false,
        logOverride: { 'this-is-undefined-in-esm': 'silent' },
      },
    },
    // 環境変数を定義
    define: defineEnv,
  };
});
