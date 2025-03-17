import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import https from 'https';
import http from 'http';
import fs from 'fs';

// 環境変数の読み込み
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5173;
const isDev = process.env.NODE_ENV !== 'production';

// 許可するオリジンの設定
const allowedOrigins = isDev 
  ? ['https://localhost:5173'] 
  : ['https://nakanaka07.github.io'];

// セキュリティヘッダーの設定
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://api.emailjs.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "https://*.googleapis.com", "https://*.gstatic.com", "data:"],
        connectSrc: ["'self'", "https://*.googleapis.com", "https://api.emailjs.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: isDev ? [] : [true],
      },
    },
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    xssFilter: true,
  }),
);

// CORSの設定
app.use(
  cors({
    origin: allowedOrigins,
    optionsSuccessStatus: 200,
    methods: ['GET', 'HEAD'],
    credentials: true,
  }),
);

// 静的ファイルの配信設定
app.use(
  express.static(path.join(__dirname, 'dist'), {
    setHeaders: (res, filePath) => {
      // 本番環境ではTypeScriptファイルを直接配信しない
      if (isDev && filePath.endsWith('.ts')) {
        res.setHeader('Content-Type', 'text/x-typescript');
      }
      
      // キャッシュ設定
      if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
        // 静的アセットは長期キャッシュ
        res.setHeader('Cache-Control', isDev ? 'no-cache' : 'public, max-age=31536000');
      } else {
        // HTMLなどは短期キャッシュ
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

// ルートパスのハンドリング
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// SPAルーティング対応（すべてのルートでindex.htmlを返す）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// エラーハンドリング（改善版）
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  if (isDev) console.error(err.stack);
  
  res.status(statusCode).json({
    message: isDev ? err.message : 'サーバーエラーが発生しました',
    stack: isDev ? err.stack : undefined,
  });
});

// サーバー起動（環境に応じてHTTPまたはHTTPS）
if (isDev) {
  try {
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, 'localhost.key')),
      cert: fs.readFileSync(path.join(__dirname, 'localhost.crt'))
    };
    
    https.createServer(httpsOptions, app).listen(port, () => {
      console.log(`開発サーバーが起動しました: https://localhost:${port}`);
    });
  } catch (error) {
    console.error('HTTPS証明書の読み込みに失敗しました、HTTP接続にフォールバックします', error);
    http.createServer(app).listen(port, () => {
      console.log(`開発サーバーが起動しました: http://localhost:${port}`);
    });
  }
} else {
  http.createServer(app).listen(port, () => {
    console.log(`本番サーバーが起動しました: ポート${port}`);
  });
}