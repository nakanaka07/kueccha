/**
 * POI（ポイントオブインタレスト）関連の型定義ファイル
 * 
 * このファイルはPOIの基本構造、分類、表示オプション、営業時間などの
 * POI固有の型定義を提供します。検索機能との共有型は poi-search-common.types.ts に定義されています。
 * 
 * @see poi-search-common.types.ts - POIと検索機能で共有される型定義
 * @see base.types.ts - 基本エンティティの型定義
 */

// 標準的な順序で必要な型をインポート
import type { AreaType } from './areas.types';
import type { BaseEntity } from './base.types';
import type { LatLngLiteral } from './geo.types';
import type { MarkerAnimation } from './markers.types';
// 循環参照を解決するため共通ファイルからインポート
import type { PoiGenre } from './poi-common.types';

// ============================================================================
// 営業時間関連
// ============================================================================

/**
 * 営業時間のキーを表す型
 */
export type BusinessHourKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'
  | 'holiday';

/**
 * 営業時間項目の型
 */
export interface BusinessHourItem {
  day: string;
  key: BusinessHourKey;
}

/**
 * 曜日マッピング情報
 */
export type BusinessHourDayMapping = BusinessHourItem;

// ============================================================================
// マーカー表示関連
// ============================================================================

/**
 * マーカー表示オプションを表す型
 */
export interface MarkerDisplayOptions {
  icon?: string;
  color?: string;
  opacity?: number;
  animation?: MarkerAnimation;
  zIndex?: number;
}

// ============================================================================
// POIデータ構造
// ============================================================================

/**
 * POI（ポイントオブインタレスト）を表す型
 */
export interface Poi extends BaseEntity {
  name: string;
  location: LatLngLiteral;
  area: AreaType;
  genre: PoiGenre;
  category: string;
  businessHours?: Partial<Record<BusinessHourKey, string>>;
  holidayInfo?: string;
  parking?: string;
  payment?: string;
  information?: string;
  view?: string;
  phone?: string;
  address?: string;
  markerOptions?: MarkerDisplayOptions;
  keywords?: string[];
  detailUrl?: string;
  rating?: number;
  reviewCount?: number;
  updatedAt?: string;
}

// ============================================================================
// データアクセス関連
// ============================================================================

/**
 * POIデータソースに対する操作を定義するインターフェース
 */
export interface PoiDataSource {
  getAllPois(): Promise<Poi[]>;
  getPoiById(id: string): Promise<Poi | null>;
  searchPois(params: PoiSearchParams): Promise<PoiSearchResult<Poi>>;
}