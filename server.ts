/**
 * Kuecchaアプリケーションサーバー
 *
 * 静的ファイル配信と必要最小限のAPIエンドポイントを提供する
 * Node.js + Express.jsサーバー
 */

import { randomBytes } from 'node:crypto';
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
import type { RateLimitRequestHandler } from 'express-rate-limit';
import type { Logger } from 'winston';

// ============================================================================
// 定数と設定
// ============================================================================

// 静的定数 - 環境に依存しない固定値
const CONSTANTS = {
  LOGS_DIR: 'logs',
  STATIC_DIR: 'dist',
  DEFAULT_PORT: 5173,
  DEFAULT_ENV: 'development',
  DEFAULT_LOG_LEVEL: 'info',
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15分間
    DEV_MAX: 1000,
    PROD_MAX: 100,
  },
  CACHE_CONTROL: {
    PROD: 'public, max-age=31536000, immutable', // 1年
    STAGING: 'public, max-age=86400', // 1日
    TEST: 'public, max-age=3600', // 1時間
    DEV: 'no-cache',
    DYNAMIC: 'no-cache',
  },
  ERROR_MESSAGES: {
    400: 'リクエストが不正です',
    401: '認証が必要です',
    403: 'アクセス権限がありません',
    404: 'リソースが見つかりません',
    429: 'リクエスト回数が上限を超えました',
    500: 'サーバーエラーが発生しました',
    503: 'サービスが利用できません',
  },
  MIME_TYPES: {
    TS: 'text/x-typescript',
  },
  GRACEFUL_SHUTDOWN_TIMEOUT: 30000, // 30秒
  EMERGENCY_SHUTDOWN_TIMEOUT: 60000, // 1分
} as const;

// 環境変数のロード
dotenv.config();

// ファイルパスの設定（ESModuleでの__dirnameの代替）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// 型定義
// ============================================================================

/**
 * 環境設定の型
 */
interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: string;
  LOG_LEVEL: string;
}

/**
 * 環境タイプのフラグ
 */
interface EnvironmentFlags {
  IS_DEV: boolean;
  IS_TEST: boolean;
  IS_STAGING: boolean;
  IS_PROD: boolean;
}

/**
 * アプリケーション固有のエラー型
 */
interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * HTTPS設定の結果型
 */
interface HttpsConfigResult {
  config: https.ServerOptions;
  isAvailable: boolean;
}

// ============================================================================
// 環境設定
// ============================================================================

/**
 * 環境変数から設定を読み込む
 * @returns 環境設定オブジェクト
 */
function loadEnvironmentConfig(): EnvironmentConfig {
  return {
    PORT: parseInt(process.env.PORT || String(CONSTANTS.DEFAULT_PORT), 10),
    NODE_ENV: process.env.NODE_ENV || CONSTANTS.DEFAULT_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL || CONSTANTS.DEFAULT_LOG_LEVEL,
  };
}

/**
 * 環境フラグを設定する
 * @param env 環境設定オブジェクト
 * @returns 環境フラグオブジェクト
 */
function createEnvironmentFlags(env: EnvironmentConfig): EnvironmentFlags {
  return {
    IS_DEV: env.NODE_ENV === 'development',
    IS_TEST: env.NODE_ENV === 'test',
    IS_STAGING: env.NODE_ENV === 'staging',
    IS_PROD: env.NODE_ENV === 'production',
  };
}

// 環境設定の初期化
const ENV: EnvironmentConfig = loadEnvironmentConfig();
const ENV_FLAGS: EnvironmentFlags = createEnvironmentFlags(ENV);

// 環境ごとの許可されたオリジン
const ALLOWED_ORIGINS: Record<string, string[]> = {
  development: ['https://localhost:5173', 'http://localhost:5173'],
  test: ['https://test.example.com'],
  staging: ['https://staging.example.com'],
  production: ['https://nakanaka07.github.io'],
};

