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

import { logger, LogLevel } from '@/utils/logger';
import { getEnv, toBool } from '@/utils/env';

/**
 * POI関連の定数定義
 */
const POI_COMPONENT = 'POIConverter';
const DEFAULT_LAT = 38.0317; // 佐渡島の中心緯度
const DEFAULT_LNG = 138.3698; // 佐渡島の中心経度
const MAX_DEBUG_DATA_LENGTH = 200; // デバッグログに出力するデータの最大文字数

// 環境変数からログレベルを取得（型安全なアクセス）
const DEBUG_MODE = getEnv('DEBUG_MODE', {
  defaultValue: process.env.NODE_ENV === 'development',
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
 * @param genre ジャンル文字列
 * @returns 推定されたPOIタイプ
 */
export function determinePoiType(genre: string): POIType {
  if (!genre) return 'other';

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
        logger.measureTime(
          'POIデータ妥当性検証',
          () => {
            if (!rawData.名称) {
              logger.warn('名称のないPOIデータ', {
                component: POI_COMPONENT,
                action: 'validate_data',
                status: 'missing_name',
                data: rawData.所在地 || rawData.WKT || '不明',
              });
            }
          },
          DEBUG_MODE ? LogLevel.DEBUG : LogLevel.INFO
        );

        // 座標データの抽出と検証を行う
        const { lat, lng } = logger.measureTime(
          '座標データ抽出',
          () => extractCoordinates(rawData),
          DEBUG_MODE ? LogLevel.DEBUG : LogLevel.INFO,
          { component: POI_COMPONENT, action: 'extract_coordinates' }
        );

        // カテゴリー情報の抽出と正規化
        const categories = logger.measureTime(
          'カテゴリー抽出',
          () => extractCategories(rawData),
          DEBUG_MODE ? LogLevel.DEBUG : LogLevel.INFO
        );

        // POIタイプの決定（ジャンルに基づく判定）
        const poiType = logger.measureTime(
          'POIタイプ判定',
          () => determinePoiType(rawData.ジャンル),
          DEBUG_MODE ? LogLevel.DEBUG : LogLevel.INFO
        );

        // 一意なIDを生成
        const id = generateUniqueId(rawData.名称);

        // 検索用テキストの正規化
        const searchText = logger.measureTime(
          '検索テキスト正規化',
          () => normalizeSearchText(rawData),
          DEBUG_MODE ? LogLevel.DEBUG : LogLevel.INFO
        );

        // 変換結果を返す
        return {
          id,
          name: rawData.名称 || '名称不明',
          lat,
          lng,
          isClosed: rawData.閉店情報 === 'TRUE',
          type: poiType,
          category: categories.length > 0 ? categories[0] : undefined,
          categories,
          genre: rawData.ジャンル,
          hasParking: rawData.駐車場情報 === 'TRUE',
          hasCashless: rawData.キャッシュレス === 'TRUE',
          address: rawData.所在地 || '',
          district: rawData.地区,
          問い合わせ: rawData.問い合わせ,
          関連情報: rawData.関連情報,
          'Google マップで見る': rawData['Google マップで見る'],
          営業時間: rawData.営業時間 ?? formatBusinessHours(rawData),
          月曜定休日: rawData.月曜定休日 === 'TRUE',
          火曜定休日: rawData.火曜定休日 === 'TRUE',
          水曜定休日: rawData.水曜定休日 === 'TRUE',
          木曜定休日: rawData.木曜定休日 === 'TRUE',
          金曜定休日: rawData.金曜定休日 === 'TRUE',
          土曜定休日: rawData.土曜定休日 === 'TRUE',
          日曜定休日: rawData.日曜定休日 === 'TRUE',
          祝祭定休日: rawData.祝祭定休日 === 'TRUE',
          定休日について: rawData.定休日について,
          searchText,
        };
      },
      LogLevel.INFO,
      {
        component: POI_COMPONENT,
        action: 'convert_poi',
        name: rawData.名称 || '名称不明',
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
      name: rawData.名称 || '変換エラー',
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
      isClosed: true,
      type: 'other',
      address: rawData.所在地 || '',
      searchText: rawData.名称 ? rawData.名称.toLowerCase() : '',
    };
  }
}

/**
 * WKT形式の座標文字列から緯度・経度を抽出
 * @param wkt WKT文字列（例："POINT(138.4090 38.0480)"）
 * @returns 抽出された緯度・経度、抽出失敗時はnull
 */
