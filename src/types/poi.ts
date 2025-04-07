/**
 * POI (Point of Interest) 関連の型定義
 * CSVデータの構造に合わせた型と、アプリケーション内での使用に最適化された型を定義
 *
 * このファイルでは以下を提供します：
 * - POIの基本型とそれに関連する列挙型、インターフェース
 * - データ変換のためのヘルパー関数
 * - CSVデータからアプリケーション用POIオブジェクトへの変換ロジック
 * - POIデータのフィルタリングと検索に関する機能
 */

import { ENV, getEnvVar, toBool } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';

/**
 * POI関連の定数定義
 */
const POI_COMPONENT = 'POIConverter';
const DEFAULT_LAT = 38.0317; // 佐渡島の中心緯度
const DEFAULT_LNG = 138.3698; // 佐渡島の中心経度
const MAX_DEBUG_DATA_LENGTH = 200; // デバッグログに出力するデータの最大文字数

/**
 * 正規表現定数の定義
 * 繰り返し使用する正規表現を事前にコンパイルしてパフォーマンスを向上
 */
const WKT_REGEX = /POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i;
const WHITESPACE_REGEX = /\s+/g;

// 環境変数からログレベルを取得（ガイドラインに準拠した型安全なアクセス）
const DEBUG_MODE = getEnvVar({
  key: 'VITE_DEBUG_MODE',
  defaultValue: ENV.env.isDev,
  transform: toBool,
});

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

// POI種類に対応するキーワードのマッピング定数
// 外部に露出せずジャンル判定に内部的に使用
const POI_TYPE_PATTERNS: Record<POIType, string[]> = {
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
    '食事',
    'ランチ',
  ],
  parking: ['駐車場', 'パーキング'],
  toilet: ['トイレ', '手洗い', 'お手洗い', 'WC', '化粧室'],
  attraction: ['観光', '名所', '史跡', '旧跡', '神社', '寺院', '公園'],
  shop: ['スーパー', 'コンビニ', 'パン', '店', '販売', 'ショップ', '物産'],
  other: [], // デフォルト用（空配列）
};

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

/**
 * ジャンル情報からPOIタイプを推定するヘルパー関数
 * @param genre ジャンル文字列（undefinedの場合もあり）
 * @returns 推定されたPOIタイプ
 */
export function determinePoiType(genre?: string): POIType {
  // genreがnullish（nullまたはundefined）の場合は早期リターン
  if (genre === undefined || genre === '') {
    return 'other';
  }

  const genreLower = genre.toLowerCase();

  // 定義済みのPOI_TYPE_PATTERNSを使用
  for (const [poiType, patterns] of Object.entries(POI_TYPE_PATTERNS) as [POIType, string[]][]) {
    // いずれかのパターンがジャンルに含まれていればそのタイプを返す
    if (patterns.some(pattern => genreLower.includes(pattern))) {
      return poiType;
    }
  }

  logger.debug('未分類のPOIジャンルを検出', { genre, component: POI_COMPONENT });
  return 'other';
}

/**
 * RawPOIData型からPointOfInterest型への変換ヘルパー関数
 * CSVデータ読み込み時に使用
 * @param rawData CSVから取得した生データ
 * @returns 処理済みのPointOfInterestオブジェクト
 */
export function convertRawDataToPointOfInterest(rawData: RawPOIData): PointOfInterest {
  try {
    return logger.measureTime(
      'POIデータ変換',
      () => {
        // データの妥当性検証
        validatePOIData(rawData);

        // 座標データの抽出と検証を行う
        const { lat, lng } = extractCoordinates(rawData);

        // カテゴリー情報の抽出と正規化
        const categories = extractCategories(rawData);

        // POIタイプの決定（ジャンルに基づく判定）
        const poiType = determinePoiType(rawData.ジャンル);

        // 一意なIDを生成
        const id = generateUniqueId(rawData.名称);

        // 検索用テキストの正規化
        const searchText = normalizeSearchText(rawData);

        // 変換結果を返す
        return createPointOfInterest(rawData, id, lat, lng, poiType, categories, searchText);
      },
      LogLevel.INFO,
      {
        component: POI_COMPONENT,
        action: 'convert_poi',
        name: rawData.名称,
      }
    );
  } catch (error) {
    logger.error('POIデータ変換中にエラーが発生', {
      error,
      component: POI_COMPONENT,
      action: 'convert_poi',
      status: 'error',
      rawData: limitObjectSize({
        name: rawData.名称,
        address: rawData.所在地,
        wkt: rawData.WKT,
      }),
    });

    // エラー時でも最低限の情報を持つオブジェクトを返す
    return {
      id: `error-${Date.now()}`,
      name: rawData.名称,
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
      isClosed: true,
      type: 'other',
      address: rawData.所在地 ?? '',
      searchText: rawData.名称.toLowerCase(),
    };
  }
}

