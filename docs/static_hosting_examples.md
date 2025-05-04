# 静的ホスティング設定例

> **関連ドキュメント**: [静的ホスティング環境向け最適化ガイドライン](./static_hosting_guidelines.md)

このドキュメントでは、代表的な静的ホスティング環境ごとの具体的な設定例を紹介します。

## GitHub Pages での設定例

### 必須ファイル

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml  # デプロイワークフロー設定
├── .nojekyll           # Jekyll処理を無効化するファイル
└── 404.html            # SPA用カスタムエラーページ
```

### GitHub Actions ワークフロー例

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run build:static
        env:
          VITE_STATIC_HOSTING: 'true'
          VITE_BASE_PATH: '/kueccha/'

      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist
          branch: gh-pages
```

## Netlify での設定例

### netlify.toml 設定ファイル

```toml
[build]
  publish = "dist"
  command = "pnpm run build:static"

[build.environment]
  VITE_STATIC_HOSTING = "true"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Netlify環境変数設定

| 変数名              | 値           | 説明                         |
| ------------------- | ------------ | ---------------------------- |
| VITE_GOOGLE_API_KEY | your-api-key | Google Maps APIキー          |
| VITE_STATIC_HOSTING | true         | 静的ホスティング最適化フラグ |

## Vercel での設定例

### vercel.json 設定ファイル

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "buildCommand": "pnpm run build:static"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 共通の問題と解決策

### 1. 404エラー（ルーティング関連）

単一ページアプリケーション（SPA）で直接URLにアクセスすると404エラーが発生する場合：

```html
<!-- 404.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>佐渡地図 - リダイレクト中</title>
    <script>
      // SPAルーティング用のリダイレクトスクリプト
      const path = window.location.pathname;
      const basePath = '/kueccha/'; // 環境に応じて変更
      sessionStorage.setItem('redirect', path.replace(basePath, '/'));
      window.location.href = basePath;
    </script>
  </head>
  <body>
    <p>リダイレクト中...</p>
  </body>
</html>
```

```javascript
// index.jsに追加（リダイレクト処理）
document.addEventListener('DOMContentLoaded', () => {
  const redirect = sessionStorage.getItem('redirect');
  if (redirect) {
    sessionStorage.removeItem('redirect');
    const router = window.routerInstance; // アプリのルーターインスタンス
    router.navigate(redirect);
  }
});
```

### 2. 環境変数の扱い

静的ホスティング環境では環境変数が実行時に変更できないため、ビルド時に埋め込まれます。機密情報の取り扱いに注意してください。

```javascript
// 推奨される環境変数の扱い方
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const isStaticHosting = import.meta.env.VITE_STATIC_HOSTING === 'true';

// 条件付きの最適化設定
if (isStaticHosting) {
  enableStaticOptimizations();
}
```
