/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID: string;
  readonly VITE_GOOGLE_SPREADSHEET_ID: string;
  readonly VITE_EMAILJS_SERVICE_ID: string;
  readonly VITE_EMAILJS_TEMPLATE_ID: string;
  readonly VITE_EMAILJS_PUBLIC_KEY: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_SHORT_NAME: string;
  readonly VITE_APP_DESCRIPTION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
