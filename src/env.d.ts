/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string; // Google Maps API Key
  readonly VITE_GOOGLE_MAPS_MAP_ID: string; // Google Maps Map ID
  readonly VITE_GOOGLE_SHEETS_API_KEY: string; // Google Sheets API Key
  readonly VITE_GOOGLE_SPREADSHEET_ID: string; // Google Spreadsheet ID
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
