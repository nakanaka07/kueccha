import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import replace from '@rollup/plugin-replace';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: mode === 'production' ? '/kueccha/' : '/', // 環境に応じてベースパスを設定
    plugins: [
      react(),
      tsconfigPaths(),
      replace({
        'process.env.BASE_URL': JSON.stringify(mode === 'production' ? '/kueccha/' : '/'),
        preventAssignment: true,
      }),
    ],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            maps: [
              '@react-google-maps/api',
              '@googlemaps/js-api-loader',
              '@react-google-maps/marker-clusterer',
              '@react-google-maps/infobox',
              '@googlemaps/markerclusterer',
            ],
          },
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
        },
      },
      target: 'es2022',
    },
    optimizeDeps: {
      include: [
        '@googlemaps/js-api-loader',
        '@react-google-maps/api',
        '@react-google-maps/marker-clusterer',
        '@react-google-maps/infobox',
        '@googlemaps/markerclusterer',
      ],
      esbuildOptions: {
        logOverride: { 'this-is-undefined-in-esm': 'silent' },
        sourcemap: false,
      },
    },
  
    define: {
      'process.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY),
      'process.env.VITE_GOOGLE_MAPS_MAP_ID': JSON.stringify(env.VITE_GOOGLE_MAPS_MAP_ID),
      'process.env.VITE_GOOGLE_SHEETS_API_KEY': JSON.stringify(env.VITE_GOOGLE_SHEETS_API_KEY),
      'process.env.VITE_GOOGLE_SPREADSHEET_ID': JSON.stringify(env.VITE_GOOGLE_SPREADSHEET_ID),
    },
  };
});
