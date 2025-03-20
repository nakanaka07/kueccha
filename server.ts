/**
 * Kuecchaアプリケーションサーバー
 * 静的ファイル配信と最小限のAPIエンドポイントを提供
 */
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createLogger, transports, format } from 'winston';

import type { Request, Response, NextFunction } from 'express';

// 環境変数のロード
dotenv.config();

// 基本設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = parseInt(process.env.PORT || '5173', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_DEV = NODE_ENV === 'development';
const IS_PROD = NODE_ENV === 'production';

// 定数設定
const CONSTANTS = {
  STATIC_DIR: 'dist',
  LOGS_DIR: 'logs',
  RATE_LIMIT: { WINDOW_MS: 15 * 60 * 1000, MAX: IS_DEV ? 1000 : 100 },
  CACHE_CONTROL: IS_PROD ? 'public, max-age=31536000, immutable' : 'no-cache',
  ERROR_MESSAGES: {
    400: 'リクエストが不正です',
    401: '認証が必要です',
    403: 'アクセス権限がありません',
    404: 'リソースが見つかりません',
    429: 'リクエスト回数が上限を超えました',
    500: 'サーバーエラーが発生しました',
  },
  ALLOWED_ORIGINS: IS_DEV
    ? ['https://localhost:5173', 'http://localhost:5173']
    : ['https://nakanaka07.github.io'],
  SHUTDOWN_TIMEOUT: 30000,
};

// ロガー設定
const logDir = path.join(__dirname, CONSTANTS.LOGS_DIR);
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logger = createLogger({
  level: IS_DEV ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'kueccha-server', environment: NODE_ENV },
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

// アプリケーション初期化
const app = express();

// レート制限
app.use(
  rateLimit({
    windowMs: CONSTANTS.RATE_LIMIT.WINDOW_MS,
    max: CONSTANTS.RATE_LIMIT.MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: '短時間に多すぎるリクエストが発生しました。しばらくしてから再度お試しください。',
    skip: (req) => req.path.match(/\.(css|js|jpg|png|gif|ico|svg|woff2?)$/i) !== null,
  })
);

// セキュリティヘッダー
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://maps.googleapis.com', 'https://api.emailjs.com'],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'https://*.googleapis.com', 'https://*.gstatic.com', 'data:'],
        connectSrc: ["'self'", 'https://*.googleapis.com', 'https://api.emailjs.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: IS_DEV ? [] : [true],
      },
    },
  })
);

// CORS設定
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (CONSTANTS.ALLOWED_ORIGINS.includes(origin) || IS_DEV) {
        callback(null, true);
      } else {
        logger.warn(`CORSリクエスト拒否`, { origin });
        callback(new Error('CORS policy violation'));
      }
    },
    methods: ['GET', 'HEAD'],
    credentials: true,
  })
);

// ボディパーサー
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 静的ファイル配信
app.use(
  express.static(path.join(__dirname, CONSTANTS.STATIC_DIR), {
    setHeaders: (res, filePath) => {
      res.setHeader('Cache-Control', CONSTANTS.CACHE_CONTROL);
    },
  })
);

// APIルート
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// SPAルート - すべてのルートでindex.htmlを返す
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, CONSTANTS.STATIC_DIR, 'index.html'));
});

// エラーハンドリング
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`リクエストされたパス ${req.originalUrl} が見つかりません`);
  (error as any).statusCode = 404;
  next(error);
});

app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    logger.error('サーバーエラー', {
      message: err.message,
      path: req.path,
      stack: err.stack,
    });
  } else {
    logger.warn('クライアントエラー', {
      message: err.message,
      path: req.path,
    });
  }

  res.status(statusCode).json({
    status: 'error',
    message: IS_DEV ? err.message : CONSTANTS.ERROR_MESSAGES[statusCode as keyof typeof CONSTANTS.ERROR_MESSAGES] || 'エラーが発生しました',
    ...(IS_DEV && { stack: err.stack }),
  });
});

// プロセスエラーハンドリング
process.on('unhandledRejection', (reason) => {
  logger.error('未処理のPromise拒否', {
    reason: reason instanceof Error ? reason.stack : String(reason),
  });
});

process.on('uncaughtException', (error) => {
  logger.error('未キャッチの例外', {
    message: error.message,
    stack: error.stack,
  });
  setTimeout(() => process.exit(1), CONSTANTS.SHUTDOWN_TIMEOUT);
});

// サーバー起動
async function startServer() {
  let server;

  if (IS_DEV) {
    try {
      const keyPath = path.resolve(__dirname, 'localhost.key');
      const certPath = path.resolve(__dirname, 'localhost.crt');

      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        const httpsOptions = {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        };
        server = https.createServer(httpsOptions, app);
        server.listen(PORT, () => {
          logger.info(`✅ 開発サーバー(HTTPS)が起動しました`, {
            url: `https://localhost:${PORT}`,
          });
        });
        return;
      }
    } catch (error) {
      logger.info('HTTPS証明書が見つからないため、HTTP接続で起動します');
    }
  }

  server = http.createServer(app);
  server.listen(PORT, () => {
    logger.info(`✅ サーバー(HTTP)が起動しました`, {
      environment: NODE_ENV,
      port: PORT,
    });
  });

  // グレースフルシャットダウン
  process.on('SIGTERM', () => {
    logger.info('サーバーをシャットダウンしています...');
    server.close(() => {
      logger.info('サーバー接続を終了しました');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), CONSTANTS.SHUTDOWN_TIMEOUT);
  });
}

startServer().catch((error) => {
  logger.error('サーバー起動エラー', { error: String(error) });
  process.exit(1);
});