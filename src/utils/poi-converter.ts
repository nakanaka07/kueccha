/**
 * POIデータ変換関連のロジック
 */
import { limitObjectSize, safeString } from './poi-utils'; // poi-utils からインポート

import { DEFAULT_LAT, DEFAULT_LNG, POI_TYPE_PATTERNS, WKT_REGEX } from '@/constants/poi';
import { POIType, RawPOIData, PointOfInterest } from '@/types/poi-types';
import { getEnvVar } from '@/utils/env/core';
import { toBool } from '@/utils/env/transforms';
import { logger, LogLevel } from '@/utils/logger';

const POI_COMPONENT = 'POIConverter'; // このファイル固有のコンポーネント名

// 環境変数からデバッグモードの設定を取得
const debugModeStr = getEnvVar({
  key: 'VITE_DEBUG_MODE',
  defaultValue: 'false',
});
// 文字列をブール値に変換
const DEBUG_MODE = toBool(debugModeStr);

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
    // LogLevel情報とメタデータを組み合わせて渡す（引数が正しい数になるよう修正）
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
      LogLevel.INFO /* 正しい引数の数に修正 */
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
    }); // エラー時でも最低限の情報を持つオブジェクトを返す
    return {
      id: `error-${Date.now()}`,
      name: rawData.名称,
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LNG,
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
    lat: lat,
    lng: lng,
    latitude: lat, // latのエイリアスとして追加
    longitude: lng, // lngのエイリアスとして追加
    isClosed: isTrueValue(rawData.閉店情報),
    type: poiType,
    category: categories.length > 0 ? categories[0] : undefined,
    categories,
    genre: rawData.ジャンル,
    hasParking: isTrueValue(rawData.駐車場情報),
    hasCashless: isTrueValue(rawData.キャッシュレス),
    address: safeString(rawData.所在地, ''),
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
  // 配列が空の場合は早期リターン（KISS原則）
  if (rawDataArray.length === 0) {
    logger.warn('変換対象のPOIデータがありません', {
      component: POI_COMPONENT,
      action: 'convert_batch_data',
      status: 'empty_data',
    });
    return [];
  }

  // データ件数をログ記録
  logger.info('POIデータの変換を開始', {
    component: POI_COMPONENT,
    action: 'convert_batch_data',
    recordCount: rawDataArray.length,
    status: 'started',
  });
  // 各データを変換（for-of ループを使用してより安全に実装）
  const results: PointOfInterest[] = [];
  const errors: { index: number; name: string; error: string }[] = [];
  let index = 0;
  for (const item of rawDataArray) {
    try {
      if (item) {
        const poi = convertRawDataToPointOfInterest(item);
        results.push(poi);
      } else {
        logger.warn('配列内にnull/undefined要素が検出されました', {
          index,
          component: POI_COMPONENT,
          status: 'invalid_data',
        });
      }
    } catch (error) {
      // エラーを収集
      const itemName = item?.名称 ?? '不明';

      errors.push({
        index,
        name: itemName,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    index++;
  }

  // エラーがあれば警告ログに記録
  if (errors.length > 0) {
    logger.warn('一部のPOIデータの変換に失敗', {
      component: POI_COMPONENT,
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
    status: 'completed',
    successCount: results.length,
    errorCount: errors.length,
    totalCount: rawDataArray.length,
  });

  return results;
}
