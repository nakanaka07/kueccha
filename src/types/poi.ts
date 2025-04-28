/**
 * POI（Point of Interest）に関する型定義
 *
 * このファイルには、POI（Point of Interest）に関連する型定義が含まれています。
 * データモデル、フィルターオプション、カテゴリなど、POI機能に必要な型を提供します。
 *
 * @version 1.3.1
 * @since 2025-04-28
 */

/**
 * POIの種類を表す型
 * 施設やスポットの種類を分類するための列挙型
 */
export type POIType = 'restaurant' | 'parking' | 'toilet' | 'attraction' | 'shop' | 'other';

/**
 * POIのカテゴリを表す型
 * より詳細な分類やタグ付けに使用
 */
export type POICategory = string;

/**
 * 佐渡島の地区を表す型
 * 島内の主要な地域区分
 */
export type District = string;

/**
 * 生のPOIデータ型定義
 * CSVファイルから直接読み込まれるデータ形式を表します
 */
export interface RawPOIData {
  名称: string;
  WKT?: string;
  所在地?: string;
  ジャンル?: string;
  問い合わせ?: string;
  関連情報?: string;
  'Google マップで見る'?: string;
  営業時間?: string;
  キャッシュレス?: string;
  駐車場情報?: string;
  閉店情報?: string;
  地区?: string;
  月曜定休日?: string;
  火曜定休日?: string;
  水曜定休日?: string;
  木曜定休日?: string;
  金曜定休日?: string;
  土曜定休日?: string;
  日曜定休日?: string;
  祝祭定休日?: string;
  定休日について?: string;

  // コンバーター用の追加フィールド
  北緯?: string;
  東経?: string;
  和食カテゴリー?: string;
  洋食カテゴリー?: string;
  その他カテゴリー?: string;
  販売カテゴリー?: string;
  営業開始時間１?: string;
  営業終了時間１?: string;
  営業開始時間２?: string;
  営業終了時間２?: string;
}

/**
 * 処理済みのPOI情報を表す型
 * アプリケーション内で使用される標準的なPOIデータ形式
 */
export interface PointOfInterest {
  // 基本情報
  id: string;
  name: string;
  lat: number;
  lng: number;
  latitude: number; // latのエイリアス
  longitude: number; // lngのエイリアス

  // 位置情報 (互換性のため)
  position?: {
    lat: number;
    lng: number;
  };

  // 分類情報
  type: POIType;
  category?: string;
  categories?: string[];
  genre?: string;

  // ステータス情報
  isClosed?: boolean;
  hasParking?: boolean;
  hasCashless?: boolean;

  // 位置情報
  address?: string;
  district?: string;
  area?: string;

  // 問い合わせ・関連情報
  contact?: string;
  businessHours?: string;
  parkingInfo?: string;
  infoUrl?: string;
  googleMapsUrl?: string;
  問い合わせ?: string;
  関連情報?: string;
  'Google マップで見る'?: string;

  // 営業時間情報
  営業時間?: string;

  // 定休日情報
  月曜定休日?: boolean;
  火曜定休日?: boolean;
  水曜定休日?: boolean;
  木曜定休日?: boolean;
  金曜定休日?: boolean;
  土曜定休日?: boolean;
  日曜定休日?: boolean;
  祝祭定休日?: boolean;
  定休日について?: string;

  // 検索用テキスト
  searchText: string;
}

/**
 * POIフィルタリングオプションの型定義
 * ユーザーが指定可能なフィルター条件
 */
export interface POIFilterOptions {
  // 除外オプション
  excludeClosed?: boolean;

  // タイプとカテゴリによるフィルタリング
  types?: POIType[];
  categories?: POICategory[];
  districts?: District[];

  // 設備によるフィルタリング
  hasParking?: boolean;
  hasCashless?: boolean;

  // キーワード検索
  keyword?: string;

  // 現在営業中のみを表示
  isOpenNow?: boolean;
}

// POIはPointOfInterestの別名として定義
export type POI = PointOfInterest;
