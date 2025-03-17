/**
 * POI（ポイントオブインタレスト）関連の型定義ファイル
 * 
 * マップ上に表示される各地点のデータ構造を定義します。
 */

import { LatLngLiteral } from './geo.types';
import { AreaType } from './areas.types';
import { BaseEntity } from './base.types';

// ============================================================================
// POIの基本分類と属性
// ============================================================================

/**
 * POIのジャンルを表す型
 * 各POIの大分類カテゴリを識別するために使用されます。
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
 * 営業時間の曜日や特定の時間帯を識別するために使用されます。
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
 * マーカーに適用可能なアニメーション効果
 */
export type MarkerAnimation = 'BOUNCE' | 'DROP' | 'NONE';

/**
 * マーカー表示オプションを表す型
 * POIをマップ上に表示する際の視覚的な設定を定義します。
 */
export interface MarkerDisplayOptions {
  /** アイコンのURL または 識別子 */
  icon?: string;
  
  /** マーカーの色 (CSS色形式) */
  color?: string;
  
  /** 不透明度 (0.0-1.0) */
  opacity?: number;
  
  /** アニメーション種類 */
  animation?: MarkerAnimation;
  
  /** マーカーの優先表示順位 (高いほど前面に表示) */
  zIndex?: number;
}

// ============================================================================
// POI 主要インターフェース
// ============================================================================

/**
 * POI（ポイントオブインタレスト）を表す型。
 * マップ上に表示される各地点の情報を定義します。
 */
export interface Poi extends BaseEntity {
  /** POIの名称 */
  name: string;
  
  /** POIの位置（緯度・経度） */
  location: LatLngLiteral;
  
  /** POIが属するエリア */
  area: AreaType;
  
  /** POIのジャンル */
  genre: PoiGenre;
  
  /** POIのカテゴリ（より詳細な分類） */
  category: string;
  
  /** 営業時間情報 */
  businessHours?: Partial<Record<BusinessHourKey, string>>;
  
  /** 定休日や特別営業日の情報 */
  holidayInfo?: string;
  
  /** 駐車場の有無や情報 */
  parking?: string;
  
  /** 利用可能な決済方法 */
  payment?: string;
  
  /** その他の追加情報 */
  information?: string;
  
  /** 外観表示用URL */
  view?: string;
  
  /** 連絡先電話番号 */
  phone?: string;
  
  /** 物理的な住所 */
  address?: string;
  
  /** マーカー表示設定 */
  markerOptions?: MarkerDisplayOptions;
  
  /** 検索用のキーワード */
  keywords?: string[];
  
  /** 詳細情報URL */
  detailUrl?: string;
}

// ============================================================================
// POI 補助インターフェース
// ============================================================================

/**
 * 営業時間項目の型
 * 営業時間表示用の曜日とそのデータキーのペアを定義します
 */
export interface BusinessHourItem {
  /** 表示用の曜日名（例：「月曜日」） */
  day: string;
  
  /** データアクセス用のキー */
  key: BusinessHourKey;
}

/**
 * POI検索結果を表す型
 * 検索結果としてのPOIと関連メタデータを定義します
 */
export interface PoiSearchResult {
  /** 検索結果のPOI */
  poi: Poi;
  
  /** 検索クエリとの関連性スコア (0-100) */
  relevance: number;
  
  /** クエリとマッチした部分 (ハイライト用) */
  matchedFields: string[];
}

/**
 * POI検索パラメータを表す型
 * 検索条件や絞り込み条件を指定するために使用します
 */
export interface PoiSearchParams {
  /** 検索クエリ文字列 */
  query?: string;
  
  /** 特定のエリアに限定 */
  area?: AreaType | AreaType[];
  
  /** 特定のジャンルに限定 */
  genre?: PoiGenre | PoiGenre[];
  
  /** 特定のカテゴリに限定 */
  category?: string | string[];
  
  /** 検索結果の最大数 */
  limit?: number;
  
  /** 検索の最小関連性スコア */
  minRelevance?: number;
}

/**
 * POIデータソースに対する操作を定義するインターフェース
 * データ取得と検索機能を提供します
 */
export interface PoiDataSource {
  /** 
   * すべてのPOIを取得
   * @returns POIの配列
   */
  getAllPois(): Promise<Poi[]>;
  
  /**
   * IDでPOIを取得
   * @param id POIのID
   * @returns 指定されたIDのPOI、見つからない場合はnull
   */
  getPoiById(id: string): Promise<Poi | null>;
  
  /**
   * 検索条件に一致するPOIを検索
   * @param params 検索パラメータ
   * @returns 検索結果
   */
  searchPois(params: PoiSearchParams): Promise<PoiSearchResult[]>;
}