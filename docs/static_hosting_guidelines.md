# 静的ホスティング環境向け最適化ガイドライン

## 概要

このガイドラインは、佐渡地図アプリケーション（kueccha）を静的ホスティング環境（GitHub Pages, Netlify, Vercelなど）で最適に動作させるための設定とベストプラクティスをまとめたものです。

## 最適化のポイント

1. **ベースパス設定**

   - GitHub Pagesなどのサブディレクトリにデプロイする場合はベースパスの設定が必須
   - `<base href="/kueccha/">` タグが正しく設定されていること

2. **アセット最適化**

   - JavaScriptファイルの分割と非同期読み込み
   - CSSの結合と最小化
   - 画像の最適化とWebP対応

3. **パフォーマンス向上**

   - マップ表示のレスポンシブ対応
   - マーカーのクラスタリング設定
   - 必要最小限のUIコントロール表示

4. **ユーザビリティ向上**

   - オフライン対応（Service Workerの設定）
   - 表示速度の最適化（preconnect, prefetchの活用）

5. **SEO対策**
   - robots.txtの設定
   - meta descriptionの最適化

## デプロイ前チェックリスト

- [ ] `.nojekyll` ファイルが存在する（GitHub Pages用）
- [ ] `404.html` が存在する（SPA用）
- [ ] `index.html` に適切なベースパスが設定されている
- [ ] 環境変数 `VITE_STATIC_HOSTING=true` が設定されている
- [ ] マップマーカーが最適化されている
- [ ] スクリプトが遅延読み込み（defer/async）設定されている

## 静的ホスティング設定コマンド

```bash
# 静的ホスティング設定ウィザードを実行
pnpm run static-hosting

# 静的ホスティング向けにビルド
pnpm run build:static

# ビルド結果の検証
pnpm run verify:static
```

## トラブルシューティング

1. **地図が表示されない**

   - ベースパスが正しく設定されているか確認
   - Google Maps APIキーが有効か確認
   - 開発者コンソールでエラーを確認

2. **マーカーやアセットが読み込まれない**

   - 相対パスが正しいか確認
   - CORS設定が適切か確認
   - Network タブでリクエストエラーを確認

3. **パフォーマンスが悪い**
   - マーカークラスタリングが有効か確認
   - 静的ホスティング最適化フラグが有効か確認
   - リソースのサイズと読み込み順序を確認

## 参考リソース

- [Google Maps API ドキュメント](https://developers.google.com/maps/documentation)
- [GitHub Pages デプロイガイド](https://docs.github.com/ja/pages)
- [Vite 静的サイトのデプロイ](https://vitejs.dev/guide/static-deploy.html)
