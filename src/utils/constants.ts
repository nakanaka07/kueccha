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

// エリアの定数
export const AREAS = {
  AKADOMARI_HAMOCHI_OGI: '赤泊・羽茂・小木地区',
  CURRENT_LOCATION: '現在地',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '金井・佐和田・新穂・畑野・真野地区',
  PARKING: '駐車場',
  PUBLIC_TOILET: '公共トイレ',
  RECOMMEND: 'おすすめ',
  RYOTSU_AIKAWA: '両津・相川地区',
  SNACK: 'スナック',
} as const;

// 営業時間の定数
export const BUSINESS_HOURS = [
  { day: '月', key: 'monday' },
  { day: '火', key: 'tuesday' },
  { day: '水', key: 'wednesday' },
  { day: '木', key: 'thursday' },
  { day: '金', key: 'friday' },
  { day: '土', key: 'saturday' },
  { day: '日', key: 'sunday' },
  { day: '祝', key: 'holiday' },
] as const;

// 情報ウィンドウの営業時間の定数
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

// マーカーの色の定数
export const MARKER_COLORS = {
  AKADOMARI_HAMOCHI_OGI: '#007b43',
  CURRENT_LOCATION: '#42a30f',
  DEFAULT: '#000000',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '#ec6800',
  PARKING: '#333333',
  PUBLIC_TOILET: '#2792c3',
  RECOMMEND: '#d7003a',
  RYOTSU_AIKAWA: '#d9a62e',
  SNACK: '#65318e',
} as const;

// エラーメッセージの定数
export const ERROR_MESSAGES = {
  CONFIG: {
    INVALID: '設定が正しくありません',
    MISSING: '必要な設定が不足しています',
  },
  DATA: {
    FETCH_FAILED: 'データの取得に失敗しました',
    LOADING_FAILED: 'データの読み込みに失敗しました',
  },
  LOADING: {
    DATA: '読み込み中...',
    MAP: 'マップを読み込んでいます...',
  },
  MAP: {
    LOAD_FAILED: 'マップの読み込みに失敗しました',
    RETRY_MESSAGE: 'しばらく経ってから再度お試しください',
  },
  SYSTEM: {
    CONTAINER_NOT_FOUND: 'コンテナ要素が見つかりません',
    UNKNOWN: '予期せぬエラーが発生しました',
  },
  FORM: {
    EMPTY_MESSAGE: 'メッセージを入力してください。',
    INVALID_EMAIL: '有効なメールアドレスを入力してください。',
    SUBMISSION_FAILED: '送信に失敗しました。もう一度お試しください。',
  },
} as const;

// 現在地のPOIの定数
export const CURRENT_LOCATION_POI: Omit<Poi, 'location'> = {
  id: 'current-location',
  name: '現在地',
  area: 'CURRENT_LOCATION' as AreaType,
  category: '現在地',
  genre: '現在地',
};

// マーカーのアイコンの定数
export const MARKER_ICONS: Record<string, string> = {
  RYOTSU_AIKAWA: ryotsuAikawaIcon,
  KANAI_SAWADA_NIIBO_HATANO_MANO: kanaiSawadaNiiboHatanoManoIcon,
  AKADOMARI_HAMOCHI_OGI: akadomariHamochiOgiIcon,
  RECOMMEND: recommendIcon,
  SNACK: snackIcon,
  PUBLIC_TOILET: publicToiletIcon,
  PARKING: parkingIcon,
  CURRENT_LOCATION: currentLocationIcon,
  DEFAULT: defaultIcon,
};

// メニューアイテムの定数
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

// 初期表示の定数
export const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.keys(
  AREAS,
).reduce(
  (acc, area) => ({
    ...acc,
    [area]:
      area !== 'RECOMMEND' &&
      area !== 'SNACK' &&
      area !== 'PUBLIC_TOILET' &&
      area !== 'PARKING' &&
      area !== 'CURRENT_LOCATION',
  }),
  {} as Record<AreaType, boolean>,
);

// マーカーの設定の定数
export const markerConfig = {
  colors: MARKER_COLORS,
  icons: MARKER_ICONS,
};
