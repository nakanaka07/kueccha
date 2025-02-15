import type { Poi } from './types';

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
} as const;

export const CURRENT_LOCATION_POI: Omit<Poi, 'location'> = {
  id: 'current-location',
  name: '現在地',
  area: 'CURRENT_LOCATION',
  category: '',
  genre: '',
  monday: '',
  tuesday: '',
  wednesday: '',
  thursday: '',
  friday: '',
  saturday: '',
  sunday: '',
  holiday: '',
  holidayInfo: '',
  information: '',
  view: '',
  phone: '',
  address: '',
  parking: '',
  payment: '',
};