function extractWktCoordinates(wkt: string | undefined): { lat: number; lng: number } | null {
  if (!wkt) return null;

  try {
    const wktMatch = wkt.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (wktMatch?.[1] && wktMatch[2]) {
      const lng = parseFloat(wktMatch[1]);
      const lat = parseFloat(wktMatch[2]);

      // 座標の妥当性チェック
      if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng };
      }
    }
    return null;
  } catch (error) {
    logger.debug('WKT座標解析失敗', {
      component: POI_COMPONENT,
      action: 'extract_wkt',
      wkt,
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
  if (!data.北緯 || !data.東経) return null;

  try {
    const lat = parseFloat(data.北緯);
    const lng = parseFloat(data.東経);

    // 座標の妥当性チェック
    if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
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
  if (!coords) return false;

  const { lat, lng } = coords;
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0) // 0,0は南大西洋上のためほぼ無効と見なす
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
      name: rawData.名称,
      wkt: rawData.WKT,
      lat: rawData.北緯,
      lng: rawData.東経,
      component: POI_COMPONENT,
      action: 'extract_coordinates',
      status: 'fallback_to_default',
    });

    // フォールバック
    return getDefaultCoordinates();
  } catch (error) {
    logger.error('座標解析エラー', {
      error,
      name: rawData.名称,
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
  const categories: string[] = [];
  if (rawData.和食カテゴリー === 'TRUE') categories.push('和食');
  if (rawData.洋食カテゴリー === 'TRUE') categories.push('洋食');
  if (rawData.その他カテゴリー === 'TRUE') categories.push('その他');
  if (rawData.販売カテゴリー === 'TRUE') categories.push('販売');
  return categories;
}

/**
 * 検索用テキストを生成・正規化する関数
 * @param rawData 生のPOIデータ
 * @returns 正規化された検索用テキスト
 */
function normalizeSearchText(rawData: RawPOIData): string {
  try {
    return [rawData.名称 || '', rawData.ジャンル || '', rawData.所在地 || '', rawData.地区 || '']
      .join(' ')
      .toLowerCase()
      .normalize('NFKC'); // 全角・半角の正規化
  } catch (error) {
    logger.warn('検索テキスト生成エラー', { error, component: POI_COMPONENT });
    return rawData.名称 ? rawData.名称.toLowerCase() : '';
  }
}

/**
 * 一意なIDを生成する関数
 * @param name POI名称
 * @returns 生成されたID
 */
function generateUniqueId(name: string): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 9);
  const namePart = name ? name.substring(0, 10).replace(/\s+/g, '_').toLowerCase() : 'unknown';

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
    if (rawData.営業時間) return rawData.営業時間;

    // 営業時間が個別のフィールドに分かれている場合、それらを結合
    const start1 = rawData.営業開始時間１;
    const end1 = rawData.営業終了時間１;
    const start2 = rawData.営業開始時間２;
    const end2 = rawData.営業終了時間２;

    let hours = '';

    if (start1 && end1) {
      hours = `${start1}-${end1}`;
    }

    if (start2 && end2) {
      hours += hours ? `, ${start2}-${end2}` : `${start2}-${end2}`;
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
      if (!rawDataArray || rawDataArray.length === 0) {
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
          if (rawDataArray[i]) {
            const poi = convertRawDataToPointOfInterest(rawDataArray[i]!);
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
          errors.push({
            index: i,
            name: rawDataArray[i]?.名称 || '不明',
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
  if (!pois || pois.length === 0) {
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
    if (poi.category) {
      categories.add(poi.category);
    }
    if (poi.categories) {
      poi.categories.forEach(cat => categories.add(cat));
    }

    // 地区情報を集計
    if (poi.district) {
      districts.add(poi.district);
    }

    // 閉店情報を集計
    if (poi.isClosed) {
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
      const value = String(item[key] || 'unknown');
      acc[value] = (acc[value] || 0) + 1;
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
    .replace(/\s+/g, ' ') // 連続する空白を1つに
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
      if (!pois || pois.length === 0) {
        return [];
      }

      if (!options) {
        return pois;
      }

      // 条件に一致するデータのみをフィルタリング
      const filtered = pois.filter(poi => {
        // 閉店情報フィルター
        if (options.excludeClosed && poi.isClosed) {
          return false;
        }

        // タイプフィルター
        if (options.types && options.types.length > 0 && !options.types.includes(poi.type)) {
          return false;
        }

        // カテゴリーフィルター
        if (options.categories && options.categories.length > 0) {
          const poiCategories = poi.categories || ([poi.category].filter(Boolean) as string[]);
          if (!poiCategories.some(cat => options.categories?.includes(cat as POICategory))) {
            return false;
          }
        }

        // 地区フィルター
        if (options.districts && options.districts.length > 0) {
          if (!poi.district || !options.districts.includes(poi.district as District)) {
            return false;
          }
        }

        // 駐車場フィルター
        if (options.hasParking && poi.hasParking !== true) {
          return false;
        }

        // キャッシュレスフィルター
        if (options.hasCashless && poi.hasCashless !== true) {
          return false;
        }

        // キーワード検索
        if (options.keyword) {
          const normalizedQuery = normalizeSearchQuery(options.keyword);
          const normalizedSearchText =
            poi.searchText ||
            normalizeSearchText({
              名称: poi.name,
              ジャンル: poi.genre || '',
              所在地: poi.address || '',
              地区: poi.district || '',
            } as RawPOIData);

          if (!normalizedSearchText.includes(normalizedQuery)) {
            return false;
          }
        }

        return true;
      });

      logger.debug('POIフィルタリング結果', {
        component: POI_COMPONENT,
        action: 'filter_pois',
        totalCount: pois.length,
        filteredCount: filtered.length,
        options: limitObjectSize(options),
      });

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
 * オブジェクトのサイズを制限してログ出力するためのヘルパー関数
 * @param obj サイズを制限するオブジェクト
 * @returns サイズ制限されたオブジェクトの複製
 */
function limitObjectSize<T extends Record<string, unknown> | POIFilterOptions>(
  obj: T
): Record<string, unknown> {
  if (!obj) return {};

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
