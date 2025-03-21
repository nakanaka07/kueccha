/**
 * ビルド設定を生成
 * @param isProd 本番モードかどうか
 * @returns ビルド設定オブジェクト
 */
function getBuildConfig(isProd: boolean) {
  const config = {
    outDir: APP_CONFIG.OUTPUT_DIR,
    sourcemap: isProd ? 'hidden' : true,
    minify: isProd ? 'terser' : false,
    terserOptions: isProd ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
      format: { comments: false },
    } : undefined,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'maps-vendor': ['@googlemaps/js-api-loader', '@react-google-maps/api', '@googlemaps/markerclusterer'],
          'ui-vendor': ['@emotion/react', '@emotion/styled'],
          'data-vendor': ['lodash', 'date-fns'],
        },
        // アセットの最適化に役立つファイル名パターンの設定
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // ビルドパフォーマンスの最適化
    reportCompressedSize: isProd,
    chunkSizeWarningLimit: 1000,
    emptyOutDir: true,
    // ビルド後の処理を設定
    // ビルド後にscripts/optimize-assets.tsを実行するようにnpmスクリプトを設定することを推奨
  };

  // 最適化のヒントをログに出力
  if (isProd) {
    logInfo('CONFIG', 'BUILD', 'ビルド後、npm run optimize-assetsを実行して静的アセットを最適化することを推奨します');
  }

  return config;
}