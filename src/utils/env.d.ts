/// <reference types="vite/client" />

// 環境変数の型定義
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string; // Google Maps APIキー
  readonly VITE_GOOGLE_MAPS_MAP_ID: string; // Google Maps Map ID
  readonly VITE_GOOGLE_SHEETS_API_KEY: string; // Google Sheets APIキー
  readonly VITE_GOOGLE_SPREADSHEET_ID: string; // Google Sheets スプレッドシートID
}

// ImportMetaの型定義
interface ImportMeta {
  readonly env: ImportMetaEnv; // 環境変数を含むenvプロパティ
}