// ============================================================================
// ロギング設定
// ============================================================================

/**
 * アプリケーションロガーを設定・取得
 * @returns 設定されたWinstonロガー
 */
function setupLogger(): Logger {
  // ログディレクトリの作成（存在しない場合）
  const logDir = path.join(__dirname, CONSTANTS.LOGS_DIR);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return createLogger({
    level: ENV_FLAGS.IS_DEV ? 'debug' : ENV.LOG_LEVEL,
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.json(),
    ),
    defaultMeta: {
      service: 'kueccha-server',
      environment: ENV.NODE_ENV,
    },
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, service, environment, ...rest }) => {
            const restString = Object.keys(rest).length
              ? JSON.stringify(rest, null, ENV_FLAGS.IS_DEV ? 2 : undefined)
              : '';
            return `${timestamp} [${service}:${environment}] ${level}: ${message} ${restString}`;
          }),
        ),
      }),
      new transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
      }),
      new transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
    ],
  });
}

// ロガーの初期化
const logger = setupLogger();

// ============================================================================
// ヘルパー関数
// ============================================================================

/**
 * 安全なnonceを生成する関数
 * @returns Base64でエンコードされたランダムバイト列
 */
function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

/**
 * 公開可能なエラーメッセージを取得する関数
 * @param statusCode HTTPステータスコード
 * @returns ユーザーフレンドリーなエラーメッセージ
 */
function getPublicErrorMessage(statusCode: number): string {
  return (
    CONSTANTS.ERROR_MESSAGES[statusCode as keyof typeof CONSTANTS.ERROR_MESSAGES] ||
    'エラーが発生しました'
  );
}

/**
 * アプリケーションエラーを作成する
 * @param message エラーメッセージ
 * @param statusCode HTTPステータスコード
 * @param options 追加オプション
 * @returns 構造化されたAppErrorオブジェクト
 */
function createAppError(
  message: string,
  statusCode: number = 500,
  options?: { code?: string; isOperational?: boolean; details?: Record<string, unknown> },
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;

  if (options) {
    error.code = options.code;
    error.isOperational = options.isOperational ?? true;
    error.details = options.details;
  }

  return error;
}

/**
 * HTTPSの設定を読み込む
 * @returns HTTPS設定の結果
 */
function loadHttpsConfig(): HttpsConfigResult {
  try {
    const keyPath = path.resolve(__dirname, 'localhost.key');
    const certPath = path.resolve(__dirname, 'localhost.crt');

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        config: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
        isAvailable: true,
      };
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('SSL証明書の読み込みエラー', { error: err.message, stack: err.stack });
  }

  return { config: {}, isAvailable: false };
}

// ============================================================================
// ミドルウェア設定
// ============================================================================

/**
 * レート制限の設定を構成
 * @returns 設定されたレート制限ミドルウェア
 */
function configureRateLimit(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: CONSTANTS.RATE_LIMIT.WINDOW_MS,
    max: ENV_FLAGS.IS_DEV ? CONSTANTS.RATE_LIMIT.DEV_MAX : CONSTANTS.RATE_LIMIT.PROD_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: '短時間に多すぎるリクエストが発生しました。しばらくしてから再度お試しください。',
    skip: (req: Request) => {
      // 静的アセットに対するリクエストはレート制限を適用しない
      return req.path.match(/\.(css|js|jpg|png|gif|ico|svg|woff2?)$/i) !== null;
    },
  });
}

/**
 * CSPディレクティブを構成
 * @param nonce 現在のリクエスト用のCSP nonce
 * @returns 設定されたCSPディレクティブ
 */
function configureCSPDirectives(nonce: string): Record<string, Array<string>> {
  return {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      `'nonce-${nonce}'`,
      'https://maps.googleapis.com',
      'https://api.emailjs.com',
    ],
    styleSrc: ["'self'", `'nonce-${nonce}'`, 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'https://*.googleapis.com', 'https://*.gstatic.com', 'data:'],
    connectSrc: ["'self'", 'https://*.googleapis.com', 'https://api.emailjs.com'],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: ENV_FLAGS.IS_DEV ? [] : [true],
  };
}

