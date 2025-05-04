# 静的ホスティング環境向け最適化ガイドライン

> **最終更新日**: 2025年4月28日  
> **バージョン**: 1.1.0  
> **作成者**: 佐渡で食えっちゃプロジェクトチーム

## 概要

このガイドラインは、佐渡地図アプリケーション（kueccha）を静的ホスティング環境（GitHub Pages, Netlify, Vercelなど）で最適に動作させるための設定とベストプラクティスをまとめたものです。

## 最適化のポイント

1. **ベースパス設定**

   - GitHub Pagesなどのサブディレクトリにデプロイする場合はベースパスの設定が必須
   - `<base href="/kueccha/">` タグが正しく設定されていること
   - Vite設定でベースパスを指定する（`vite build --base=/kueccha/`）
   - URLのルーティングが正しく動作するか確認する

2. **アセット最適化**

   - JavaScriptファイルの分割と非同期読み込み
   - CSSの結合と最小化
   - 画像の最適化とWebP対応（画像ファイルサイズを25%以上削減）
   - チャンクサイズの最適化による初期読み込み時間の短縮

3. **パフォーマンス向上**

   - マップ表示のレスポンシブ対応
   - マーカーのクラスタリング設定（[クラスタリング詳細ガイド](./google_maps_guidelines/04_clustering.md) 参照）
   - 必要最小限のUIコントロール表示

4. **ユーザビリティ向上**

   - オフライン対応（Service Workerの設定）
   - 表示速度の最適化（preconnect, prefetchの活用）

5. **SEO対策**
   - robots.txtの設定
   - meta descriptionの最適化

## パフォーマンス指標と目標値

静的ホスティング環境におけるアプリケーションのパフォーマンス目標値：

| 指標                         | 目標値  | 測定方法                    |
| ---------------------------- | ------- | --------------------------- |
| 初期ロード時間               | < 3秒   | Lighthouse、WebPageTest     |
| First Contentful Paint       | < 1.8秒 | Chrome DevTools Performance |
| Time to Interactive          | < 5秒   | Lighthouse                  |
| バンドルサイズ(合計)         | < 3MB   | ビルドレポート              |
| 最大初期チャンク             | < 500KB | ビルドレポート              |
| Lighthouse Performance Score | > 85    | Lighthouse                  |

### パフォーマンス測定コマンド

```bash
# Lighthouseレポートの生成（Chrome DevTools統合でも実行可能）
npx lighthouse https://example.com/kueccha/ --view

# Viteバンドル分析
pnpm run analyze-bundle

# パフォーマンスレポート生成
pnpm run perf-report
```

## デプロイ前チェックリスト

以下の項目を確認してから静的ホスティング環境へデプロイしてください：

- [ ] `.nojekyll` ファイルが存在する（GitHub Pages用）
- [ ] `404.html` が存在する（SPA用のルーティング対応）
- [ ] `index.html` に適切なベースパスが設定されている（例：`<base href="/kueccha/">`）
- [ ] 環境変数 `VITE_STATIC_HOSTING=true` が設定されている
- [ ] マップマーカーが最適化されている（サイズ、フォーマット）
- [ ] スクリプトが遅延読み込み（defer/async）設定されている
- [ ] ソースマップが無効化されている（本番環境用）

## 静的ホスティング設定プロセス

静的ホスティング環境向けの設定とデプロイには、以下の手順に従ってください：

### 1. 環境設定ウィザードの実行

```bash
# 静的ホスティング設定ウィザードを実行（対話形式で最適な設定を生成）
pnpm run static-hosting
```

ウィザードは以下の作業を行います：

- ホスティングプラットフォームの選択（GitHub Pages/Netlify/Vercel）
- ベースパスの設定
- 必要な設定ファイルの生成・更新
- 環境変数の設定（`VITE_STATIC_HOSTING=true`など）

### 2. ビルドと検証

```bash
# 静的ホスティング向け最適化済みビルドを実行
pnpm run build:static

# ビルド結果の検証
pnpm run verify:static
```

### 3. デプロイ（GitHub Pages の場合）

```bash
# GitHub Pagesへのデプロイ（gh-pagesブランチにプッシュ）
pnpm run deploy:gh-pages
```

## トラブルシューティングの基本

一般的な問題と簡単な解決策を以下に示します：

1. **地図が表示されない**

   - `<base href="/kueccha/">` タグのベースパスが正しく設定されているか
   - Google Maps APIキーが有効で、適切なドメイン制限が設定されているか
   - ブラウザの開発者コンソールでエラーを確認

2. **マーカーやアセットが読み込まれない**

   - 相対パスが正しく設定されているか（ベースパスからの相対パスになっているか）
   - 静的アセット用のCORS設定が適切か（特に外部CDNの利用時）
   - `Network` タブでリクエストエラーを確認

3. **パフォーマンスが悪い**
   - マーカークラスタリングが有効か
   - 静的ホスティング最適化フラグ（`VITE_STATIC_HOSTING=true`）が設定されているか
   - リソースのサイズと読み込み順序を最適化できているか

詳細なトラブルシューティングについては、[トラブルシューティングガイド](./static_hosting_troubleshooting.md)を参照してください。

## 関連ガイドライン

- [静的ホスティング設定例](./static_hosting_examples.md) - 各種ホスティング環境向けの詳細設定例
- [静的ホスティングトラブルシューティング](./static_hosting_troubleshooting.md) - 一般的な問題と詳細な解決策
- [Google Maps ガイドライン](./google_maps_guidelines/index.md) - マーカー、クラスタリング、パフォーマンス最適化の詳細
- [環境変数管理ガイドライン](./env_usage_guidelines.md) - 静的ホスティング環境での環境変数設定
- [コード最適化ガイドライン](./code_optimization_guidelines.md) - パフォーマンス最適化テクニック

## 参考リソース

- [Google Maps API ドキュメント](https://developers.google.com/maps/documentation)
- [GitHub Pages デプロイガイド](https://docs.github.com/ja/pages)
- [Vite 静的サイトのデプロイ](https://vitejs.dev/guide/static-deploy.html)
- [Netlify デプロイガイド](https://docs.netlify.com/site-deploys/overview/)

## ベストプラクティスのまとめ

静的ホスティング環境での運用を成功させるための重要なポイントをまとめます：

1. **適切なファイル構成とビルド設定**

   - ベースパスを正しく設定する
   - 必要なリダイレクト設定と404ページを用意する
   - ビルド時の環境変数を適切に設定する

2. **リソース最適化**

   - コード分割を活用して初期読み込みを高速化する
   - 画像の最適化とWebP形式の活用
   - キャッシュストラテジーの実装

3. **認証とセキュリティ**

   - APIキーの適切な取り扱いとドメイン制限の設定
   - Content Security Policy (CSP) の設定
   - 機密情報を公開リポジトリにコミットしない

4. **CI/CDパイプラインの活用**

   - 自動ビルドと検証プロセスを導入する
   - デプロイ前の自動テスト実行
   - パフォーマンス指標の継続的なモニタリング

5. **モバイル対応と使いやすさ**
   - レスポンシブデザインの徹底
   - モバイル向けパフォーマンス最適化
   - オフライン対応機能の実装
