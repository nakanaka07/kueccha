// エリアの定数を定義
export const AREAS = {
  RECOMMEND: 'おすすめ', // おすすめエリア
  RYOTSU_AIKAWA: '両津・相川地区', // 両津・相川地区
  KANAI_SAWADA_NIIBO_HATANO_MANO: '金井・佐和田・新穂・畑野・真野地区', // 金井・佐和田・新穂・畑野・真野地区
  AKADOMARI_HAMOCHI_OGI: '赤泊・羽茂・小木地区', // 赤泊・羽茂・小木地区
  SNACK: 'スナック', // スナック
  PUBLIC_TOILET: '公共トイレ', // 公共トイレ
  PARKING: '駐車場', // 駐車場
  CURRENT_LOCATION: '現在地', // 現在地エリアを追加
} as const;

// 営業時間の定数を定義
export const BUSINESS_HOURS = [
  { day: '月', key: 'monday' }, // 月曜日
  { day: '火', key: 'tuesday' }, // 火曜日
  { day: '水', key: 'wednesday' }, // 水曜日
  { day: '木', key: 'thursday' }, // 木曜日
  { day: '金', key: 'friday' }, // 金曜日
  { day: '土', key: 'saturday' }, // 土曜日
  { day: '日', key: 'sunday' }, // 日曜日
  { day: '祝', key: 'holiday' }, // 祝日
] as const;

// マーカーの色の定数を定義
export const MARKER_COLORS = {
  DEFAULT: '#000000', // デフォルトのマーカー色
  RECOMMEND: '#d7003a', // おすすめエリアのマーカー色
  RYOTSU_AIKAWA: '#d9a62e', // 両津・相川地区のマーカー色
  KANAI_SAWADA_NIIBO_HATANO_MANO: '#ec6800', // 金井・佐和田・新穂・畑野・真野地区のマーカー色
  AKADOMARI_HAMOCHI_OGI: '#007b43', // 赤泊・羽茂・小木地区のマーカー色
  SNACK: '#65318e', // スナックのマーカー色
  PUBLIC_TOILET: '#2792c3', // 公共トイレのマーカー色
  PARKING: '#333333', // 駐車場のマーカー色
  CURRENT_LOCATION: '#ff0000', // 現在地のマーカー色を追加
} as const;

// エラーメッセージの定数を定義
export const ERROR_MESSAGES = {
  MAP: {
    LOAD_FAILED: 'マップの読み込みに失敗しました', // マップの読み込み失敗メッセージ
    RETRY_MESSAGE: 'しばらく経ってから再度お試しください', // 再試行メッセージ
  },
  DATA: {
    FETCH_FAILED: 'データの取得に失敗しました', // データ取得失敗メッセージ
    LOADING_FAILED: 'データの読み込みに失敗しました', // データ読み込み失敗メッセージ
  },
  CONFIG: {
    MISSING: '必要な設定が不足しています', // 設定不足メッセージ
    INVALID: '設定が正しくありません', // 設定無効メッセージ
  },
  SYSTEM: {
    UNKNOWN: '予期せぬエラーが発生しました', // 不明なエラーメッセージ
    CONTAINER_NOT_FOUND: 'コンテナ要素が見つかりません', // コンテナ要素が見つからないメッセージ
  },
  LOADING: {
    MAP: 'マップを読み込んでいます...', // マップ読み込み中メッセージ
    DATA: '読み込み中...', // データ読み込み中メッセージ
  },
} as const;

export const markerConfig = {
  colors: {
    PARKING: '#333333', // 駐車場のマーカー色
    CURRENT_LOCATION: '#ff0000', // 現在地のマーカー色を追加
  },
};
