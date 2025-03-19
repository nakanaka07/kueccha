/**
 * 環境変数型定義ファイル
 *
 * このファイルはViteアプリケーションで使用される環境変数の型を定義します。
 * 接頭辞「VITE_」を持つ変数はクライアントサイドのコードで参照可能です。
 *
 * @see https://vitejs.dev/guide/env-and-mode.html
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // -------------------------------------------------------------
  // EmailJS設定 - お問い合わせフォーム機能
  // -------------------------------------------------------------
  readonly VITE_EMAILJS_PUBLIC_KEY: string; // EmailJSアカウントの公開キー
  readonly VITE_EMAILJS_SERVICE_ID: string; // メール送信に使用するサービスID
  readonly VITE_EMAILJS_TEMPLATE_ID: string; // メールテンプレートID

  // -------------------------------------------------------------
  // Google Maps API設定 - 地図表示機能
  // -------------------------------------------------------------
  readonly VITE_GOOGLE_MAPS_API_KEY: string; // Maps JavaScript APIのキー
  readonly VITE_GOOGLE_MAPS_MAP_ID: string; // カスタムスタイル用のマップID

  // -------------------------------------------------------------
  // Google Sheets API設定 - PoI（Points of Interest）情報管理
  // -------------------------------------------------------------
  readonly VITE_GOOGLE_SHEETS_API_KEY: string; // Sheets APIアクセス用キー
  readonly VITE_GOOGLE_SPREADSHEET_ID: string; // データソースとなるスプレッドシートID
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
