/**
 * エリア関連の型定義ファイル
 */

/**
 * エリアのカテゴリ
 */
export enum AreaCategory {
  REGION = 'region',    // 地理的な地域
  FACILITY = 'facility', // 施設タイプ
  SPECIAL = 'special',   // 特殊表示
}

/**
 * 地理的エリア（佐渡島の地理的区分）
 */
export type RegionAreaType =
  | 'RYOTSU_AIKAWA'
  | 'KANAI_SAWADA_NIIBO_HATANO_MANO'
  | 'AKADOMARI_HAMOCHI_OGI';

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
  id: AreaType;             // エリアの識別子
  displayName: string;      // エリアの表示名
  category: AreaCategory;   // エリアのカテゴリ
  description?: string;     // エリアの説明
  iconUrl?: string;         // エリアアイコンのURL
  center?: { lat: number; lng: number }; // 地図上の中心座標
  color?: string;           // エリアの色
}

/**
 * エリアの表示/非表示状態
 */
export type AreaVisibility = Record<AreaType, boolean>;

/**
 * エリアIDからカテゴリを判定する関数の型
 */
export type GetAreaCategoryFn = (areaId: AreaType) => AreaCategory;

/**
 * エリアリストをカテゴリでグループ化した結果
 */
export type AreasByCategory = {
  [key in AreaCategory]: AreaInfo[];
};

/**
 * エリアデータのキー型
 */
export type AreaRecordKey = keyof typeof import('../constants/areas.constants').AREAS;