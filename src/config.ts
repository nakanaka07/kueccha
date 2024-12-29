// config.ts
import { MapConfig } from './types';

export const MARKER_COLORS = {
  DEFAULT: "#000000",
  RYOTSU_AIKAWA: "#ff8000",
  KANAI_SAWADA_NIIBO_HATANO_MANO: "#ff8000",
  AKADOMARI_HAMOCHI_OGI: "#ff8000",
  SNACK: "#ff80c0",
  PUBLIC_TOILET: "#00ffff",
  PARKING: "#000000",
  RECOMMEND: "#ff0000",
} as const;

export const CONFIG = {
  maps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    defaultCenter: { lat: 38.0, lng: 138.5 },
    defaultZoom: 10,
    libraries: ["places", "geometry", "drawing", "marker"],
    language: "ja",
    version: "weekly",
    style: {
      mapContainerStyle: { width: "100%", height: "100%" },
      options: {
        disableDefaultUI: false,
        clickableIcons: false,
      },
    },
  } as MapConfig,
  sheets: {
    apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
    spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
  },
  markers: {
    colors: {
      default: MARKER_COLORS.DEFAULT,
      areas: MARKER_COLORS,
    },
  },
} as const;


// apiKeyが設定されているか確認
if (CONFIG.maps.apiKey) {
  console.log("Google Maps API Keyが読み込まれました。");
  const apiKeyPreview = "******" + CONFIG.maps.apiKey.slice(-7);
  console.log("API Keyの一部:", apiKeyPreview);
} else {
  console.error("Google Maps API Keyが設定されていません。");
}

if (CONFIG.maps.mapId) {
  console.log("Google Maps Map IDが読み込まれました。");
  const mapIdPreview = "******" + CONFIG.maps.mapId.slice(-7);
  console.log("Map IDの一部:", mapIdPreview);
} else {
  console.error("Google Maps Map IDが設定されていません。");
}



if (CONFIG.sheets.apiKey) {
  console.log("Google Sheets API Keyが読み込まれました。");
  const apiKeyPreview = "******" + CONFIG.sheets.apiKey.slice(-7);
  console.log("API Keyの一部:", apiKeyPreview);
} else {
  console.error("Google Sheets API Keyが設定されていません。");
}

if (CONFIG.sheets.spreadsheetId) {
  console.log("Google Sheets Spreadsheet IDが読み込まれました。");
  const spreadsheetIdPreview = "******" + CONFIG.sheets.spreadsheetId.slice(-7);
  console.log("Spreadsheet IDの一部:", spreadsheetIdPreview);
} else {
  console.error("Google Sheets Spreadsheet IDが設定されていません。");
}

