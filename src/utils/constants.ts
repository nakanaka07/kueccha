// 画像のインポート
// 各エリアや機能に対応するアイコン画像をインポートします。
import { LoadScriptProps } from '@react-google-maps/api';
import publicToiletIcon from './images/ano_icon01.png';
import recommendIcon from './images/ano_icon_recommend.png';
import ryotsuAikawaIcon from './images/icon_map01.png';
import kanaiSawadaNiiboHatanoManoIcon from './images/icon_map02.png';
import akadomariHamochiOgiIcon from './images/icon_map03.png';
import defaultIcon from './images/row2.png';
import parkingIcon from './images/shi_icon01.png';
import snackIcon from './images/shi_icon02.png';
import currentLocationIcon from './images/shi_icon04.png';
import type { AreaType, Poi, MenuItem } from './types'; // 型定義をインポートします。

// エリアの定数
// 各エリアの名前を定義します。
export const AREAS = {
  RECOMMEND: 'おすすめ',
  RYOTSU_AIKAWA: '両津・相川地区',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '金井・佐和田・新穂・畑野・真野地区',
  AKADOMARI_HAMOCHI_OGI: '赤泊・羽茂・小木地区',
  SNACK: 'スナック',
  PUBLIC_TOILET: '公共トイレ',
  PARKING: '駐車場',
  CURRENT_LOCATION: '現在地',
} as const; // 定数としてエリア名を定義し、変更不可にします。

// 情報ウィンドウの営業時間の定数
// 情報ウィンドウに表示する各曜日とそのキーを定義します。
export const INFO_WINDOW_BUSINESS_HOURS = [
  { day: '月曜日', key: 'monday' },
  { day: '火曜日', key: 'tuesday' },
  { day: '水曜日', key: 'wednesday' },
  { day: '木曜日', key: 'thursday' },
  { day: '金曜日', key: 'friday' },
  { day: '土曜日', key: 'saturday' },
  { day: '日曜日', key: 'sunday' },
  { day: '祝祭日', key: 'holiday' },
] as const; // 定数として曜日とそのキーを定義し、変更不可にします。

// マーカーの色の定数
// 各エリアに対応するマーカーの色を定義します。
export const MARKER_COLORS = {
  DEFAULT: '#000000',
  RECOMMEND: '#d7003a',
  RYOTSU_AIKAWA: '#d9a62e',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '#ec6800',
  AKADOMARI_HAMOCHI_OGI: '#007b43',
  SNACK: '#65318e',
  PUBLIC_TOILET: '#2792c3',
  PARKING: '#333333',
  CURRENT_LOCATION: '#42a30f',
} as const; // 定数としてマーカーの色を定義し、変更不可にします。

// エラーメッセージの定数
// 各種エラーメッセージを定義します。
export const ERROR_MESSAGES = {
  CONFIG: {
    INVALID: '設定が正しくありません。設定を確認してください。',
    MISSING: '必要な設定が不足しています。設定を追加してください。',
  },
  DATA: {
    FETCH_FAILED: 'データの取得に失敗しました。ネットワーク接続を確認してください。',
    LOADING_FAILED: 'データの読み込みに失敗しました。再試行してください。',
  },
  LOADING: {
    DATA: 'データを読み込み中です。しばらくお待ちください。',
    MAP: 'マップを読み込み中です。しばらくお待ちください。',
  },
  MAP: {
    LOAD_FAILED: 'Google Maps の読み込みに失敗しました。再試行してください。',
    CONFIG_MISSING: 'Google Maps の設定が不完全です。API キーとMap IDを確認してください。',
    RETRY_MESSAGE: 'しばらく経ってから再度お試しください。',
  },
  SYSTEM: {
    CONTAINER_NOT_FOUND: 'コンテナ要素が見つかりません。ページをリロードしてください。',
    UNKNOWN: '予期せぬエラーが発生しました。サポートに連絡してください。',
  },
  FORM: {
    EMPTY_NAME: '名前を入力してください。',
    EMPTY_MESSAGE: 'メッセージを入力してください。',
    INVALID_EMAIL: '有効なメールアドレスを入力してください。',
    SUBMISSION_FAILED: '送信に失敗しました。もう一度お試しください。',
  },
  ERROR_BOUNDARY: {
    UNKNOWN_ERROR: 'エラーが発生しました。ページをリロードしてください。',
    RETRY_BUTTON: '再試行',
  },
  GEOLOCATION: {
    PERMISSION_DENIED: '位置情報の取得が許可されていません',
    POSITION_UNAVAILABLE: '位置情報が利用できません',
    TIMEOUT: '位置情報の取得がタイムアウトしました',
    UNKNOWN: '未知のエラーが発生しました',
  },
} as const; // 定数としてエラーメッセージを定義し、変更不可にします。

