/**
 * POI関連の定数定義
 *
 * このファイルには、POI（Point of Interest）関連の定数や設定値を定義しています。
 * 地図表示の初期値、正規表現パターン、POIタイプごとのキーワードマッピングなどを含みます。
 *
 * @module constants/poi
 * @version 1.2.0
 * @since 2025-04-21
 */

// POIの種類を表す型
type POIType = 'restaurant' | 'parking' | 'toilet' | 'attraction' | 'shop' | 'other';

/**
 * 地図表示の初期設定値
 * 佐渡島の中心位置を基準点として使用
 */
// 佐渡島の中心緯度（北緯）
export const DEFAULT_LAT = 38.0317;
// 佐渡島の中心経度（東経）
export const DEFAULT_LNG = 138.3698;
// ズームレベルの既定値（数値が大きいほど拡大表示）
export const DEFAULT_ZOOM = 11;

/**
 * アプリケーション設定値
 */
// デバッグログに出力するデータの最大文字数
export const MAX_DEBUG_DATA_LENGTH = 200;

/**
 * 正規表現定数の定義
 * 繰り返し使用する正規表現を事前にコンパイルしてパフォーマンスを向上
 * @see https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Regular_Expressions/Performance
 */
// WKT（Well-Known Text）形式からの座標抽出用正規表現
// 例: "POINT(138.3698 38.0317)" から [138.3698, 38.0317] を抽出
export const WKT_REGEX = /POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i;
// 連続する空白文字を削除するための正規表現
export const WHITESPACE_REGEX = /\s+/g;

/**
 * POI種類に対応するキーワードのマッピング定数
 *
 * 各POIタイプに関連するキーワードの配列。テキスト解析やPOI分類で使用。
 * 優先度順に並べられており、最初のキーワードほど重要度が高い。
 *
 * @example
 * // キーワードからPOIタイプを判定する使用例
 * function determinePOIType(description: string): POIType {
 *   for (const [type, keywords] of Object.entries(POI_TYPE_PATTERNS) as [POIType, string[]][]) {
 *     if (keywords.some(keyword => description.includes(keyword))) {
 *       return type;
 *     }
 *   }
 *   return 'other'; // デフォルト値
 * }
 */
export const POI_TYPE_PATTERNS: Readonly<Record<POIType, ReadonlyArray<string>>> = {
  restaurant: Object.freeze([
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
  ]),
  parking: Object.freeze(['駐車場', 'パーキング']),
  toilet: Object.freeze(['トイレ', '手洗い', 'お手洗い', 'WC', '化粧室']),
  attraction: Object.freeze(['観光', '名所', '史跡', '旧跡', '神社', '寺院', '公園']),
  shop: Object.freeze(['スーパー', 'コンビニ', 'パン', '店', '販売', 'ショップ', '物産']),
  other: Object.freeze([]), // デフォルト用（空配列）
};
