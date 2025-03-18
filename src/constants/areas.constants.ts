/**
 * エリア関連定数ファイル
 *
 * マップ上で表示される地区やカテゴリの定義、および初期表示設定を含みます。
 */

import {
  AreaType,
  RegionAreaType,
  FacilityAreaType,
  SpecialAreaType,
  AreaCategory,
  AreaCategoryFilter,
  GetAreaCategoryFn,
} from '../types/areas.types';

import type { Poi } from '../types/poi.types';

// ============================================================================
// エリア定義
// ============================================================================

/**
 * デフォルトで非表示のエリア
 *
 * マップ初期表示時に非表示にするエリアのリスト。
 */
const INITIALLY_HIDDEN_AREAS: readonly AreaType[] = ['SNACK', 'PUBLIC_TOILET', 'PARKING', 'CURRENT_LOCATION'] as const;

/**
 * 地理的エリアの定義
 * RegionAreaType と対応する地理的地域区分を定義します。
 */
export const GEOGRAPHIC_AREAS: Record<RegionAreaType, string> = {
  // 佐渡島北東部
  RYOTSU_AIKAWA: '両津・相川地区',

  // 佐渡島中部
  KANAI_SAWADA_NIIBO_HATANO_MANO: '金井・佐和田・新穂・畑野・真野地区',

  // 佐渡島南西部
  AKADOMARI_HAMOCHI_OGI: '赤泊・羽茂・小木地区',
} as const;

/**
 * 施設カテゴリの定義
 * FacilityAreaType および SpecialAreaType と対応する施設タイプを定義します。
 */
export const FACILITY_CATEGORIES: Record<FacilityAreaType | SpecialAreaType, string> = {
  // 施設タイプ
  SNACK: 'スナック',
  PUBLIC_TOILET: '公共トイレ',
  PARKING: '駐車場',

  // 特殊表示タイプ
  RECOMMEND: 'おすすめ',
  CURRENT_LOCATION: '現在地',
} as const;

/**
 * 特殊表示エリアの定義
 * 特殊な表示目的のエリアを明示的に分離
 */
export const SPECIAL_AREAS: Record<SpecialAreaType, string> = {
  RECOMMEND: FACILITY_CATEGORIES.RECOMMEND,
  CURRENT_LOCATION: FACILITY_CATEGORIES.CURRENT_LOCATION,
} as const;

/**
 * すべてのエリア定義
 * 地理的エリアと施設カテゴリを統合したすべてのエリア定義。
 */
export const AREAS: Record<AreaType, string> = {
  ...GEOGRAPHIC_AREAS,
  ...FACILITY_CATEGORIES,
} as const;

// ============================================================================
// POI定義と初期設定
// ============================================================================

/**
 * 現在地のPOI（地点情報）定義
 *
 * ユーザーの現在地を表すPOIオブジェクトの定義です。
 * locationプロパティは実行時に現在の位置情報から設定されるため、ここでは除外しています。
 */
export const CURRENT_LOCATION_POI: Omit<Poi, 'location'> = {
  id: 'current-location',
  name: '現在地',
  area: 'CURRENT_LOCATION',
  category: '現在地',
  genre: '現在地',
};

/**
 * 環境変数または設定から初期表示設定を取得
 *
 * @param area エリア識別子
 * @returns そのエリアが初期表示されるかどうか
 */
function getInitialVisibility(area: AreaType): boolean {
  // 環境変数から取得する場合は、以下のようなコードを使用できます
  // const envKey = `VITE_INITIAL_VISIBILITY_${area}`;
  // const envValue = import.meta.env[envKey];
  // return envValue !== undefined ? envValue === 'true' : !INITIALLY_HIDDEN_AREAS.includes(area);

  return !INITIALLY_HIDDEN_AREAS.includes(area);
}

/**
 * エリアの初期表示設定
 *
 * マップ初期表示時に、どのエリアのマーカーを表示するかの設定です。
 */
export const INITIAL_VISIBILITY = Object.fromEntries(
  (Object.keys(AREAS) as Array<AreaType>).map((area) => [area, getInitialVisibility(area)]),
) as Record<AreaType, boolean>;

// ============================================================================
// ユーティリティ関数
// ============================================================================

/**
 * エリア関連のユーティリティ関数
 */
export const AreasUtil = {
  /**
   * エリアが初期表示されるかを確認
   *
   * @param area 確認するエリア
   * @returns 初期表示されるならtrue、そうでなければfalse
   */
  isInitiallyVisible(area: AreaType): boolean {
    return INITIAL_VISIBILITY[area];
  },

  /**
   * 地理的エリアかどうかを確認
   *
   * @param area 確認するエリア
   * @returns 地理的エリアならtrue、そうでなければfalse
   */
  isGeographicArea(area: AreaType): boolean {
    return area in GEOGRAPHIC_AREAS;
  },

  /**
   * 施設カテゴリかどうかを確認
   *
   * @param area 確認するエリア
   * @returns 施設カテゴリならtrue、そうでなければfalse
   */
  isFacilityCategory(area: AreaType): boolean {
    return area in FACILITY_CATEGORIES && !(area in SPECIAL_AREAS);
  },

  /**
   * 特殊表示エリアかどうかを確認
   *
   * @param area 確認するエリア
   * @returns 特殊表示エリアならtrue、そうでなければfalse
   */
  isSpecialArea(area: AreaType): boolean {
    return area in SPECIAL_AREAS;
  },

  /**
   * エリア名を取得
   *
   * @param area エリア
   * @returns エリアの表示名
   */
  getAreaName(area: AreaType): string {
    return AREAS[area];
  },

  /**
   * エリアからカテゴリを取得
   * types.tsで定義されたインターフェースの実装
   *
   * @param area エリア識別子
   * @returns そのエリアのカテゴリ
   */
  getAreaCategory: ((areaId: AreaType): AreaCategory => {
    if (AreasUtil.isGeographicArea(areaId)) {
      return AreaCategory.REGION;
    } else if (AreasUtil.isFacilityCategory(areaId)) {
      return AreaCategory.FACILITY;
    } else {
      return AreaCategory.SPECIAL;
    }
  }) as GetAreaCategoryFn,

  /**
   * エリア一覧を取得
   *
   * @param categoryFilter カテゴリでのフィルタリング（任意）
   * @returns エリアの配列
   */
  getAreas(categoryFilter?: AreaCategoryFilter): AreaType[] {
    if (categoryFilter === 'region') {
      return Object.keys(GEOGRAPHIC_AREAS) as RegionAreaType[];
    } else if (categoryFilter === 'facility') {
      // 施設カテゴリのみ（特殊エリアを除く）
      return Object.keys(FACILITY_CATEGORIES).filter(
        (area) => !AreasUtil.isSpecialArea(area as AreaType),
      ) as FacilityAreaType[];
    } else if (categoryFilter === 'special') {
      return Object.keys(SPECIAL_AREAS) as SpecialAreaType[];
    }

    // フィルターなしの場合はすべてのエリアを返す
    return Object.keys(AREAS) as AreaType[];
  },

  /**
   * 表示/非表示を切り替えた初期設定を取得
   *
   * @param overrides 上書きする値のオブジェクト
   * @returns 更新された表示設定
   */
  getVisibilityWithOverrides(overrides: Partial<Record<AreaType, boolean>>): Record<AreaType, boolean> {
    return { ...INITIAL_VISIBILITY, ...overrides };
  },
};

export const getAreaCategory = AreasUtil.getAreaCategory;
