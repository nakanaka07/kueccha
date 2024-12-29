import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

console.log('Vite configuration starting...');

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
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
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
    esbuildOptions: {
      sourcemap: false,
    },
  },
});
