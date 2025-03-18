/**
 * POI（ポイントオブインタレスト）関連の定数ファイル
 *
 * マップ上のPOI表示や検索に関する定数値を定義します。
 * POIのジャンル、表示スタイル、多言語表示名などを含みます。
 */

import { getCurrentLanguage } from './i18n.constants';
import { getEnvValueAsNumber, getEnvValueAsBoolean } from '../utils/env.utils';

import type { PoiGenre, BusinessHourKey, MarkerDisplayOptions, Poi } from '../types/poi.types';

// ============================================================================
// POIジャンル定義
// ============================================================================

/**
 * POIジャンルの表示名
 * UIでの表示に使用される各ジャンルの名称（多言語対応）
 */
export const POI_GENRE_DISPLAY_NAMES: Record<PoiGenre, Record<string, string>> = {
  restaurant: {
    ja: '飲食店',
    en: 'Restaurant',
  },
  cafe: {
    ja: 'カフェ',
    en: 'Cafe',
  },
  shop: {
    ja: 'ショップ',
    en: 'Shop',
  },
  attraction: {
    ja: '観光スポット',
    en: 'Attraction',
  },
  facility: {
    ja: '公共施設',
    en: 'Facility',
  },
  current_location: {
    ja: '現在地',
    en: 'Current Location',
  },
  other: {
    ja: 'その他',
    en: 'Other',
  },
};

/**
 * ジャンル表示名を取得する
 * 現在の言語設定に基づいて適切な表示名を返します
 *
 * @param genre ジャンル識別子
 * @returns ローカライズされたジャンル名
 */
export function getGenreDisplayName(genre: PoiGenre): string {
  const lang = getCurrentLanguage();
  return POI_GENRE_DISPLAY_NAMES[genre][lang] || POI_GENRE_DISPLAY_NAMES[genre].en;
}

/**
 * POIジャンルの検索優先度
 * 検索結果の関連性スコア計算や並び替えに使用
 */
export const POI_GENRE_PRIORITY: Record<PoiGenre, number> = {
  attraction: 100,
  restaurant: 90,
  cafe: 85,
  shop: 80,
  facility: 70,
  current_location: 110, // 通常は検索対象外だが、最高優先度
  other: 50,
};

// ============================================================================
// マーカー表示設定
// ============================================================================

/**
 * マーカーのデフォルトアニメーション設定
 */
export const MARKER_ANIMATIONS = {
  NONE: 'NONE',
  BOUNCE: 'BOUNCE',
  DROP: 'DROP',
} as const;

/**
 * ジャンルごとのデフォルトマーカー設定
 * 各POIのデフォルトスタイルをジャンルごとに定義
 */
export const DEFAULT_MARKER_OPTIONS: Record<PoiGenre, MarkerDisplayOptions> = {
  restaurant: {
    icon: '/assets/icons/restaurant.png',
    color: '#FF5722',
    opacity: 0.9,
    animation: 'NONE',
    zIndex: 10,
  },
  cafe: {
    icon: '/assets/icons/cafe.png',
    color: '#795548',
    opacity: 0.9,
    animation: 'NONE',
    zIndex: 10,
  },
  shop: {
    icon: '/assets/icons/shop.png',
    color: '#3F51B5',
    opacity: 0.9,
    animation: 'NONE',
    zIndex: 10,
  },
  attraction: {
    icon: '/assets/icons/attraction.png',
    color: '#4CAF50',
    opacity: 0.9,
    animation: 'NONE',
    zIndex: 20,
  },
  facility: {
    icon: '/assets/icons/facility.png',
    color: '#9E9E9E',
    opacity: 0.9,
    animation: 'NONE',
    zIndex: 5,
  },
  current_location: {
    icon: '/assets/icons/current_location.png',
    color: '#2196F3',
    opacity: 1.0,
    animation: 'NONE',
    zIndex: 100,
  },
  other: {
    icon: '/assets/icons/other.png',
    color: '#607D8B',
    opacity: 0.8,
    animation: 'NONE',
    zIndex: 1,
  },
};

/**
 * 選択状態のマーカー設定
 * POIが選択された際に適用される表示スタイル
 */
export const SELECTED_MARKER_OPTIONS: Partial<MarkerDisplayOptions> = {
  opacity: 1.0,
  animation: 'BOUNCE',
  zIndex: 1000,
};

/**
 * POIジャンルに基づいてマーカー設定を取得
 * デフォルト設定と個別設定をマージします
 *
 * @param genre POIジャンル
 * @param customOptions オプションの個別設定
 * @returns マージされたマーカー表示設定
 */
export function getMarkerOptionsForGenre(
  genre: PoiGenre,
  customOptions?: Partial<MarkerDisplayOptions>,
): MarkerDisplayOptions {
  return {
    ...DEFAULT_MARKER_OPTIONS[genre],
    ...customOptions,
  };
}

// ============================================================================
// 営業時間表示
// ============================================================================

/**
 * 曜日の表示順序
 * 営業時間の表示順序を制御します
 */
export const BUSINESS_HOUR_DISPLAY_ORDER: BusinessHourKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
  'holiday',
];