/**
 * POIデータの妥当性を検証する関数
 * @param rawData 検証対象の生POIデータ
 */
function validatePOIData(rawData: RawPOIData): void {
  logger.measureTime(
    'POIデータ妥当性検証',
    () => {
      if (!rawData.名称) {
        logger.warn('名称のないPOIデータ', {
          component: POI_COMPONENT,
          action: 'validate_data',
          status: 'missing_name',
          data: rawData.所在地 ?? rawData.WKT ?? '不明',
        });
      }
    },
    DEBUG_MODE ? LogLevel.DEBUG : LogLevel.INFO
  );
}

/**
 * PointOfInterestオブジェクトを生成する関数
 * 型安全な方法でデータを処理
 */
function createPointOfInterest(
  rawData: RawPOIData,
  id: string,
  lat: number,
  lng: number,
  poiType: POIType,
  categories: string[],
  searchText: string
): PointOfInterest {
  // 型安全な形式で値を取得する関数
  const getStringOrDefault = (value: string | undefined, defaultValue: string): string => {
    return typeof value === 'string' ? value : defaultValue;
  };

  // 値がTRUEの場合にtrueを返す関数
  const isTrueValue = (value: string | undefined): boolean => value === 'TRUE';

  // 営業時間の型安全な取得
  const businessHours =
    rawData.営業時間 && rawData.営業時間 !== ''
      ? rawData.営業時間 // 既存の営業時間フィールドがある場合
      : formatBusinessHours(rawData); // なければフォーマット関数で生成

  return {
    id,
    name: rawData.名称, // 名称はRawPOIDataで必須フィールド
    lat,
    lng,
    isClosed: isTrueValue(rawData.閉店情報),
    type: poiType,
    category: categories.length > 0 ? categories[0] : undefined,
    categories,
    genre: rawData.ジャンル,
    hasParking: isTrueValue(rawData.駐車場情報),
    hasCashless: isTrueValue(rawData.キャッシュレス),
    address: getStringOrDefault(rawData.所在地, ''),
    district: rawData.地区,
    問い合わせ: rawData.問い合わせ,
    関連情報: rawData.関連情報,
    'Google マップで見る': rawData['Google マップで見る'],
    営業時間: businessHours,
    月曜定休日: isTrueValue(rawData.月曜定休日),
    火曜定休日: isTrueValue(rawData.火曜定休日),
    水曜定休日: isTrueValue(rawData.水曜定休日),
    木曜定休日: isTrueValue(rawData.木曜定休日),
    金曜定休日: isTrueValue(rawData.金曜定休日),
    土曜定休日: isTrueValue(rawData.土曜定休日),
    日曜定休日: isTrueValue(rawData.日曜定休日),
    祝祭定休日: isTrueValue(rawData.祝祭定休日),
    定休日について: rawData.定休日について,
    searchText,
  };
}

/**
 * WKT形式の座標文字列から緯度・経度を抽出
 * @param wkt WKT文字列（例："POINT(138.4090 38.0480)"）
 * @returns 抽出された緯度・経度、抽出失敗時はnull
 */
