/// <reference types="vite/client" /> // Viteのクライアント型定義を参照

// 環境変数の型定義
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string; // Google Maps APIキー
  readonly VITE_GOOGLE_MAPS_MAP_ID: string; // Google Maps Map ID
  readonly VITE_GOOGLE_SHEETS_API_KEY: string; // Google Sheets APIキー
  readonly VITE_GOOGLE_SPREADSHEET_ID: string; // Google Sheets スプレッドシートID
  readonly VITE_EMAILJS_SERVICE_ID: string; // EmailJS Service ID
  readonly VITE_EMAILJS_TEMPLATE_ID: string; // EmailJS Template ID
  readonly VITE_EMAILJS_PUBLIC_KEY: string; // EmailJS Public Key
}

// ImportMetaの型定義
interface ImportMeta {
  readonly env: ImportMetaEnv; // 環境変数を含むenvプロパティ
}
