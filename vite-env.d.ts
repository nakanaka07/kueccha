/// <reference types="vite/client" />

/**
 * アプリケーション全体で使用される環境変数の型定義
 * Viteは VITE_ プレフィックスの環境変数をクライアントコードに公開します
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** アプリケーション実行環境 */
    NODE_ENV: 'development' | 'production' | 'test';

    /**
     * Google API関連設定
     * マップ表示とスプレッドシート連携に使用
     */
    VITE_GOOGLE_API_KEY: string;                  // Google APIアクセス用キー
    VITE_GOOGLE_MAPS_MAP_ID: string;              // カスタムマップスタイル用ID
    VITE_GOOGLE_SPREADSHEET_ID: string;           // POIデータを格納するスプレッドシートID

    /**
     * EmailJS関連設定
     * 問い合わせフォーム送信に使用
     */
    VITE_EMAILJS_SERVICE_ID: string;              // EmailJSのサービスID 
    VITE_EMAILJS_TEMPLATE_ID: string;             // 使用するテンプレートID
    VITE_EMAILJS_PUBLIC_KEY: string;              // EmailJS公開キー

    /**
     * デプロイ設定
     * GitHub Pagesなどのサブパスデプロイをサポートするためのベースパス
     */
    VITE_BASE_PATH: string;                       // ベースパス (例: '/kueccha')

    /**
     * PWA設定
     * マニフェストとPWA機能向け設定
     */
    VITE_APP_NAME: string;                        // アプリ正式名称
    VITE_APP_SHORT_NAME: string;                  // アプリ短縮名
    VITE_APP_DESCRIPTION: string;                 // アプリ説明文

    /**
     * 機能フラグ
     * 特定の機能の有効/無効を制御
     */
    VITE_ENABLE_ANALYTICS?: 'true' | 'false';     // アナリティクス機能の有効化
    VITE_ENABLE_OFFLINE_MODE?: 'true' | 'false';  // オフラインモードサポート
  }
}