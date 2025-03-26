/// <reference types="vite/client" />

/**
 * アプリケーションで使用する環境変数の型定義
 * @description
 * この型定義はViteが提供するImportMetaEnvを拡張し、
 * アプリケーション固有の環境変数に型安全性を提供します。
 */
interface ImportMetaEnv {
  // ==== アプリケーション基本情報 ====
  /** アプリケーションの正式名称 */
  readonly VITE_APP_NAME: string;
  /** アプリケーションの略称 */
  readonly VITE_APP_SHORT_NAME: string;
  /** アプリケーションの説明文 */
  readonly VITE_APP_DESCRIPTION: string;

  // ==== Google API関連の環境変数 ====
  /** Google APIキー (Maps API等で使用) */
  readonly VITE_GOOGLE_API_KEY: string;
  /** Google Maps用のマップID */
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
  /** データソースとなるGoogleスプレッドシートID */
  readonly VITE_GOOGLE_SPREADSHEET_ID: string;

  // ==== EmailJS関連の環境変数 ====
  /** EmailJSのサービスID */
  readonly VITE_EMAILJS_SERVICE_ID: string;
  /** EmailJSのテンプレートID */
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  /** EmailJSの公開キー */
  readonly VITE_EMAILJS_PUBLIC_KEY: string;

  // ==== Viteが自動的に提供する環境変数 ====
  /** 現在のモード (Viteが自動的に提供) */
  readonly MODE: string;
  /** 現在の環境 (Viteが自動的に提供) */
  readonly NODE_ENV: 'development' | 'production' | 'test';

  // ==== その他のオプション環境変数 (必要に応じて追加) ====
  /** デバッグモード有効フラグ (任意) */
  readonly VITE_DEBUG_MODE?: 'true' | 'false';
  /** API基本URL (任意) */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// エクスポートするインターフェースは実際の使用場所で便利に使えるよう提供
export type Environment = 'development' | 'production' | 'test';
export type { ImportMetaEnv };
