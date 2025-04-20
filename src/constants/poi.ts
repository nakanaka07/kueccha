/**
 * POI関連の定数定義
 */
import { POIType } from '@/types/poi-types'; // 型定義ファイルをインポート

export const DEFAULT_LAT = 38.0317; // 佐渡島の中心緯度
export const DEFAULT_LNG = 138.3698; // 佐渡島の中心経度
export const MAX_DEBUG_DATA_LENGTH = 200; // デバッグログに出力するデータの最大文字数

/**
 * 正規表現定数の定義
 * 繰り返し使用する正規表現を事前にコンパイルしてパフォーマンスを向上
 */
export const WKT_REGEX = /POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i;
export const WHITESPACE_REGEX = /\s+/g;

// POI種類に対応するキーワードのマッピング定数
// 外部に露出せずジャンル判定に内部的に使用
export const POI_TYPE_PATTERNS: Record<POIType, string[]> = {
  restaurant: [
    '食堂',
    'レストラン',
    'カフェ',
    '喫茶',
    '居酒屋',
    'バー',
    'スナック',
    '宿',
    'ホテル',
    '旅館',
    '食事',
    'ランチ',
  ],
  parking: ['駐車場', 'パーキング'],
  toilet: ['トイレ', '手洗い', 'お手洗い', 'WC', '化粧室'],
  attraction: ['観光', '名所', '史跡', '旧跡', '神社', '寺院', '公園'],
  shop: ['スーパー', 'コンビニ', 'パン', '店', '販売', 'ショップ', '物産'],
  other: [], // デフォルト用（空配列）
};
