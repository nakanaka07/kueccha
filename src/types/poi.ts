/**
 * POI (Point of Interest) 関連の型定義
 * CSVデータの構造に合わせた型と、アプリケーション内での使用に最適化された型を定義
 */

/**
 * POIの種類を表す型
 */
export type POIType = 'restaurant' | 'parking' | 'toilet' | 'shop' | 'attraction' | 'other';

/**
 * POIのカテゴリーを表す型
 */
export type POICategory = 'japanese' | 'western' | 'other' | 'fusion' | 'retail' | 'unspecified';

/**
 * 営業時間の情報
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
  genre: string;
  category: POICategory; // カテゴリー（和食、洋食など）
  address: string; // 所在地
  area: string;
  contact: string;
  businessHours: BusinessHours; // 営業時間情報
  parkingInfo: string;
  infoUrl: string;
  googleMapsUrl: string;
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
 */
export interface RawPOIData {
  名称: string;
  WKT: string; // 位置情報（Well-Known Text形式）
  閉店情報: string;
  ジャンル: string;
  和食カテゴリー: string;
  洋食カテゴリー: string;
  その他カテゴリー: string;
  販売カテゴリー: string;
  駐車場情報: string;
  キャッシュレス: string;
  月曜定休日: string;
  火曜定休日: string;
  水曜定休日: string;
  木曜定休日: string;
  金曜定休日: string;
  土曜定休日: string;
  日曜定休日: string;
  祝祭定休日: string;
  定休日について: string;
  営業開始時間１: string;
  営業終了時間１: string;
  営業開始時間２: string;
  営業終了時間２: string;
  関連情報: string;
  'Google マップで見る': string;
  問い合わせ: string;
  所在地: string;
  地区: string;
  営業時間?: string;
  北緯?: string;
  東経?: string;
}

/**
 * POI検索・フィルタリングのオプション
 */
export interface POIFilterOptions {
  types?: POIType[];
  categories?: POICategory[];
  districts?: District[];
  isOpenNow?: boolean; // 現在営業中のみ
  hasParking?: boolean; // 駐車場あり
  hasCashless?: boolean; // キャッシュレス対応
  keyword?: string; // キーワード検索
  excludeClosed?: boolean; // 閉店した店舗を除外
}

/**
 * マーカーのグループ化設定
 */
export interface MarkerClusterOptions {
  enabled: boolean;
  maxZoom?: number; // このズームレベル以上でクラスタリングを解除
  minClusterSize?: number; // クラスタを形成する最小マーカー数
}

/**
 * POI型からPointOfInterest型への変換ヘルパー関数
 * アプリケーション内でのデータ変換に使用
 */
export function convertPOIToPointOfInterest(poi: POI): PointOfInterest {
  // POIカテゴリーを文字列の配列に変換
  const categoryStrings = [poi.category];

  // 定休日情報の変換
  const holidays = poi.regularHolidays ?? {};

  return {
    ...poi,
    lat: poi.position.lat,
    lng: poi.position.lng,
    category: categoryStrings.length > 0 ? categoryStrings[0] : undefined,
    categories: categoryStrings,
    district:
      typeof poi.district === 'string'
        ? poi.district
        : typeof poi.district === 'number'
          ? District[poi.district as unknown as keyof typeof District]
          : undefined,
    月曜定休日: holidays[DayOfWeek.Monday] ?? false,
    火曜定休日: holidays[DayOfWeek.Tuesday] ?? false,
    水曜定休日: holidays[DayOfWeek.Wednesday] ?? false,
    木曜定休日: holidays[DayOfWeek.Thursday] ?? false,
    金曜定休日: holidays[DayOfWeek.Friday] ?? false,
    土曜定休日: holidays[DayOfWeek.Saturday] ?? false,
    日曜定休日: holidays[DayOfWeek.Sunday] ?? false,
    祝祭定休日: holidays[DayOfWeek.Holiday] ?? false,
    定休日について: poi.holidayNotes,
    問い合わせ: poi.contact,
    'Google マップで見る': poi.googleMapsUrl,
    営業時間: poi.businessHours,
  };
}

/**
 * RawPOIData型からPointOfInterest型への変換ヘルパー関数
 * CSVデータ読み込み時に使用
 */
export function convertRawDataToPointOfInterest(rawData: RawPOIData): PointOfInterest {
  // WKT形式の位置情報から緯度経度を抽出
  // 例: "POINT (138.4665294 38.319763)" → { lat: 38.319763, lng: 138.4665294 }
  const wktMatch = rawData.WKT.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
  const lng = wktMatch ? parseFloat(wktMatch[1]) : parseFloat(rawData.東経 ?? '0');
  const lat = wktMatch ? parseFloat(wktMatch[2]) : parseFloat(rawData.北緯 ?? '0');

  // カテゴリーの決定
  const categories: string[] = [];
  if (rawData.和食カテゴリー === 'TRUE') categories.push('和食');
  if (rawData.洋食カテゴリー === 'TRUE') categories.push('洋食');
  if (rawData.その他カテゴリー === 'TRUE') categories.push('その他');
  if (rawData.販売カテゴリー === 'TRUE') categories.push('販売');

  // POIタイプの決定（ジャンルに基づく簡易判定）
  const poiType = determinePoiType(rawData.ジャンル);

  return {
    id: `poi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: rawData.名称,
    lat,
    lng,
    isClosed: rawData.閉店情報 === 'TRUE',
    type: poiType,
    category: categories.length > 0 ? categories[0] : undefined,
    categories,
    genre: rawData.ジャンル,
    hasParking: rawData.駐車場情報 === 'TRUE',
    hasCashless: rawData.キャッシュレス === 'TRUE',
    address: rawData.所在地,
    district: rawData.地区,
    問い合わせ: rawData.問い合わせ,
    関連情報: rawData.関連情報,
    'Google マップで見る': rawData['Google マップで見る'],
    営業時間: rawData.営業時間,
    月曜定休日: rawData.月曜定休日 === 'TRUE',
    火曜定休日: rawData.火曜定休日 === 'TRUE',
    水曜定休日: rawData.水曜定休日 === 'TRUE',
    木曜定休日: rawData.木曜定休日 === 'TRUE',
    金曜定休日: rawData.金曜定休日 === 'TRUE',
    土曜定休日: rawData.土曜定休日 === 'TRUE',
    日曜定休日: rawData.日曜定休日 === 'TRUE',
    祝祭定休日: rawData.祝祭定休日 === 'TRUE',
    定休日について: rawData.定休日について,
    // 検索用にテキストを結合して正規化
    searchText: `${rawData.名称} ${rawData.ジャンル} ${rawData.所在地}`.toLowerCase(),
  };
}

/**
 * ジャンル情報からPOIタイプを推定するヘルパー関数
 */
function determinePoiType(genre: string): POIType {
  const genreLower = genre.toLowerCase();

  // キーワードとPOIタイプのマッピング
  const typePatterns: Record<POIType, string[]> = {
    restaurant: [
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
    ],
    parking: ['駐車場'],
    toilet: ['トイレ'],
    attraction: ['観光', '名所'],
    shop: ['スーパー', 'コンビニ', 'パン', '店', '販売'],
    other: [], // デフォルト用（空配列）
  };

  // 各POIタイプのパターンに対してマッチングを試行
  for (const [poiType, patterns] of Object.entries(typePatterns) as [POIType, string[]][]) {
    // いずれかのパターンがジャンルに含まれていればそのタイプを返す
    if (patterns.some(pattern => genreLower.includes(pattern))) {
      return poiType;
    }
  }

  // マッチするパターンがない場合はデフォルト値を返す
  return 'other';
}
