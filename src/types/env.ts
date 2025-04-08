/**
 * 環境設定の型定義
 */
// LogLevelTypeをエクスポート（LogLevelは直接使用しないためインポートを削除）
export type LogLevelType = 'error' | 'warn' | 'info' | 'debug';

// EnvironmentConfigインターフェース
export interface EnvironmentConfig {
  // アプリケーション基本情報
  app: {
    name: string;
    shortName: string;
    description: string;
    version: string;
    buildDate: string;
    basePath: string;
  };

  // Google API関連
  google: {
    apiKey: string;
    mapsVersion: string;
    mapsLibraries: string[];
    mapId: string;
    spreadsheetId: string;
  };

  // EmailJS関連
  emailjs: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };

  // 環境設定
  env: {
    mode: 'development' | 'production' | 'test';
    isDev: boolean;
    isProd: boolean;
    isTest: boolean;
    debug: boolean;
  };

  // 機能フラグ設定
  features: {
    googleSheets: boolean;
    offlineMode: boolean;
    analytics: boolean;
    markerClustering: boolean;
    verboseLogging: boolean;
  };

  // UI設定
  ui: {
    map: {
      initialZoom: number;
      initialCenter: {
        lat: number;
        lng: number;
      };
      init: {
        delay: number;
        debug: boolean;
      };
    };
  };

  // ログ設定
  logging: {
    level: LogLevelType;
  };

  // デバッグ設定
  debug: {
    ENABLE_MAP_DEBUG: boolean;
  };
}

// デフォルトエクスポートは削除
// verbatimModuleSyntaxが有効な場合はインターフェースを直接エクスポート
