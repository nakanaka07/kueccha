/**
 * サーバーサイドアプリケーションのメインファイル
 * Express.jsを使用したWebサーバーの設定と起動を行う
 */

// 基本的なNode.jsの組み込みモジュール
import path, { dirname } from 'path'; // ファイルパスの操作と解決用
import { fileURLToPath } from 'url'; // ESモジュールでのファイルパス取得用
// セキュリティとミドルウェア関連のパッケージ
import cors from 'cors'; // クロスオリジンリクエスト制御用
import dotenv from 'dotenv'; // 環境変数管理用
import express, { Request, Response, NextFunction } from 'express'; // Webアプリケーションフレームワーク
import helmet from 'helmet'; // HTTPセキュリティヘッダー設定用

// 環境変数の設定を.envファイルから読み込む
// アプリケーション起動時に最初に実行される必要がある
dotenv.config();

// ESモジュールでの__filenameと__dirnameの再現
// CommonJSでは自動的に提供される値をESモジュールで使用可能にする
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Expressアプリケーションのインスタンスを作成
const app = express();

// サーバーのポート番号を環境変数から取得
// 環境変数が未設定の場合は3000をデフォルト値として使用
const port = process.env.PORT || 3000;

// Helmetによるセキュリティ設定
// Webアプリケーションの一般的な脆弱性から保護
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // デフォルトのリソース取得元を同一オリジンに制限
        scriptSrc: ["'self'", "'unsafe-inline'"], // スクリプトの実行を制限（インラインスクリプトも許可）
        objectSrc: ["'none'"], // オブジェクトの埋め込みを完全に禁止
        upgradeInsecureRequests: [], // HTTPをHTTPSに自動アップグレード
      },
    },
    referrerPolicy: { policy: 'no-referrer' }, // リファラー情報の送信を防止
    frameguard: { action: 'deny' }, // クリックジャッキング攻撃を防止
    hidePoweredBy: true, // サーバー情報の漏洩を防止
    hsts: {
      // HTTPS強制の設定
      maxAge: 31536000, // HSTSの有効期間（1年）
      includeSubDomains: true, // サブドメインにも適用
      preload: true, // ブラウザのHSTSプリロードリストに登録
    },
    ieNoOpen: true, // IEでの潜在的な脆弱性を緩和
    noSniff: true, // MIMEタイプの推測を防止
    xssFilter: true, // XSS攻撃からの保護を有効化
  }),
);

// CORSの設定
// クロスオリジンリクエストの制御
app.use(
  cors({
    origin: '*', // 全てのオリジンからのアクセスを許可
    optionsSuccessStatus: 200, // プリフライトリクエストの成功状態コード
  }),
);

// 静的ファイルの配信設定
// publicディレクトリ内のファイルを直接配信
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      // ファイル種類別のContent-Type設定
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (filePath.endsWith('.ts')) {
        res.setHeader('Content-Type', 'text/x-typescript');
      }
    },
  }),
);

// セキュリティヘッダーの追加設定
// X-Powered-Byヘッダーを明示的に削除
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  next();
});

// ルートパスのルーティング設定
// メインページ（index.html）の配信
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// グローバルエラーハンドリング
// アプリケーション全体での予期せぬエラーをキャッチ
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack); // エラー情報をログに記録
  res.status(500).send('Something broke!'); // クライアントにエラーを通知
});

// サーバーの起動
// 指定されたポートでリッスンを開始
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
