/**
 * 環境変数型定義 - GitHub Pages最適化版
 * 
 * このファイルでは以下の環境変数を定義しています：
 * 1. EmailJS関連：お問い合わせフォーム用
 * 2. Google Maps API関連：地図表示用
 * 3. Google Sheets API関連：POIデータ取得用
 * 
 * 開発環境：.envファイルから読み込み
 * 本番環境：GitHub Secretsから自動注入（GitHub Actions経由）
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  // EmailJS - お問い合わせフォーム連携用
  readonly VITE_EMAILJS_PUBLIC_KEY: string;  // EmailJSの公開キー
  readonly VITE_EMAILJS_SERVICE_ID: string;  // EmailJSのサービスID
  readonly VITE_EMAILJS_TEMPLATE_ID: string; // EmailJSのテンプレートID

  // Google Maps API - 地図表示とマーカー機能用
  readonly VITE_GOOGLE_MAPS_API_KEY: string; // Google Maps APIキー
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;  // カスタムマップスタイル用ID

  // Google Sheets API - POIデータ取得用
  readonly VITE_GOOGLE_SHEETS_API_KEY: string; // Sheets APIキー
  readonly VITE_GOOGLE_SPREADSHEET_ID: string; // POIデータを格納したスプレッドシートID
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * 環境変数の存在チェック用ユーティリティ型
 * GitHub Actionsでの環境変数注入の検証に役立ちます
 */
type EnvCheckResult = {
  missing: string[];
  available: string[];
};