/**
 * POI（ポイントオブインタレスト）関連の型定義ファイル
 */

import type { AreaType } from './areas.types';
import type { BaseEntity } from './base.types';
import type { LatLngLiteral } from './geo.types';

/**
 * POIのジャンルを表す型
 */
export type PoiGenre =
  | 'restaurant'
  | 'cafe'
  | 'shop'
  | 'attraction'
  | 'facility'
  | 'current_location'
  | 'other';

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
 * マーカーアニメーションの種類
 */
export type MarkerAnimation = 'BOUNCE' | 'DROP' | 'NONE';

/**
 * マーカー表示オプションを表す型
 */
export interface MarkerDisplayOptions {
  icon?: string; // アイコンのURL または 識別子
  color?: string; // マーカーの色 (CSS色形式)
  opacity?: number; // 不透明度 (0.0-1.0)
  animation?: MarkerAnimation; // アニメーション種類
  zIndex?: number; // マーカーの優先表示順位 (高いほど前面に表示)
}

/**
 * POI（ポイントオブインタレスト）を表す型
 */
export interface Poi extends BaseEntity {
  name: string; // POIの名称
  location: LatLngLiteral; // POIの位置（緯度・経度）
  area: AreaType; // POIが属するエリア
  genre: PoiGenre; // POIのジャンル
  category: string; // POIのカテゴリ（より詳細な分類）
  businessHours?: Partial<Record<BusinessHourKey, string>>; // 営業時間情報
  holidayInfo?: string; // 定休日や特別営業日の情報
  parking?: string; // 駐車場の有無や情報
  payment?: string; // 利用可能な決済方法
  information?: string; // その他の追加情報
  view?: string; // 外観表示用URL
  phone?: string; // 連絡先電話番号
  address?: string; // 物理的な住所
  markerOptions?: MarkerDisplayOptions; // マーカー表示設定
  keywords?: string[]; // 検索用のキーワード
  detailUrl?: string; // 詳細情報URL
}

/**
 * 営業時間項目の型
 */
export interface BusinessHourItem {
  day: string; // 表示用の曜日名（例：「月曜日」）
  key: BusinessHourKey; // データアクセス用のキー
}

/**
 * POI検索結果を表す型
 */
export interface PoiSearchResult {
  poi: Poi; // 検索結果のPOI
  relevance: number; // 検索クエリとの関連性スコア (0-100)
  matchedFields: string[]; // クエリとマッチした部分 (ハイライト用)
}

/**
 * POI検索パラメータを表す型
 */
export interface PoiSearchParams {
  query?: string; // 検索クエリ文字列
  area?: AreaType | AreaType[]; // 特定のエリアに限定
  genre?: PoiGenre | PoiGenre[]; // 特定のジャンルに限定
  category?: string | string[]; // 特定のカテゴリに限定
  limit?: number; // 検索結果の最大数
  minRelevance?: number; // 検索の最小関連性スコア
}

/**
 * POIデータソースに対する操作を定義するインターフェース
 */
export interface PoiDataSource {
  getAllPois(): Promise<Poi[]>; // すべてのPOIを取得
  getPoiById(id: string): Promise<Poi | null>; // IDでPOIを取得
  searchPois(params: PoiSearchParams): Promise<PoiSearchResult[]>; // 検索条件に一致するPOIを検索
}