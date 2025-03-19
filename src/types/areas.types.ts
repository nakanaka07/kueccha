/**
 * エリア関連の型定義ファイル
 *
 * マップ上のエリア区分や表示状態を管理するための型を定義します。
 */

// ============================================================================
// エリアカテゴリと種類の定義
// ============================================================================

/**
 * エリアのカテゴリを表す列挙型
 * エリアを論理的なグループに分類します
 */
export enum AreaCategory {
  /** 地理的な地域 */
  REGION = 'region',

  /** 施設タイプ */
  FACILITY = 'facility',

  /** 特殊表示（現在地など） */
  SPECIAL = 'special',
}

/**
 * 地理的エリアの型定義
 * 佐渡島の地理的区分を表します
 */
export type RegionAreaType = 'RYOTSU_AIKAWA' | 'KANAI_SAWADA_NIIBO_HATANO_MANO' | 'AKADOMARI_HAMOCHI_OGI';

/**
 * 施設タイプの型定義
 * 特定の施設カテゴリを表します
 */
export type FacilityAreaType = 'SNACK' | 'PUBLIC_TOILET' | 'PARKING';

/**
 * 特殊表示エリアの型定義
 * 現在地やおすすめスポットなど特殊な表示を表します
 */
export type SpecialAreaType = 'RECOMMEND' | 'CURRENT_LOCATION';

/**
 * すべてのエリア識別子の型
 * 定数で定義されたエリアの識別子として使用されます
 */
export type AreaType = RegionAreaType | FacilityAreaType | SpecialAreaType;

/**
 * エリアフィルター用の型
 * API呼び出しやフィルタリングに使用します
 */
export type AreaCategoryFilter = 'region' | 'facility' | 'special' | undefined;

// ============================================================================
// エリア情報とメタデータの定義
// ============================================================================

/**
 * エリアの詳細情報を表すインターフェース
 * エリアに関する表示情報やメタデータを含みます
 */
export interface AreaInfo {
  /** エリアの識別子 */
  id: AreaType;

  /** エリアの表示名 */
  displayName: string;

  /** エリアのカテゴリ */
  category: AreaCategory;

  /** エリアの説明（オプション） */
  description?: string;

  /** エリアアイコンのURL（オプション） */
  iconUrl?: string;

  /** 地図上の中心座標（オプション） */
  center?: { lat: number; lng: number };

  /** エリアの色（オプション） */
  color?: string;
}

/**
 * 各エリアの表示/非表示状態を管理する型
 * キーはAreaTypeで、値は表示状態（真偽値）を示します
 */
export type AreaVisibility = Record<AreaType, boolean>;

// ============================================================================
// エリア関連のユーティリティ型と関数
// ============================================================================

/**
 * エリアIDからそのカテゴリを判定する関数の型定義
 * 実装は定数ファイルで提供されます
 */
export type GetAreaCategoryFn = (areaId: AreaType) => AreaCategory;

/**
 * エリアリストをカテゴリでグループ化した結果の型
 */
export type AreasByCategory = {
  [key in AreaCategory]: AreaInfo[];
};

/**
 * 型定義で使用するエリアデータのキー型
 * 定数ファイルとの連携用に使用します
 */
export type AreaRecordKey = keyof typeof import('../constants/areas.constants').AREAS;
