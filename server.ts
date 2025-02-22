// 必要なモジュールをインポート
import path, { dirname } from 'path'; // ファイルパス操作用のモジュール
import { fileURLToPath } from 'url'; // URLからファイルパスを取得するためのモジュール
import cors from 'cors'; // CORS（クロスオリジンリソースシェアリング）を有効にするためのミドルウェア
import dotenv from 'dotenv'; // 環境変数を読み込むためのモジュール
import express, { Request, Response, NextFunction } from 'express'; // Expressフレームワークと型定義をインポート
import helmet from 'helmet'; // セキュリティヘッダーを設定するためのミドルウェア

// 環境変数を読み込む
dotenv.config();

// 現在のファイル名とディレクトリ名を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Expressアプリケーションを作成
const app = express();
// ポート番号を環境変数から取得、デフォルトは3000
const port = process.env.PORT || 3000;

// Helmetミドルウェアを使用してセキュリティヘッダーを設定
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // デフォルトのソースを自身のドメインに制限
        scriptSrc: ["'self'", "'unsafe-inline'"], // スクリプトのソースを自身のドメインとインラインスクリプトに制限
        objectSrc: ["'none'"], // オブジェクトのソースを禁止
        upgradeInsecureRequests: [], // HTTPリクエストをHTTPSにアップグレード
      },
    },
    referrerPolicy: { policy: 'no-referrer' }, // リファラーポリシーを設定
    frameguard: { action: 'deny' }, // フレーム内での表示を禁止
    hidePoweredBy: true, // X-Powered-Byヘッダーを隠す
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // HSTSを設定
    ieNoOpen: true, // IEのファイルダウンロードの脆弱性を防ぐ
    noSniff: true, // MIMEタイプのスニッフィングを防ぐ
    xssFilter: true, // XSSフィルターを有効にする
  }),
);

// CORSミドルウェアを使用して全てのオリジンからのリクエストを許可
app.use(
  cors({
    origin: '*', // 全てのオリジンを許可
    optionsSuccessStatus: 200, // 成功ステータスコードを200に設定
  }),
);

// 静的ファイルを提供するためのミドルウェアを設定
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      // ファイルの拡張子に応じて適切なContent-Typeヘッダーを設定
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

// 全てのリクエストからX-Powered-Byヘッダーを削除
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  next();
});

// ルートパスにアクセスがあった場合、index.htmlを返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// エラーハンドリングミドルウェア
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack); // エラースタックをコンソールに出力
  res.status(500).send('Something broke!'); // 500ステータスコードでエラーメッセージを返す
});

// サーバーを指定したポートで起動
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`); // サーバー起動メッセージをコンソールに出力
});
