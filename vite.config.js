import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const envVariables = [
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_GOOGLE_MAPS_MAP_ID',
    'VITE_GOOGLE_SHEETS_API_KEY',
    'VITE_GOOGLE_SPREADSHEET_ID',
    'VITE_EMAILJS_SERVICE_ID',
    'VITE_EMAILJS_TEMPLATE_ID',
    'VITE_EMAILJS_PUBLIC_KEY',
  ];

  const defineEnv = envVariables.reduce((acc, key) => {
    acc[`process.env.${key}`] = JSON.stringify(env[key]);
    return acc;
  }, {});

  const isDev = command === 'serve';

  const serverConfig = isDev
    ? {
        https: {
          key: fs.readFileSync(path.resolve(__dirname, 'localhost.key')),
          cert: fs.readFileSync(path.resolve(__dirname, 'localhost.crt')),
        },
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
        hmr: {
          protocol: 'wss',
          host: 'localhost',
          port: 5173,
          clientPort: 5173,
          overlay: false,
          timeout: 5000,
        },
      }
    : {};

  return {
    base: mode === 'production' ? '/kueccha/' : '/',
    plugins: [react(), tsconfigPaths()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
        onwarn(warning, warn) {
          if (warning.code === 'SOURCEMAP_ERROR') return;
          warn(warning);
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
      ],
      esbuildOptions: {
        sourcemap: false,
        logOverride: {
          'this-is-undefined-in-esm': 'silent',
        },
      },
    },
    define: defineEnv,
    server: serverConfig,
  };
});
