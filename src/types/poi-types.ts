/**
 * POI (Point of Interest) 関連の型定義
 * CSVデータの構造に合わせた型と、アプリケーション内での使用に最適化された型を定義
 */

/**
 * POIの種類を表す型
 * 地図上での表示方法やフィルタリングに使用
 */
export type POIType = 'restaurant' | 'parking' | 'toilet' | 'shop' | 'attraction' | 'other';

/**
 * POIのカテゴリーを表す型
 * 主に飲食店のジャンル分類に使用
 */
export type POICategory = 'japanese' | 'western' | 'other' | 'fusion' | 'retail' | 'unspecified';

/**
 * 営業時間の情報（文字列形式）
 * 例: "10:00-19:00" または "10:00-14:00, 17:00-21:00"
 */
export type BusinessHours = string;

/**
 * POIの基本情報インターフェース
 * 地図上のマーカーで表示される場所の情報を表現
 */
export interface POI {
  id: string; // 一意の識別子（通常は生成される）
  name: string; // 施設名称
  position: google.maps.LatLngLiteral; // 位置情報
  isClosed: boolean; // 閉店情報
  type: POIType; // POIタイプ（飲食店、駐車場など）
  genre: string; // 詳細なジャンル情報（テキスト）
  category: POICategory; // カテゴリー（和食、洋食など）
  address: string; // 所在地
  area: string; // エリア情報
  contact: string; // 連絡先情報
  businessHours: BusinessHours; // 営業時間情報
  parkingInfo: string; // 駐車場情報
  infoUrl: string; // 詳細情報URL
  googleMapsUrl: string; // Google Maps URL
  searchText: string; // 検索用正規化テキスト
  district?: string | number; // 地区情報
  regularHolidays?: RegularHolidays; // 定休日情報
  holidayNotes?: string; // 定休日に関する補足情報
}

/**
 * UI表示用に加工されたPOIデータ
 * InfoWindow、POIDetailsなどのコンポーネントで使用
 */
export interface PointOfInterest {
  id: string;
  name: string;
  lat: number; // 緯度（直接アクセス用）
  lng: number; // 経度（直接アクセス用）
  latitude: number; // lat のエイリアス
  longitude: number; // lng のエイリアス
  isClosed: boolean;
  type: POIType;
  category?: string | undefined; // 主要カテゴリー（表示用）
  categories?: string[] | undefined; // カテゴリー一覧
  genre?: string | undefined; // ジャンル情報
  address: string; // 所在地
  district?: string | undefined; // 地区名
  問い合わせ?: string | undefined; // 問い合わせ先
  関連情報?: string | undefined; // 関連情報
  'Google マップで見る'?: string | undefined; // Google Maps URL
  営業時間?: string | undefined; // 営業時間テキスト
  // 曜日ごとの定休日情報
  月曜定休日?: boolean | undefined;
  火曜定休日?: boolean | undefined;
  水曜定休日?: boolean | undefined;
  木曜定休日?: boolean | undefined;
  金曜定休日?: boolean | undefined;
  土曜定休日?: boolean | undefined;
  日曜定休日?: boolean | undefined;
  祝祭定休日?: boolean | undefined;
  定休日について?: string | undefined; // 定休日の補足情報
  searchText?: string | undefined; // 検索用正規化テキスト
  // POI型から変換時に使用されるフィールド
  hasParking?: boolean | undefined;
  hasCashless?: boolean | undefined;
  businessHours?: BusinessHours | undefined;
  regularHolidays?: RegularHolidays | undefined;
  isRecommended?: boolean | undefined; // おすすめフラグ（マーカー表示用）
}

/**
 * 佐渡島内の地区を表す列挙型
 */
export enum District {
  Ryotsu = 'ryotsu', // 両津地区
  Aikawa = 'aikawa', // 相川地区
  Sawada = 'sawada', // 佐和田地区
  Kanai = 'kanai', // 金井地区
  Niibo = 'niibo', // 新穂地区
  Hatano = 'hatano', // 畑野地区
  Mano = 'mano', // 真野地区
  Akadoma = 'akadoma', // 赤泊地区
  Hamochi = 'hamochi', // 羽茂地区
  Ogi = 'ogi', // 小木地区
}

/**
 * 曜日を表す列挙型
 */
export enum DayOfWeek {
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
  Sunday = 'sunday',
  Holiday = 'holiday', // 祝日
}

/**
 * 営業時間帯の情報
 */
export interface BusinessPeriod {
  open: string; // 開店時間（"HH:MM"形式）
  close: string; // 閉店時間（"HH:MM"形式）
}

/**
 * 定休日の情報
 */
export interface RegularHolidays {
  [DayOfWeek.Monday]?: boolean;
  [DayOfWeek.Tuesday]?: boolean;
  [DayOfWeek.Wednesday]?: boolean;
  [DayOfWeek.Thursday]?: boolean;
  [DayOfWeek.Friday]?: boolean;
  [DayOfWeek.Saturday]?: boolean;
  [DayOfWeek.Sunday]?: boolean;
  [DayOfWeek.Holiday]?: boolean;
}

/**
 * CSVから読み込んだ生のPOIデータ
 * CSVカラム名と同じ構造を持つ
 * すべてのフィールドはundefinedの可能性があることを明示
 */
export interface RawPOIData {
  名称: string; // 名称は必須フィールド
  WKT?: string; // 位置情報（Well-Known Text形式）
  閉店情報?: string;
  ジャンル?: string;
  和食カテゴリー?: string;
  洋食カテゴリー?: string;
  その他カテゴリー?: string;
  販売カテゴリー?: string;
  駐車場情報?: string;
  キャッシュレス?: string;
  月曜定休日?: string;
  火曜定休日?: string;
  水曜定休日?: string;
  木曜定休日?: string;
  金曜定休日?: string;
  土曜定休日?: string;
  日曜定休日?: string;
  祝祭定休日?: string;
  定休日について?: string;
  営業開始時間１?: string;
  営業終了時間１?: string;
  営業開始時間２?: string;
  営業終了時間２?: string;
  関連情報?: string;
  'Google マップで見る'?: string;
  問い合わせ?: string;
  所在地?: string;
  地区?: string;
  営業時間?: string;
  北緯?: string;
  東経?: string;
}

/**
 * POI検索・フィルタリングのオプション
 * アプリケーション全体で一貫したフィルタリング条件を表現
 */
export interface POIFilterOptions {
  types?: POIType[]; // POIタイプによるフィルター（飲食店、駐車場など）
  categories?: POICategory[]; // カテゴリーによるフィルター（和食、洋食など）
  districts?: District[]; // 地区によるフィルター（両津、相川など）
  isOpenNow?: boolean; // 現在営業中のみを表示（true=営業中のみ）
  hasParking?: boolean; // 駐車場の有無でフィルター（true=駐車場あり）
  hasCashless?: boolean; // キャッシュレス対応でフィルター（true=対応あり）
  keyword?: string; // キーワード検索（名称、住所、ジャンルなど）
  excludeClosed?: boolean; // 閉店した店舗を除外するかどうか（true=除外する）
}

/**
 * マーカーのグループ化設定
 * Google Mapsでマーカークラスタリングを行う際の設定
 */
export interface MarkerClusterOptions {
  enabled: boolean; // クラスタリングを有効にするかどうか
  maxZoom?: number; // このズームレベル以上でクラスタリングを解除
  minClusterSize?: number; // クラスタを形成する最小マーカー数
  gridSize?: number; // クラスタリングのグリッドサイズ（ピクセル単位）
  styles?: Record<string, unknown>[]; // カスタムクラスタースタイル（オプション）
}
