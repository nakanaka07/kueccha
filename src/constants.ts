export const AREAS = {
  RECOMMEND: 'おすすめ',
  RYOTSU_AIKAWA: '両津・相川地区',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '金井・佐和田・新穂・畑野・真野地区',
  AKADOMARI_HAMOCHI_OGI: '赤泊・羽茂・小木地区',
  SNACK: 'スナック',
  PUBLIC_TOILET: '公共トイレ',
  PARKING: '駐車場',
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
  DEFAULT: '#000000',
  RECOMMEND: '#ff0000',
  RYOTSU_AIKAWA: '#ff8000',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '#ff8000',
  AKADOMARI_HAMOCHI_OGI: '#ff8000',
  SNACK: '#ff80c0',
  PUBLIC_TOILET: '#00ffff',
  PARKING: '#000000',
} as const;

export const ERROR_MESSAGES = {
  MAP: {
    LOAD_FAILED: 'マップの読み込みに失敗しました',
    RETRY_MESSAGE: 'しばらく経ってから再度お試しください',
  },
  DATA: {
    FETCH_FAILED: 'データの取得に失敗しました',
    LOADING_FAILED: 'データの読み込みに失敗しました',
  },
  CONFIG: {
    MISSING: '必要な設定が不足しています',
    INVALID: '設定が正しくありません',
  },
  SYSTEM: {
    UNKNOWN: '予期せぬエラーが発生しました',
    CONTAINER_NOT_FOUND: 'コンテナ要素が見つかりません',
  },
  LOADING: {
    MAP: 'マップを読み込んでいます...',
    DATA: '読み込み中...',
  },
} as const;