// 現在地のPOIの定数
// 現在地を表すPOIオブジェクトを定義します。
export const CURRENT_LOCATION_POI: Omit<Poi, 'location'> = {
  id: 'current-location',
  name: '現在地',
  area: 'CURRENT_LOCATION' as AreaType,
  category: '現在地',
  genre: '現在地',
}; // 現在地のPOIオブジェクトを定義し、locationプロパティを除外します。

// マーカーのアイコンの定数
// 各エリアに対応するマーカーのアイコンを定義します。
export const MARKER_ICONS: Record<string, string> = {
  DEFAULT: defaultIcon,
  RECOMMEND: recommendIcon,
  RYOTSU_AIKAWA: ryotsuAikawaIcon,
  KANAI_SAWADA_NIIBO_HATANO_MANO: kanaiSawadaNiiboHatanoManoIcon,
  AKADOMARI_HAMOCHI_OGI: akadomariHamochiOgiIcon,
  SNACK: snackIcon,
  PUBLIC_TOILET: publicToiletIcon,
  PARKING: parkingIcon,
  CURRENT_LOCATION: currentLocationIcon,
}; // 各エリアに対応するマーカーのアイコンを定義します。

// メニューアイテムの定数
// メニューに表示するアイテムを定義します。
export const MENU_ITEMS: MenuItem[] = [
  {
    label: '表示するエリアを選択',
    title: '表示するエリアを選択',
    action: 'handleAreaClick',
  },
  {
    label: 'フィードバック',
    title: 'フィードバック',
    action: 'handleFeedbackClick',
  },
  {
    label: '検索',
    title: '検索',
    action: 'toggleSearchBar',
  },
]; // メニューに表示するアイテムを定義します。

// 初期表示の定数
// 各エリアの初期表示状態を定義します。
export const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.keys(AREAS).reduce(
  (acc, area) => ({
    ...acc,
    [area]: area !== 'SNACK' && area !== 'PUBLIC_TOILET' && area !== 'PARKING' && area !== 'CURRENT_LOCATION',
  }),
  {} as Record<AreaType, boolean>,
); // 各エリアの初期表示状態を定義し、特定のエリアは非表示にします。

// マーカーの設定の定数
// マーカーの色とアイコンの設定を定義します。
export const MARKER_CONFIG = {
  colors: MARKER_COLORS,
  icons: MARKER_ICONS,
}; // マーカーの色とアイコンの設定を定義します。

// ローディングの遅延時間の定数
// ローディングの遅延時間を定義します。
export const LOADING_DELAY = 0; // ローディングの遅延時間を0に設定します。
export const BACKGROUND_HIDE_DELAY = 1000; // 背景を非表示にする遅延時間を1000msに設定します。

// マップの設定の定数
// マップの各種設定を定義します。
export const MAP_CONFIGS = {
  GEOLOCATION: {
    TIMEOUT: 10000, // 位置情報取得のタイムアウト時間を10000msに設定します。
    MAX_AGE: 0, // キャッシュの最大年齢を0に設定します。
    HIGH_ACCURACY: true, // 高精度の位置情報を取得するかどうかをtrueに設定します。
  },
  CONTROL_POSITIONS: {
    TOP_LEFT: 1, // google.maps.ControlPosition.TOP_LEFT の代わりに数値を使用します。
  },
  MAP_TYPES: ['roadmap', 'satellite', 'hybrid', 'terrain'], // 使用可能なマップタイプを定義します。
  DEFAULT_TYPE: 'roadmap', // デフォルトのマップタイプを'roadmap'に設定します。
} as const; // 定数としてマップの設定を定義し、変更不可にします。

// Google Mapsの設定
export const MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, // Google Maps APIキー
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID, // Google MapsのマップID
  defaultCenter: { lat: 38.0, lng: 138.5 }, // マップのデフォルト中心座標
  defaultZoom: 10, // マップのデフォルトズームレベル
  libraries: ['places', 'geometry', 'drawing', 'marker'] as LoadScriptProps['libraries'], // 使用するGoogle Mapsのライブラリ
  language: 'ja', // マップの言語設定
  version: 'weekly', // Google Maps APIのバージョン
  style: {
    width: '100%', // マップの幅
    height: '100%', // マップの高さ
  },
  options: {
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID, // マップID
    disableDefaultUI: false, // デフォルトUIを無効にしない
    zoomControl: true, // ズームコントロールを表示
    mapTypeControl: true, // マップタイプコントロールを表示
    streetViewControl: true, // ストリートビューコントロールを表示
    fullscreenControl: false, // フルスクリーンコントロールを表示しない
    clickableIcons: true, // アイコンをクリック可能にする
    mapTypeControlOptions: {
      style: 2, // DROPDOWN_MENU
      position: 1, // TOP_LEFT
    },
  },
};

// Google Sheetsの設定
export const SHEETS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY, // Google Sheets APIキー
  spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID, // スプレッドシートID
};