/**
 * 静的ファイルのキャッシュ設定を構成
 * @param env 環境フラグ
 * @returns 適切なCache-Control値
 */
function getCacheControlHeader(filePath: string): string {
  const isStaticAsset = filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$/);

  if (!isStaticAsset) {
    return CONSTANTS.CACHE_CONTROL.DYNAMIC;
  }

  if (ENV_FLAGS.IS_PROD) {
    return CONSTANTS.CACHE_CONTROL.PROD;
  } else if (ENV_FLAGS.IS_STAGING) {
    return CONSTANTS.CACHE_CONTROL.STAGING;
  } else if (ENV_FLAGS.IS_TEST) {
    return CONSTANTS.CACHE_CONTROL.TEST;
  } else {
    return CONSTANTS.CACHE_CONTROL.DEV;
  }
}

// ============================================================================
// Express アプリケーション設定
// ============================================================================

const app = express();

// レート制限の適用
app.use(configureRateLimit());

// リクエストごとにnonceを生成
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.nonce = generateNonce();
  next();
});

// Helmetによるセキュリティヘッダー設定
app.use((req: Request, res: Response, next: NextFunction) => {
  const nonce = res.locals.nonce;

  helmet({
    contentSecurityPolicy: {
      directives: configureCSPDirectives(nonce),
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

// CORS設定
app.use(
  cors({
    origin: (origin, callback) => {
      // オリジン未定義の場合（例：Postman、curl等）は許可
      if (!origin) return callback(null, true);

      const currentAllowedOrigins = ALLOWED_ORIGINS[ENV.NODE_ENV] || ALLOWED_ORIGINS.production;

      if (currentAllowedOrigins.includes(origin) || ENV_FLAGS.IS_DEV) {
        callback(null, true);
      } else {
        logger.warn(`CORSリクエスト拒否`, { origin });
        callback(createAppError('CORS policy violation', 403));
      }
    },
    optionsSuccessStatus: 200,
    methods: ['GET', 'HEAD'],
    credentials: true,
  }),
);

// JSON・URLエンコードボディパーサー
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 静的ファイル配信設定
app.use(
  express.static(path.join(__dirname, CONSTANTS.STATIC_DIR), {
    setHeaders: (res: Response, filePath: string) => {
      // 開発環境でのTypeScriptファイルのMIMEタイプ設定
      if (ENV_FLAGS.IS_DEV && filePath.endsWith('.ts')) {
        res.setHeader('Content-Type', CONSTANTS.MIME_TYPES.TS);
      }

      // 適切なキャッシュコントロール設定
      res.setHeader('Cache-Control', getCacheControlHeader(filePath));
    },
  }),
);

// ============================================================================
// ルート設定
// ============================================================================

/**
 * API用認証ミドルウェア
 */
function authenticate(req: Request, res: Response, next: NextFunction): void {
  // 開発環境では認証をスキップ
  if (ENV_FLAGS.IS_DEV) return next();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: getPublicErrorMessage(401),
    });
  }

  try {
    // 実際の認証ロジックを実装（JWT検証など）
    // 現在はプレースホルダー
    next();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn('認証エラー', { error: err.message });

    return res.status(403).json({
      status: 'error',
      message: getPublicErrorMessage(403),
    });
  }
}

// APIルート (認証ミドルウェア適用)
const apiRouter = express.Router();

// ここにAPI関連のエンドポイントを追加
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// APIルートの登録
app.use('/api', authenticate, apiRouter);

// SPAルートハンドラ - すべてのルートでindex.htmlを返す
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, CONSTANTS.STATIC_DIR, 'index.html'));
});

// ============================================================================
// エラーハンドリング
// ============================================================================

