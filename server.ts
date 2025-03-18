import { randomBytes } from 'crypto';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createLogger, transports, format } from 'winston';

// 環境変数の読み込み
dotenv.config();

// 環境設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 環境変数
const port = process.env.PORT || 5173;
const nodeEnv = process.env.NODE_ENV || 'development';
const isDev = nodeEnv === 'development';
const isTest = nodeEnv === 'test';
const isStaging = nodeEnv === 'staging';
const isProd = nodeEnv === 'production';

// ロガーの設定
const logger = createLogger({
  level: isDev ? 'debug' : 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});

const app = express();

// レート制限の設定
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分間
  max: isDev ? 1000 : 100, // 環境に応じた制限
  standardHeaders: true,
  legacyHeaders: false,
  message: '短時間に多すぎるリクエストが発生しました。しばらくしてから再度お試しください。',
});

// 基本的なレート制限を適用
app.use(limiter);

// 許可するオリジンの設定
const allowedOrigins = {
  development: ['https://localhost:5173'],
  test: ['https://test.example.com'],
  staging: ['https://staging.example.com'],
  production: ['https://nakanaka07.github.io'],
};

// nonce生成関数
const generateNonce = () => {
  return randomBytes(16).toString('base64');
};

// リクエストごとにnonceを生成するミドルウェア
app.use((req, res, next) => {
  res.locals.nonce = generateNonce();
  next();
});

// セキュリティヘッダーの設定
app.use((req, res, next) => {
  const nonce = res.locals.nonce;
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", `'nonce-${nonce}'`, 'https://maps.googleapis.com', 'https://api.emailjs.com'],
        styleSrc: ["'self'", `'nonce-${nonce}'`, 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'https://*.googleapis.com', 'https://*.gstatic.com', 'data:'],
        connectSrc: ["'self'", 'https://*.googleapis.com', 'https://api.emailjs.com'],
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
  })(req, res, next);
});

// CORSの設定
app.use(
  cors({
    origin: (origin, callback) => {
      // origin未定義の場合（例：Postman、curl等）
      if (!origin) return callback(null, true);

      const currentAllowedOrigins = allowedOrigins[nodeEnv as keyof typeof allowedOrigins] || allowedOrigins.production;

      if (currentAllowedOrigins.indexOf(origin) !== -1 || isDev) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy violation'));
      }
    },
    optionsSuccessStatus: 200,
    methods: ['GET', 'HEAD'],
    credentials: true,
  }),
);

// JSON解析ミドルウェア
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
        // 静的アセットは長期キャッシュ（環境に応じて調整）
        if (isProd) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (isStaging) {
          res.setHeader('Cache-Control', 'public, max-age=86400'); // 1日
        } else if (isTest) {
          res.setHeader('Cache-Control', 'public, max-age=3600'); // 1時間
        } else {
          res.setHeader('Cache-Control', 'no-cache');
        }
      } else {
        // HTMLなどは短期キャッシュ
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

// API認証用のミドルウェア（例：JWT認証）
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // ここにJWTやその他の認証ロジックを実装
  // 開発環境ではスキップすることも可能
  if (isDev) return next();

  // トークン検証のロジック（実際の実装に置き換え）
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: '認証が必要です' });
  }

  try {
    // JWT検証ロジックがここに入る
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: '無効なトークンです' });
  }
};

// APIルート（必要に応じて）
app.use('/api', authenticate, express.Router());

// ルートパスのハンドリング
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// SPAルーティング対応（すべてのルートでindex.htmlを返す）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// カスタムエラータイプ
interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// 404エラーハンドラー
app.use((req: Request, res: Response, next: NextFunction) => {
  const error: AppError = new Error(`リクエストされたパス ${req.originalUrl} が見つかりません`);
  error.statusCode = 404;
  next(error);
});

// 集中型エラーハンドリング
app.use((err: AppError, req: Request, res: Response, _next: NextFunction) => {
  err.statusCode = err.statusCode || 500;

  // エラーログ記録（レベルに応じて）
  if (err.statusCode >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn({
      message: err.message,
      path: req.path,
      method: req.method,
    });
  }

  // クライアントへの応答
  res.status(err.statusCode).json({
    status: 'error',
    message: isDev ? err.message : getPublicErrorMessage(err.statusCode),
    stack: isDev ? err.stack : undefined,
  });
});

// 公開エラーメッセージを取得（ステータスコードに応じて）
function getPublicErrorMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: 'リクエストが不正です',
    401: '認証が必要です',
    403: 'アクセス権限がありません',
    404: 'リソースが見つかりません',
    429: 'リクエスト回数が上限を超えました',
    500: 'サーバーエラーが発生しました',
    503: 'サービスが利用できません',
  };

  return messages[statusCode] || 'エラーが発生しました';
}

// プロセス全体のエラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
  // アプリケーションのクラッシュを防ぐ
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  // 安全にサーバーをシャットダウン
  process.exit(1);
});

// サーバー起動（環境に応じてHTTPまたはHTTPS）
if (isDev) {
  try {
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, 'localhost.key')),
      cert: fs.readFileSync(path.join(__dirname, 'localhost.crt')),
    };

    https.createServer(httpsOptions, app).listen(port, () => {
      logger.info(`開発サーバーが起動しました: https://localhost:${port}`);
    });
  } catch (error) {
    logger.error('HTTPS証明書の読み込みに失敗しました、HTTP接続にフォールバックします', error);
    http.createServer(app).listen(port, () => {
      logger.info(`開発サーバーが起動しました: http://localhost:${port}`);
    });
  }
} else {
  // テスト/ステージング/本番環境ではHTTPSを強制（ロードバランサー経由の場合は調整）
  const server = http.createServer(app).listen(port, () => {
    logger.info(`${nodeEnv}サーバーが起動しました: ポート${port}`);
  });

  // グレースフルシャットダウン
  process.on('SIGTERM', () => {
    logger.info('SIGTERMシグナルを受信。サーバーをシャットダウンします');
    server.close(() => {
      logger.info('プロセスを終了します');
      process.exit(0);
    });
  });
}
