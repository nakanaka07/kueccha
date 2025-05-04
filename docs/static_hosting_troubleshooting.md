# 静的ホスティング環境のトラブルシューティング

> **関連ドキュメント**:
>
> - [静的ホスティング環境向け最適化ガイドライン](./static_hosting_guidelines.md)
> - [静的ホスティング設定例](./static_hosting_examples.md)

このガイドでは、静的ホスティング環境でアプリケーションを実行する際に発生する一般的な問題と解決策を示します。

## 1. マップ表示関連の問題

### 地図が表示されない

**症状**: 空白のコンテナが表示されるか、エラーメッセージが表示される

**考えられる原因と解決策**:

1. **Google Maps APIキーの問題**

   - **確認方法**: ブラウザのコンソールで `InvalidKeyMapError` や `MissingKeyMapError` というエラーを確認
   - **解決策**:
     - APIキーが正しくて有効であることを確認
     - APIキーに適切なドメイン制限が設定されているか確認
     - 環境変数 `VITE_GOOGLE_API_KEY` が正しく設定されているか確認

2. **ベースパスの設定ミス**

   - **確認方法**: ネットワークリクエストでJSファイルやCSSが404エラーになっていないか確認
   - **解決策**:
     ```html
     <!-- index.htmlのヘッダーに追加 -->
     <base href="/kueccha/" />
     <!-- または適切なベースパス -->
     ```
     - `vite.config.ts` でベースパスが設定されているか確認
     ```typescript
     // vite.config.tsでのベースパス設定
     export default defineConfig({
       base: '/kueccha/', // リポジトリ名に合わせて変更
       // ...その他の設定
     });
     ```

3. **CSP (Content Security Policy) の問題**
   - **確認方法**: コンソールで `Refused to load` エラーが表示されていないか確認
   - **解決策**:
     ```html
     <!-- index.htmlに追加 -->
     <meta
       http-equiv="Content-Security-Policy"
       content="default-src 'self'; script-src 'self' https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' https://*.googleapis.com https://*.gstatic.com data:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.googleapis.com;"
     />
     ```

## 2. アセットとリソース読み込みの問題

### マーカーアイコンや画像が表示されない

**症状**: マーカーが標準アイコンで表示されるか、画像が表示されない

**考えられる原因と解決策**:

1. **相対パスの問題**

   - **確認方法**: ネットワークタブで画像リクエストが404エラーになっていないか確認
   - **解決策**:

     ```typescript
     // 絶対パスを使用
     const markerIcon = new URL('/assets/marker.png', import.meta.url).href;

     // または動的なベースパス対応
     const getAssetPath = path => {
       const basePath = import.meta.env.BASE_URL || '/';
       return `${basePath}${path.startsWith('/') ? path.slice(1) : path}`;
     };
     ```

2. **CORSエラー**
   - **確認方法**: コンソールで `Cross-Origin Resource Sharing` エラーが表示されていないか確認
   - **解決策**:
     - 外部リソースを使用している場合はCORS設定を確認
     - 可能であればアセットを同じドメインに移動
     - CDN使用時は適切なCORS設定を確認

## 3. パフォーマンス問題

### アプリケーションの読み込みが遅い

**症状**: 初期読み込みに10秒以上かかる、または地図の表示が遅い

**考えられる原因と解決策**:

1. **大きなJavaScriptバンドル**

   - **確認方法**: ネットワークタブでJSファイルのサイズを確認
   - **解決策**:
     - コード分割を設定
     ```typescript
     // vite.config.ts
     export default defineConfig({
       build: {
         rollupOptions: {
           output: {
             manualChunks: {
               vendor: ['react', 'react-dom'],
               maps: ['@googlemaps/js-api-loader'],
             },
           },
         },
       },
     });
     ```

2. **マーカークラスタリングが無効**

   - **確認方法**: 多数のマーカーがあるときにブラウザが遅くなる
   - **解決策**:
     - マーカークラスタリングを有効化
     - 環境変数 `VITE_ENABLE_CLUSTERING=true` を設定

3. **最適化されていない画像**
   - **確認方法**: ネットワークタブで画像ファイルのサイズを確認
   - **解決策**:
     - WebP形式の使用
     - 画像の圧縮と最適化
     - サムネイルの生成と遅延読み込みの実装

## 4. ルーティングとナビゲーションの問題

### 直接URLにアクセスすると404エラー

**症状**: `/kueccha/map` などのURLに直接アクセスすると404エラーが表示される

**考えられる原因と解決策**:

1. **SPAルーティングの設定ミス**

   - **解決策**:

     - `404.html` にリダイレクトスクリプトを追加（[詳細設定例](./static_hosting_examples.md)参照）
     - ホスティングプラットフォームの設定で全てのリクエストを `index.html` にリダイレクト

     GitHub Pagesの場合:

     ```html
     <!-- 404.html -->
     <script>
       sessionStorage.setItem('redirect', window.location.pathname);
       window.location.href = '/kueccha/';
     </script>
     ```

     ```javascript
     // index.jsに追加
     if (sessionStorage.redirect) {
       const redirect = sessionStorage.redirect;
       delete sessionStorage.redirect;
       router.navigate(redirect);
     }
     ```

## 5. 環境変数の問題

### 環境変数が適用されていない

**症状**: 設定した環境変数が反映されていない

**考えられる原因と解決策**:

1. **ビルド時の環境変数の取り扱い**

   - **解決策**:
     - `.env.production` ファイルに環境変数を設定
     - Viteの環境変数の接頭辞 `VITE_` を付ける
     ```
     VITE_STATIC_HOSTING=true
     VITE_MAPS_MINIMAL_UI=true
     VITE_GOOGLE_API_KEY=your-api-key
     ```

2. **環境変数の参照方法**
   - **解決策**: 正しい参照方法を使用
     ```typescript
     // 正しい参照方法
     const isStaticHosting = import.meta.env.VITE_STATIC_HOSTING === 'true';
     ```

## 診断コマンド

問題を診断するのに役立つコマンド:

```bash
# 静的ホスティング設定の検証
pnpm run verify:static

# 環境変数の検証
pnpm run check-env-vars

# パフォーマンスレポートの生成
pnpm run perf-report
```
