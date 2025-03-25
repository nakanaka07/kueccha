/// <reference types="vite/client" />

interface ImportMetaEnv {
  // アプリケーション基本情報
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_SHORT_NAME: string;
  readonly VITE_APP_DESCRIPTION: string;

  // Google API関連の環境変数
  readonly VITE_GOOGLE_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
  readonly VITE_GOOGLE_SPREADSHEET_ID: string;

  // EmailJS関連の環境変数
  readonly VITE_EMAILJS_SERVICE_ID: string;
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  readonly VITE_EMAILJS_PUBLIC_KEY: string;

  // 環境識別子（Viteが自動的に提供）
  readonly MODE: string;
  readonly NODE_ENV: 'development' | 'production' | 'test';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
