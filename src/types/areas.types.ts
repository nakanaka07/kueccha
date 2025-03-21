/**
 * エリア関連の型定義ファイル
 * 佐渡島内のエリア分類、フィルタリング、表示管理に関する型を定義
 */

/**
 * エリアのカテゴリ
 */
export enum AreaCategory {
  REGION = 'region', // 地理的な地域（佐渡島内の区分）
  FACILITY = 'facility', // 施設タイプ（スナック、トイレなど）
  SPECIAL = 'special', // 特殊表示（おすすめ、現在地など）
}

/**
 * 地理的エリア（佐渡島の地理的区分）
 */
export type RegionAreaType =
  | 'RYOTSU_AIKAWA' // 両津・相川エリア
  | 'KANAI_SAWADA_NIIBO_HATANO_MANO' // 金井・佐和田・新穂・畑野・真野エリア
  | 'AKADOMARI_HAMOCHI_OGI'; // 赤泊・羽茂・小木エリア

/**
 * 施設タイプ
 */
export type FacilityAreaType = 'SNACK' | 'PUBLIC_TOILET' | 'PARKING';

/**
 * 特殊表示エリア
 */
export type SpecialAreaType = 'RECOMMEND' | 'CURRENT_LOCATION';

/**
 * すべてのエリア識別子
 */
export type AreaType = RegionAreaType | FacilityAreaType | SpecialAreaType;

/**
 * エリアフィルター用
 */
export type AreaCategoryFilter = keyof typeof AreaCategory | undefined;

/**
 * エリアの詳細情報
 */
export interface AreaInfo {
  id: AreaType; // エリアの識別子
  displayName: string; // エリアの表示名
  category: AreaCategory; // エリアのカテゴリ
  description?: string; // エリアの説明
  iconUrl?: string; // エリアアイコンのURL
  center?: { lat: number; lng: number }; // 地図上の中心座標
  color?: string; // エリアの色（マーカーやUIでの表示色）
}

/**
 * エリアの表示/非表示状態
 * 各エリア識別子をキーとし、表示状態（true/false）を値とするレコード
 */
export type AreaVisibility = Record<AreaType, boolean>;

/**
 * エリアIDからカテゴリを判定する関数の型
 */
export type GetAreaCategoryFn = (areaId: AreaType) => AreaCategory;

/**
 * エリアリストをカテゴリでグループ化した結果
 * カテゴリごとにエリア情報の配列を持つマップ
 */
export type AreasByCategory = {
  [key in AreaCategory]: AreaInfo[];
};

/**
 * エリアデータの定数キー型
 * constants/areas.constantsで定義されているAREASオブジェクトのキーの型
 */
export type AreaRecordKey = keyof typeof import('../constants/areas.constants').AREAS;