/**
 * 営業時間キーの表示名（日本語）
 */
export const BUSINESS_HOUR_LABELS_JA: Record<BusinessHourKey, string> = {
  monday: '月曜日',
  tuesday: '火曜日',
  wednesday: '水曜日',
  thursday: '木曜日',
  friday: '金曜日',
  saturday: '土曜日',
  sunday: '日曜日',
  holiday: '祝日',
};

/**
 * 営業時間キーの表示名（英語）
 */
export const BUSINESS_HOUR_LABELS_EN: Record<BusinessHourKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  holiday: 'Holidays',
};

/**
 * 曜日キーから表示名を取得
 * 現在の言語設定に基づいて適切な表示名を返します
 *
 * @param key 曜日キー
 * @returns ローカライズされた曜日名
 */
export function getBusinessHourLabel(key: BusinessHourKey): string {
  const lang = getCurrentLanguage();
  return lang === 'ja' ? BUSINESS_HOUR_LABELS_JA[key] : BUSINESS_HOUR_LABELS_EN[key];
}

/**
 * 営業時間項目の生成
 * 表示用の営業時間項目を現在の言語設定で生成します
 */
export function createBusinessHourItems(): { day: string; key: BusinessHourKey }[] {
  return BUSINESS_HOUR_DISPLAY_ORDER.map((key) => ({
    day: getBusinessHourLabel(key),
    key,
  }));
}

// ============================================================================
// 詳細情報表示
// ============================================================================

/**
 * POI詳細情報の表示順序
 * 情報ウィンドウでのフィールド表示順を定義
 */
export const POI_DETAIL_DISPLAY_ORDER: (keyof Poi)[] = [
  'name',
  'category',
  'businessHours',
  'holidayInfo',
  'phone',
  'address',
  'parking',
  'payment',
  'information',
  'detailUrl',
];

/**
 * POI詳細フィールドラベル（日本語）
 */
export const POI_FIELD_LABELS_JA: Partial<Record<keyof Poi, string>> = {
  name: '名称',
  category: 'カテゴリ',
  businessHours: '営業時間',
  holidayInfo: '定休日',
  phone: '電話番号',
  address: '住所',
  parking: '駐車場',
  payment: '支払い方法',
  information: '追加情報',
  detailUrl: '詳細情報',
  genre: 'ジャンル',
  area: 'エリア',
};

/**
 * POI詳細フィールドラベル（英語）
 */
export const POI_FIELD_LABELS_EN: Partial<Record<keyof Poi, string>> = {
  name: 'Name',
  category: 'Category',
  businessHours: 'Business Hours',
  holidayInfo: 'Closed On',
  phone: 'Phone',
  address: 'Address',
  parking: 'Parking',
  payment: 'Payment Methods',
  information: 'Additional Info',
  detailUrl: 'More Details',
  genre: 'Genre',
  area: 'Area',
};

/**
 * POIフィールドの表示ラベルを取得
 * 現在の言語設定に基づいて適切なラベルを返します
 *
 * @param field POIフィールド名
 * @returns ローカライズされたフィールドラベル
 */
export function getPoiFieldLabel(field: keyof Poi): string {
  const lang = getCurrentLanguage();
  const labels = lang === 'ja' ? POI_FIELD_LABELS_JA : POI_FIELD_LABELS_EN;
  return labels[field] || String(field);
}

// ============================================================================
// 検索関連設定
// ============================================================================

/**
 * POI検索の最小関連性スコア
 * これ未満のスコアの検索結果は表示されません
 */
export const MIN_SEARCH_RELEVANCE_SCORE = getEnvValueAsNumber('VITE_MIN_SEARCH_RELEVANCE', 30);

/**
 * 検索結果の最大数
 * 一度に表示する検索結果の上限
 */
export const MAX_SEARCH_RESULTS = getEnvValueAsNumber('VITE_MAX_SEARCH_RESULTS', 50);

/**
 * 検索フィールドの重み付け
 * 各フィールドの検索における重要度
 */
export const SEARCH_FIELD_WEIGHTS: Partial<Record<keyof Poi, number>> = {
  name: 100,
  category: 80,
  keywords: 90,
  address: 40,
  information: 30,
  genre: 60,
  area: 50,
};

/**
 * 現在地POIの定義
 * ユーザーの現在位置を表すPOIのテンプレート
 */
export const CURRENT_LOCATION_POI_TEMPLATE: Omit<Poi, 'location'> = {
  id: 'current-location',
  name: getCurrentLanguage() === 'ja' ? '現在地' : 'Current Location',
  area: 'CURRENT_LOCATION',
  genre: 'current_location',
  category: getCurrentLanguage() === 'ja' ? '現在地' : 'Current Location',
  createdAt: new Date(),
  updatedAt: new Date(),
  markerOptions: DEFAULT_MARKER_OPTIONS.current_location,
};

/**
 * POI検索のデバッグモード
 * デバッグ情報を表示するかどうか
 */
export const DEBUG_SEARCH = getEnvValueAsBoolean('VITE_DEBUG_SEARCH', false);
