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
import type { AreaType, Poi, MenuItem } from './types';

export const AREAS = {
  RYOTSU_AIKAWA: '両津・相川地区',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '金井・佐和田・新穂・畑野・真野地区',
  AKADOMARI_HAMOCHI_OGI: '赤泊・羽茂・小木地区',
  SNACK: 'スナック',
  PUBLIC_TOILET: '公共トイレ',
  PARKING: '駐車場',
  RECOMMEND: 'おすすめ',
  CURRENT_LOCATION: '現在地',
} as const;

export const MARKER_COLORS = {
  DEFAULT: '#000000',
  RYOTSU_AIKAWA: '#d9a62e',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '#ec6800',
  AKADOMARI_HAMOCHI_OGI: '#007b43',
  SNACK: '#65318e',
  PUBLIC_TOILET: '#2792c3',
  PARKING: '#333333',
  RECOMMEND: '#d7003a',
  CURRENT_LOCATION: '#42a30f',
} as const;

export const MARKER_ICONS: Record<string, string> = {
  DEFAULT: defaultIcon,
  RYOTSU_AIKAWA: ryotsuAikawaIcon,
  KANAI_SAWADA_NIIBO_HATANO_MANO: kanaiSawadaNiiboHatanoManoIcon,
  AKADOMARI_HAMOCHI_OGI: akadomariHamochiOgiIcon,
  SNACK: snackIcon,
  PUBLIC_TOILET: publicToiletIcon,
  PARKING: parkingIcon,
  RECOMMEND: recommendIcon,
  CURRENT_LOCATION: currentLocationIcon,
};

export const MARKER_CONFIG = {
  colors: MARKER_COLORS,
  icons: MARKER_ICONS,
};

export const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.keys(AREAS).reduce(
  (acc, area) => ({
    ...acc,
    [area]: area !== 'SNACK' && area !== 'PUBLIC_TOILET' && area !== 'PARKING' && area !== 'CURRENT_LOCATION',
  }),
  {} as Record<AreaType, boolean>,
);

export const CURRENT_LOCATION_POI: Omit<Poi, 'location'> = {
  id: 'current-location',
  name: '現在地',
  area: 'CURRENT_LOCATION' as AreaType,
  category: '現在地',
  genre: '現在地',
};

export const INFO_WINDOW_BUSINESS_HOURS = [
  { day: '月曜日', key: 'monday' },
  { day: '火曜日', key: 'tuesday' },
  { day: '水曜日', key: 'wednesday' },
  { day: '木曜日', key: 'thursday' },
  { day: '金曜日', key: 'friday' },
  { day: '土曜日', key: 'saturday' },
  { day: '日曜日', key: 'sunday' },
  { day: '祝祭日', key: 'holiday' },
] as const;

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
];

export const LOADING_DELAY = 0;
export const BACKGROUND_HIDE_DELAY = 1000;

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
} as const;

export const MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
  libraries: ['places', 'geometry', 'drawing', 'marker'] as LoadScriptProps['libraries'],
  version: 'weekly',
  language: 'ja',
  defaultCenter: { lat: 38.1, lng: 138.4 },
  defaultZoom: 10,
  geolocation: {
    timeout: 10000,
    maxAge: 0,
    highAccuracy: true,
  },
  style: {
    width: '100%',
    height: '100%',
  },
  options: {
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
    mapTypeId: 'roadmap',
    disableDefaultUI: false,
    disableDoubleClickZoom: false,
    scrollwheel: true,
    clickableIcons: true,
    gestureHandling: 'cooperative',
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: 2,
      position: 1,
      mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
    },
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: 3,
    },
    zoomControl: true,
    zoomControlOptions: {
      position: 7,
    },
    streetViewControl: true,
    streetViewControlOptions: {
      position: 7,
    },
    cameraControl: true,
    cameraControlOptions: {
      position: 7,
    },
  },
};

export const SHEETS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
  spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
};
