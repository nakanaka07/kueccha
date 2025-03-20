/**
 * UI関連定数ファイル
 */
/// <reference types="@types/google.maps" />
import type { BusinessHourDayMapping } from '../types/poi.types';
import type {
  MenuItem,
  InfoWindowConfig,
  PixelOffset,
} from '../types/ui.types';

// Google Maps APIの可用性チェック
function isGoogleMapsAvailable(): boolean {
  return typeof google !== 'undefined' && 
         typeof google.maps !== 'undefined' && 
         typeof google.maps.Size === 'function';
}

// 安全なピクセルオフセット作成
function createSafePixelOffset(width: number, height: number): PixelOffset {
  if (isGoogleMapsAvailable()) {
    return new google.maps.Size(width, height);
  }
  return { width, height, equals: () => false, toString: () => `(${width}, ${height})` };
}

// 営業時間表示設定
export const INFO_WINDOW_BUSINESS_HOURS: BusinessHourDayMapping[] = [
  { day: '月曜日', key: 'monday' },
  { day: '火曜日', key: 'tuesday' },
  { day: '水曜日', key: 'wednesday' },
  { day: '木曜日', key: 'thursday' },
  { day: '金曜日', key: 'friday' },
  { day: '土曜日', key: 'saturday' },
  { day: '日曜日', key: 'sunday' },
  { day: '祝祭日', key: 'holiday' },
] as const;

// 情報ウィンドウ設定
export const INFO_WINDOW_CONFIG: InfoWindowConfig = {
  maxWidth: 320,
  pixelOffset: createSafePixelOffset(0, -40),
  closeOnMapClick: true,
  mobileAdjustment: {
    maxWidth: 280,
    scale: 0.9,
  },
};

// メニュー項目
export const MENU_ITEMS: MenuItem[] = [
  {
    label: '表示するエリアを選択',
    title: 'エリアを選択',
    action: 'onAreaSelect',
    icon: 'map-marker',
  },
  {
    label: 'フィードバック',
    title: 'フィードバック',
    action: 'onFeedbackRequest',
    icon: 'comment',
  },
  {
    label: '検索',
    title: '検索',
    action: 'onToggleSearchBar',
    icon: 'search',
  },
] as const;

// フォーム初期値
export const INITIAL_FEEDBACK_FORM = {
  name: '',
  email: '',
  message: '',
};

// 検索関連テキスト
export const SEARCH_TEXT = {
  NO_RESULTS: '該当する検索結果がありません',
  PLACEHOLDER: 'エリアやスポットを検索...',
  BUTTON: '検索',
};

// 位置情報エラーメッセージ
export const GEOLOCATION_ERROR_MESSAGES = {
  PERMISSION_DENIED: '位置情報へのアクセスが拒否されました。設定から許可してください。',
  POSITION_UNAVAILABLE: '現在地を取得できませんでした。',
  TIMEOUT: '位置情報の取得がタイムアウトしました。',
  UNKNOWN: '位置情報の取得中に不明なエラーが発生しました。',
};