function extractWktCoordinates(wkt: string | undefined): { lat: number; lng: number } | null {
  // 文字列が存在しない場合は早期リターン
  if (typeof wkt !== 'string' || wkt.length === 0) return null;

  try {
    const wktMatch = WKT_REGEX.exec(wkt);

    // マッチ結果と必要なグループが存在するかを確認
    if (wktMatch === null || wktMatch.length < 3) return null;

    const lngStr = wktMatch[1];
    const latStr = wktMatch[2];

    // 必要な座標値が存在するかを確認
    if (typeof lngStr !== 'string' || typeof latStr !== 'string') return null;

    const lng = parseFloat(lngStr);
    const lat = parseFloat(latStr);

    // 座標の妥当性チェック
    if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
    return null;
  } catch (error) {
    logger.debug('WKT座標解析失敗', {
      component: POI_COMPONENT,
      action: 'extract_wkt',
      status: 'error',
      data: limitObjectSize({ wkt }),
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * 北緯・東経フィールドから座標を抽出
 * @param data 緯度経度情報を含むデータ
 * @returns 抽出された緯度・経度、抽出失敗時はnull
 */
function extractLatLngCoordinates(data: {
  北緯?: string;
  東経?: string;
}): { lat: number; lng: number } | null {
  // 両方の座標情報が存在しない場合は早期リターン
  if (
    typeof data.北緯 !== 'string' ||
    data.北緯.length === 0 ||
    typeof data.東経 !== 'string' ||
    data.東経.length === 0
  ) {
    return null;
  }

  try {
    const lat = parseFloat(data.北緯);
    const lng = parseFloat(data.東経);

    // NaN, Infinity, -Infinityをチェック
    if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
    return null;
  } catch (error) {
    logger.debug('北緯・東経座標解析失敗', {
      component: POI_COMPONENT,
      action: 'extract_latlng',
      lat: data.北緯,
      lng: data.東経,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * 座標データの妥当性チェック
 * @param coords 座標オブジェクト
 * @returns 座標が有効かどうか
 */
function isValidCoordinates(
  coords: { lat: number; lng: number } | null
): coords is { lat: number; lng: number } {
  // nullの場合は無効
  if (coords === null) return false;

  const { lat, lng } = coords;
  // isFiniteを使い、NaNとInfinityを除外
  return (
    isFinite(lat) &&
    isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    // 南大西洋のヌルポイント対策
    !(Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001)
  );
}

/**
 * デフォルトの座標を取得
 * @returns 佐渡島中心の座標
 */
function getDefaultCoordinates(): { lat: number; lng: number } {
  return { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
}

/**
 * 名前付き安全アクセサ関数群
 * 型安全なデータアクセスのためのユーティリティ関数
 */

/**
 * 文字列フィールドに安全にアクセスする関数
 * @param value 元の値
 * @param defaultValue デフォルト値
 * @returns 値が存在する場合はその値、それ以外はデフォルト値
 */
function safeString(value: string | undefined, defaultValue: string): string {
  return typeof value === 'string' ? value : defaultValue;
}

/**
 * 座標データを抽出する内部ヘルパー関数
 * 単一責任の原則に基づき細分化された関数を使用
 * @param rawData 生データ
 * @returns 抽出された緯度経度
 */
function extractCoordinates(rawData: RawPOIData): { lat: number; lng: number } {
  try {
    // WKT形式からの抽出ロジック
    const wktCoordinates = extractWktCoordinates(rawData.WKT);
    if (isValidCoordinates(wktCoordinates)) {
      return wktCoordinates;
    }

    // 北緯・東経フィールドからの抽出ロジック
    const latLngCoordinates = extractLatLngCoordinates(rawData);
    if (isValidCoordinates(latLngCoordinates)) {
      return latLngCoordinates;
    }

    // 無効な座標の場合、警告ログを出力
    logger.warn('有効な座標を検出できませんでした', {
      name: safeString(rawData.名称, '名称不明'),
      wkt: safeString(rawData.WKT, 'なし'),
      lat: safeString(rawData.北緯, 'なし'),
      lng: safeString(rawData.東経, 'なし'),
      component: POI_COMPONENT,
      action: 'extract_coordinates',
      status: 'fallback_to_default',
    });

    // フォールバック
    return getDefaultCoordinates();
  } catch (error) {
    logger.error('座標解析エラー', {
      error,
      name: safeString(rawData.名称, '名称不明'),
      component: POI_COMPONENT,
      action: 'extract_coordinates',
      status: 'error',
    });
    // エラー時は佐渡島の中心座標にフォールバック
    return getDefaultCoordinates();
  }
}

/**
 * カテゴリー情報を抽出する内部ヘルパー関数
 * @param rawData 生データ
 * @returns 抽出されたカテゴリー配列
 */
function extractCategories(rawData: RawPOIData): string[] {
  try {
    // 各カテゴリーをチェックし、TRUE の場合は追加
    const categories: string[] = [];

    // 型安全にチェック - 値が未定義の場合は空文字として扱う
    if (rawData.和食カテゴリー === 'TRUE') categories.push('和食');
    if (rawData.洋食カテゴリー === 'TRUE') categories.push('洋食');
    if (rawData.その他カテゴリー === 'TRUE') categories.push('その他');
    if (rawData.販売カテゴリー === 'TRUE') categories.push('販売');

    // ジャンル情報から追加カテゴリを抽出
    if (rawData.ジャンル) {
      extractCategoriesFromGenre(rawData.ジャンル, categories);
    }

    return categories;
  } catch (error) {
    logger.warn('カテゴリ抽出エラー', {
      error,
      name: rawData.名称 ?? '名称不明',
      component: POI_COMPONENT,
      action: 'extract_categories',
    });
    return [];
  }
}

/**
 * ジャンル情報から追加カテゴリを抽出する補助関数
 * @param genre ジャンル文字列
 * @param categories 追加先の既存カテゴリ配列
 */
function extractCategoriesFromGenre(genre: string, categories: string[]): void {
  // 空文字の場合は何もしない
  if (genre === '') return;

  const genreLower = genre.toLowerCase();

  // ジャンルキーワードからカテゴリを推定
  const categoryKeywords: Record<string, string[]> = {
    和食: ['日本料理', '和食', '寿司', 'そば', 'うどん', '定食', '丼', '居酒屋'],
    洋食: ['洋食', 'イタリアン', 'フレンチ', 'パスタ', 'ピザ', '洋菓子', 'パン', 'カフェ'],
    その他: ['エスニック', 'アジア', '中華', '韓国', 'タイ', 'インド', 'ファストフード'],
    販売: ['物産', '販売', 'ショップ', 'マーケット', 'お土産', '特産'],
  };

  // キーワードに基づいてカテゴリを追加（重複を避ける）
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => genreLower.includes(keyword)) && !categories.includes(category)) {
      categories.push(category);
    }
  }
}

/**
 * 検索用テキストを生成・正規化する関数
 */
function normalizeSearchText(rawData: RawPOIData): string {
  try {
    // 各フィールドを型安全に取得
    const name = rawData.名称;
    const genre = typeof rawData.ジャンル === 'string' ? rawData.ジャンル : '';
    const address = typeof rawData.所在地 === 'string' ? rawData.所在地 : '';
    const district = typeof rawData.地区 === 'string' ? rawData.地区 : '';

    return [name, genre, address, district].join(' ').toLowerCase().normalize('NFKC'); // 全角・半角の正規化
  } catch (error) {
    logger.warn('検索テキスト生成エラー', {
      error,
      component: POI_COMPONENT,
      action: 'normalize_search_text',
    });
    return rawData.名称.toLowerCase();
  }
}

/**
 * 一意なIDを生成する関数
 */
function generateUniqueId(name: string): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 9);
  // 空文字列の場合はunknownを使用
  const namePart = name.substring(0, 10).replace(/\s+/g, '_').toLowerCase() || 'unknown';

  return `poi-${namePart}-${timestamp}-${randomPart}`;
}

/**
 * 営業時間情報をフォーマットする関数
 * @param rawData 生のPOIデータ
 * @returns フォーマットされた営業時間文字列
 */
function formatBusinessHours(rawData: RawPOIData): string {
  try {
    // 既に営業時間フィールドがある場合はそれを使用
    const 営業時間 = rawData.営業時間;
    if (営業時間 && 営業時間 !== '') {
      return 営業時間;
    }

    // 営業時間が個別のフィールドに分かれている場合、それらを結合
    const start1 = rawData.営業開始時間１;
    const end1 = rawData.営業終了時間１;
    const start2 = rawData.営業開始時間２;
    const end2 = rawData.営業終了時間２;

    let hours = '';

    // 営業時間情報があれば結合
    if (start1 && start1 !== '' && end1 && end1 !== '') {
      hours = `${start1}-${end1}`;
    }

    // 2つ目の時間帯があれば追加
    if (start2 && start2 !== '' && end2 && end2 !== '') {
      hours += hours !== '' ? `, ${start2}-${end2}` : `${start2}-${end2}`;
    }

    return hours;
  } catch (error) {
    logger.warn('営業時間フォーマットエラー', { error, component: POI_COMPONENT });
    return '';
  }
}

/**
 * POIデータの一括変換処理
 * パフォーマンスの測定とエラー処理を含む
 * @param rawDataArray 生のPOIデータ配列
 * @returns 変換されたPointOfInterestオブジェクトの配列
 */
export function convertRawDataToPOIs(rawDataArray: RawPOIData[]): PointOfInterest[] {
  return logger.measureTime(
    'POIデータの一括変換処理',
    () => {
      // 配列が空の場合は早期リターン
      if (rawDataArray.length === 0) {
        logger.warn('変換対象のPOIデータがありません', {
          component: POI_COMPONENT,
          action: 'convert_batch_data',
          status: 'empty_data',
        });
        return [];
      }

      // データ件数をログ記録（標準化したコンテキスト情報）
      logger.info('POIデータの変換を開始', {
        component: POI_COMPONENT,
        action: 'convert_batch_data',
        entityIds: rawDataArray.slice(0, 5).map(data => data.名称), // 最初の5件のみ記録
        recordCount: rawDataArray.length,
        status: 'started',
      });

      // 各データを変換
      const results: PointOfInterest[] = [];
      const errors: { index: number; name: string; error: string }[] = [];

      for (let i = 0; i < rawDataArray.length; i++) {
        try {
          const currentItem = rawDataArray[i];
          if (currentItem) {
            const poi = convertRawDataToPointOfInterest(currentItem);
            results.push(poi);
          } else {
            logger.warn('配列内にnull/undefined要素が検出されました', {
              index: i,
              component: POI_COMPONENT,
              action: 'validate_data',
              status: 'invalid_data',
            });
          }
        } catch (error) {
          // エラーを収集して後で一括ログ
          const currentItem = rawDataArray[i];
          const itemName = currentItem?.名称 ?? '不明';

          errors.push({
            index: i,
            name: itemName,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // エラーがあれば警告ログに記録
      if (errors.length > 0) {
        logger.warn('一部のPOIデータの変換に失敗', {
          component: POI_COMPONENT,
          action: 'convert_batch_data',
          status: 'partial_failure',
          errorCount: errors.length,
          totalCount: rawDataArray.length,
          // エラーが多すぎる場合は件数だけ報告
          errors: errors.length <= 5 ? errors : `${errors.length}件のエラーが発生`,
        });
      }

      // 処理完了をログに記録
      logger.info('POIデータの変換が完了', {
        component: POI_COMPONENT,
        action: 'convert_batch_data',
        status: 'completed',
        successCount: results.length,
        errorCount: errors.length,
        totalCount: rawDataArray.length,
        duration: 'measureTime関数により自動計測',
      });

      // 詳細なデータ統計情報を開発環境のみ出力
      if (DEBUG_MODE) {
        logger.debug('POIデータの詳細統計', {
          component: POI_COMPONENT,
          action: 'data_statistics',
          stats: summarizePOIData(results),
        });
      }

      return results;
    },
    LogLevel.INFO,
    {
      component: POI_COMPONENT,
      action: 'convert_batch_data',
      dataSize: rawDataArray.length,
    }
  );
}

/**
 * 大きなPOIデータセットの要約情報を生成
 * @param pois POIデータの配列
 * @returns 要約統計情報
 */
export function summarizePOIData(pois: PointOfInterest[]): Record<string, unknown> {
  // 配列が空の場合は早期リターン
  if (pois.length === 0) {
    return { count: 0 };
  }

  // 要約統計情報を構築
  const types = new Set<string>();
  const categories = new Set<string>();
  const districts = new Set<string>();
  let closedCount = 0;
  let missingLocationCount = 0;

  // データを分析
  pois.forEach(poi => {
    // POIタイプを集計
    types.add(poi.type);

    // カテゴリー情報を集計
    if (typeof poi.category === 'string' && poi.category.length > 0) {
      categories.add(poi.category);
    }

    if (poi.categories && Array.isArray(poi.categories)) {
      poi.categories.forEach(cat => {
        if (typeof cat === 'string' && cat.length > 0) {
          categories.add(cat);
        }
      });
    }

    // 地区情報を集計
    if (typeof poi.district === 'string' && poi.district.length > 0) {
      districts.add(poi.district);
    }

    // 閉店情報を集計
    if (poi.isClosed === true) {
      closedCount++;
    }

    // 位置情報の欠損を集計
    const isDefaultLocation = poi.lat === DEFAULT_LAT && poi.lng === DEFAULT_LNG;
    if (isDefaultLocation) {
      missingLocationCount++;
    }
  });

  // サンプルPOIを最大3件抽出
  const sampleItems = pois.slice(0, 3).map(poi => ({
    id: poi.id,
    name: poi.name,
    type: poi.type,
    isClosed: poi.isClosed,
  }));

  return {
    count: pois.length,
    types: [...types],
    typeDistribution: getDistributionByKey(pois, 'type'),
    categories: [...categories],
    districts: [...districts],
    closedCount,
    activeCount: pois.length - closedCount,
    missingLocationCount,
    withLocationCount: pois.length - missingLocationCount,
    sampleItems,
  };
}

/**
 * 特定のキーに基づく分布を計算
 * @param items データ配列
 * @param key 分布の基準となるキー
 * @returns キーごとの件数分布
 */
function getDistributionByKey<T, K extends keyof T>(items: T[], key: K): Record<string, number> {
  return items.reduce(
    (acc, item) => {
      // 値が存在しない場合はunknownを使用
      const valueStr = String(item[key] ?? 'unknown');
      // 既に登録済みの場合は加算、未登録の場合は1を設定
      acc[valueStr] = (acc[valueStr] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * 検索用クエリを正規化する関数
 * @param query 検索クエリ文字列
 * @returns 正規化されたクエリ文字列
 */
export function normalizeSearchQuery(query: string): string {
  if (!query) return '';

  return query
    .toLowerCase()
    .normalize('NFKC') // 全角・半角の正規化
    .replace(WHITESPACE_REGEX, ' ') // 連続する空白を1つに
    .trim();
}

/**
 * POIデータをフィルタリングする関数
 * パフォーマンスを考慮した実装
 * @param pois POIデータの配列
 * @param options フィルタリングオプション
 * @returns フィルタリングされたPOIデータの配列
 */
export function filterPOIs(pois: PointOfInterest[], options?: POIFilterOptions): PointOfInterest[] {
  return logger.measureTime(
    'POIデータのフィルタリング',
    () => {
      // 入力配列チェック - 空か未定義なら空配列を返す
      if (pois === undefined || pois.length === 0) {
        return [];
      }

      // オプションが未指定なら全データを返す
      if (options === undefined) {
        return pois;
      }

      // 各フィルタ条件を個別関数に分割して複雑度を下げる
      const filtered = pois.filter(poi => {
        // 各フィルタ条件をチェック - いずれかが false なら除外
        return (
          !isExcludedByClosed(poi, options) &&
          !isExcludedByType(poi, options) &&
          !isExcludedByCategory(poi, options) &&
          !isExcludedByDistrict(poi, options) &&
          !isExcludedByParking(poi, options) &&
          !isExcludedByCashless(poi, options) &&
          !isExcludedByKeyword(poi, options)
        );
      });

      // フィルタリング結果をログに記録
      if (DEBUG_MODE) {
        logger.debug('POIフィルタリング結果', {
          component: POI_COMPONENT,
          action: 'filter_pois',
          totalCount: pois.length,
          filteredCount: filtered.length,
          options: limitObjectSize(options),
        });
      }

      return filtered;
    },
    DEBUG_MODE ? LogLevel.DEBUG : LogLevel.INFO,
    {
      component: POI_COMPONENT,
      action: 'filter_pois',
      totalCount: pois.length,
    }
  );
}

/**
 * 閉店情報によるフィルタリング
 */
function isExcludedByClosed(poi: PointOfInterest, options: POIFilterOptions): boolean {
  return options.excludeClosed === true && poi.isClosed === true;
}

/**
 * POIタイプによるフィルタリング
 */
function isExcludedByType(poi: PointOfInterest, options: POIFilterOptions): boolean {
  return (
    options.types !== undefined && options.types.length > 0 && !options.types.includes(poi.type)
  );
}

/**
 * カテゴリによるフィルタリング
 */
function isExcludedByCategory(poi: PointOfInterest, options: POIFilterOptions): boolean {
  // カテゴリフィルタが指定されていない場合は除外対象でない
  if (!options.categories || options.categories.length === 0) {
    return false;
  }

  // POIのカテゴリ情報を取得
  const poiCategories: string[] = [];

  // categories配列がある場合はそれを使用
  if (Array.isArray(poi.categories) && poi.categories.length > 0) {
    poi.categories.forEach(cat => {
      if (typeof cat === 'string' && cat.length > 0) {
        poiCategories.push(cat);
      }
    });
  }
  // 単一カテゴリがある場合はそれを使用
  else if (typeof poi.category === 'string' && poi.category.length > 0) {
    poiCategories.push(poi.category);
  }

  // POIにカテゴリがない場合は除外
  if (poiCategories.length === 0) {
    return true;
  }

  // 指定されたカテゴリのいずれかにマッチするかチェック
  const categoriesArray = options.categories;
  return !poiCategories.some(category =>
    categoriesArray.some(filterCategory => filterCategory === category)
  );
}

/**
 * 地区によるフィルタリング
 */
function isExcludedByDistrict(poi: PointOfInterest, options: POIFilterOptions): boolean {
  // 地区フィルタが指定されていない場合は除外対象でない
  if (!options.districts || options.districts.length === 0) {
    return false;
  }

  // POIに地区情報がない場合は除外
  if (typeof poi.district !== 'string' || poi.district.length === 0) {
    return true;
  }

  // 指定された地区のいずれかにマッチするかチェック
  const districtsArray = options.districts;
  return !districtsArray.some(district => district === poi.district);
}

/**
 * 駐車場情報によるフィルタリング
 */
function isExcludedByParking(poi: PointOfInterest, options: POIFilterOptions): boolean {
  return options.hasParking === true && poi.hasParking !== true;
}

/**
 * キャッシュレス対応によるフィルタリング
 */
function isExcludedByCashless(poi: PointOfInterest, options: POIFilterOptions): boolean {
  return options.hasCashless === true && poi.hasCashless !== true;
}

/**
 * キーワードによるフィルタリング
 */
function isExcludedByKeyword(poi: PointOfInterest, options: POIFilterOptions): boolean {
  // キーワードフィルタが指定されていない場合は除外対象でない
  if (options.keyword === undefined || options.keyword === '') {
    return false;
  }

  const normalizedQuery = normalizeSearchQuery(options.keyword);

  // クエリが空になった場合も除外しない
  if (normalizedQuery === '') {
    return false;
  }

  // 検索用テキストを取得
  let searchText = '';

  // POIに検索用テキストがある場合はそれを使用
  if (poi.searchText && poi.searchText !== '') {
    searchText = poi.searchText;
  }
  // なければ必要な情報から生成
  else {
    searchText = normalizeSearchText({
      名称: poi.name,
      ジャンル: typeof poi.genre === 'string' ? poi.genre : '',
      所在地: poi.address,
      地区: typeof poi.district === 'string' ? poi.district : '',
    });
  }

  // 検索テキストにクエリが含まれるかチェック
  return !searchText.includes(normalizedQuery);
}

/**
 * オブジェクトのサイズを制限してログ出力するためのヘルパー関数
 * @param obj サイズを制限するオブジェクト
 * @returns サイズ制限されたオブジェクトの複製
 */
function limitObjectSize<T extends Record<string, unknown> | POIFilterOptions | null | undefined>(
  obj: T
): Record<string, unknown> {
  // nullまたはundefinedの場合は空オブジェクトを返す
  if (obj === null || obj === undefined) {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.length > MAX_DEBUG_DATA_LENGTH) {
      // 文字列が長すぎる場合は切り詰め
      result[key] = `${value.substring(0, MAX_DEBUG_DATA_LENGTH)}... (${value.length} chars)`;
    } else if (Array.isArray(value) && value.length > 100) {
      // 配列が大きすぎる場合は要約
      result[key] = `Array(${value.length} items)`;
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * POIフィルタリング結果をキャッシュするための型
 */
interface POIFilterCache {
  options: POIFilterOptions;
  result: PointOfInterest[];
  timestamp: number;
}

// POIフィルタリング結果キャッシュ
let poiFilterCache: POIFilterCache | null = null;

// キャッシュの有効期間（ミリ秒）
const FILTER_CACHE_TTL = 3000; // 3秒

/**
 * キャッシュを使用して最適化されたPOIフィルタリング関数
 * 頻繁に呼び出される場合にパフォーマンスを向上
 * @param pois POIデータの配列
 * @param options フィルタリングオプション
 * @returns フィルタリングされたPOIデータの配列
 */
export function filterPOIsWithCache(
  pois: PointOfInterest[],
  options?: POIFilterOptions
): PointOfInterest[] {
  // 入力配列チェック
  if (pois === undefined || pois.length === 0) {
    return [];
  }

  // オプションが未指定なら全データを返す
  if (options === undefined) {
    return pois;
  }

  // 現在の時刻を取得
  const now = Date.now();

  // キャッシュ有効期限チェック
  if (
    poiFilterCache &&
    poiFilterCache.timestamp + FILTER_CACHE_TTL > now &&
    areOptionsEqual(options, poiFilterCache.options)
  ) {
    if (DEBUG_MODE) {
      logger.debug('POIフィルタキャッシュヒット', {
        component: POI_COMPONENT,
        action: 'filter_cache',
        status: 'hit',
        cacheAge: now - poiFilterCache.timestamp,
      });
    }
    return poiFilterCache.result;
  }

  // キャッシュがない場合は新たにフィルタリング
  const result = filterPOIs(pois, options);

  // 結果をキャッシュ
  poiFilterCache = {
    options: { ...options },
    result,
    timestamp: now,
  };

  return result;
}

/**
 * 2つのフィルターオプションが同一かどうか確認する
 * @param a 1つ目のオプション
 * @param b 2つ目のオプション
 * @returns 同一の場合はtrue、それ以外はfalse
 */
function areOptionsEqual(a: POIFilterOptions, b: POIFilterOptions): boolean {
  // 文字列型の比較
  if (a.keyword !== b.keyword) {
    return false;
  }

  // 配列の比較
  if (!areArraysEqual(a.types, b.types)) {
    return false;
  }

  if (!areArraysEqual(a.categories, b.categories)) {
    return false;
  }

  if (!areArraysEqual(a.districts, b.districts)) {
    return false;
  }

  // 真偽値の比較
  if (a.isOpenNow !== b.isOpenNow) {
    return false;
  }

  if (a.hasParking !== b.hasParking) {
    return false;
  }

  if (a.hasCashless !== b.hasCashless) {
    return false;
  }

  if (a.excludeClosed !== b.excludeClosed) {
    return false;
  }

  return true;
}

/**
 * 2つの配列の内容が同じかどうか確認する
 * 配列の要素の順序は考慮せず、含まれる要素が同じかどうかを判定
 * @param a 1つ目の配列
 * @param b 2つ目の配列
 * @returns 内容が同じ場合はtrue、それ以外はfalse
 */
function areArraysEqual<T>(a?: T[], b?: T[]): boolean {
  // どちらも未定義または空の場合は同じと判断
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;

  // 全ての要素がもう一方の配列に含まれているかチェック
  return a.every(item => b.includes(item)) && b.every(item => a.includes(item));
}
