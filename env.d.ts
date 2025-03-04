/// <reference types="vite/client" />
// Viteのクライアント型定義を参照します。
// これにより、Viteの特定の型定義がプロジェクト内で利用可能になります。

// 環境変数の型定義
interface ImportMetaEnv {
  readonly VITE_EMAILJS_PUBLIC_KEY: string; // EmailJSのパブリックキー
  readonly VITE_EMAILJS_SERVICE_ID: string; // EmailJSのサービスID
  readonly VITE_EMAILJS_TEMPLATE_ID: string; // EmailJSのテンプレートID
  readonly VITE_GOOGLE_MAPS_API_KEY: string; // Google MapsのAPIキー
  readonly VITE_GOOGLE_MAPS_MAP_ID: string; // Google MapsのマップID
  readonly VITE_GOOGLE_SHEETS_API_KEY: string; // Google SheetsのAPIキー
  readonly VITE_GOOGLE_SPREADSHEET_ID: string; // Google SheetsのスプレッドシートID
}

// ImportMetaの型定義
interface ImportMeta {
  readonly env: ImportMetaEnv; // 環境変数を含むenvプロパティ
  // ImportMetaEnvインターフェースを使用して、環境変数の型を定義します。
  // これにより、環境変数にアクセスする際に型安全性が保証されます。
}
