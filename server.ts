import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// セキュリティヘッダーの設定
app.use(helmet());

// CORS設定
app.use(
  cors({
    origin: '*',
    optionsSuccessStatus: 200,
  }),
);

// 静的ファイルの提供
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
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

// 不要なヘッダーの削除
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By'); // Expressのデフォルトヘッダーを削除
  next();
});

// ルートエンドポイント
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// エラーハンドリングミドルウェア
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
