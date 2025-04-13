/**
 * Vite用のビルド設定を生成
 * @param isProd 本番環境かどうか
 * @returns ビルド設定オブジェクト
 */
export function createBuildOptions(isProd) {
    return {
        outDir: 'dist',
        sourcemap: !isProd,
        minify: isProd ? 'esbuild' : false,
        emptyOutDir: true,
        cssCodeSplit: true,
        reportCompressedSize: true,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom', 'react-router-dom'],
                    maps: [
                        '@googlemaps/js-api-loader',
                        '@googlemaps/markerclusterer',
                        '@react-google-maps/api',
                    ],
                    material: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
                    state: ['zustand', 'immer'],
                    utils: ['dayjs', 'axios', 'lodash-es', 'csv-parse', 'uuid', 'query-string'],
                },
            },
        },
    };
}
