/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    
    // Google API関連
    VITE_GOOGLE_API_KEY: string;
    VITE_GOOGLE_MAPS_MAP_ID: string;
    VITE_GOOGLE_SPREADSHEET_ID: string;
    
    // EmailJS関連
    VITE_EMAILJS_SERVICE_ID: string;
    VITE_EMAILJS_TEMPLATE_ID: string;
    VITE_EMAILJS_PUBLIC_KEY: string;
    
    // GitHub Pages設定
    BASE_PATH: string;
    
    // PWA設定
    VITE_APP_NAME: string;
    VITE_APP_SHORT_NAME: string;
    VITE_APP_DESCRIPTION: string;
    
    // 追加の環境変数をここに定義
  }
}