// 404エラーハンドラー
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = createAppError(`リクエストされたパス ${req.originalUrl} が見つかりません`, 404, {
    code: 'NOT_FOUND',
  });
  next(error);
});

// グローバルエラーハンドラー
app.use((err: AppError, req: Request, res: Response, _next: NextFunction) => {
  // デフォルトは500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  // エラー情報の構造化
  const errorInfo = {
    message: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  };

  // エラーログ記録（重大度に応じて）
  if (isServerError) {
    logger.error('サーバーエラー', {
      ...errorInfo,
      stack: err.stack,
      details: err.details,
    });
  } else {
    logger.warn('クライアントエラー', errorInfo);
  }

  // クライアントへのレスポンス
  const errorResponse = {
    status: 'error',
    message: ENV_FLAGS.IS_DEV ? err.message : getPublicErrorMessage(statusCode),
    code: err.code,
    ...(ENV_FLAGS.IS_DEV && { stack: err.stack, details: err.details }),
  };

  res.status(statusCode).json(errorResponse);
});

// ============================================================================
// プロセス全体のエラーハンドリング
// ============================================================================

// 未処理のPromise拒否をキャッチ
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未処理のPromise拒否', {
    reason: reason instanceof Error ? reason.stack : String(reason),
    promise: String(promise),
  });
  // アプリケーションはクラッシュさせず処理を継続
});

// 未キャッチ例外をキャッチ
process.on('uncaughtException', (error: Error) => {
  logger.error('未キャッチの例外', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  // 安全にサーバーをシャットダウン（1分後）
  setTimeout(() => {
    logger.info('未キャッチ例外により終了します');
    process.exit(1);
  }, CONSTANTS.EMERGENCY_SHUTDOWN_TIMEOUT);
});

// プロセス終了シグナルのハンドリング
process.on('SIGTERM', () => {
  logger.info('SIGTERMシグナルを受信しました。サーバーをシャットダウンします');
});

// ============================================================================
// サーバー起動
// ============================================================================

/**
 * サーバーを適切なプロトコルで起動
 */
async function startServer(): Promise<void> {
  let server;
  const serverOptions = { port: ENV.PORT };

  // 開発環境ではHTTPSを試みる
  if (ENV_FLAGS.IS_DEV) {
    const { config: httpsOptions, isAvailable } = loadHttpsConfig();

    if (isAvailable) {
      server = https.createServer(httpsOptions, app);
      server.listen(serverOptions.port, () => {
        logger.info(`✅ 開発サーバー(HTTPS)が起動しました`, {
          url: `https://localhost:${serverOptions.port}`,
        });
      });
      configureGracefulShutdown(server);
      return;
    }

    logger.info('HTTPS証明書が見つからないため、HTTP接続で起動します');
  }

  // HTTPSが失敗した場合やHTTP環境での起動
  server = http.createServer(app);
  server.listen(serverOptions.port, () => {
    logger.info(`✅ サーバー(HTTP)が起動しました`, {
      environment: ENV.NODE_ENV,
      port: serverOptions.port,
    });
  });

  configureGracefulShutdown(server);
}

/**
 * グレースフルシャットダウンの設定
 */
function configureGracefulShutdown(server: http.Server | https.Server): void {
  process.on('SIGTERM', () => {
    logger.info('サーバーをグレースフルシャットダウンしています...');

    server.close(() => {
      logger.info('サーバー接続を終了しました');
      process.exit(0);
    });

    // 強制終了タイムアウト
    setTimeout(() => {
      logger.error('グレースフルシャットダウンがタイムアウトしました、強制終了します');
      process.exit(1);
    }, CONSTANTS.GRACEFUL_SHUTDOWN_TIMEOUT);
  });
}

// サーバーの起動と例外ハンドリング
startServer().catch((error) => {
  logger.error('サーバー起動中にエラーが発生しました', {
    error: error instanceof Error ? error.stack : String(error),
  });
  process.exit(1);
});
