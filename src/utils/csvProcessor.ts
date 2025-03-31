import { POI, POICategory, POIType } from '@/types/poi';
import { logger, LogLevel } from '@/utils/logger';

/**
 * CSVデータを処理するユーティリティ
 *
 * CSVファイルからPOIデータを読み込み、アプリケーションで使用可能な形式に変換します。
 * WKT（Well-Known Text）形式の座標を緯度・経度に変換し、
 * 各種フィルタリングや検索に必要なデータ構造を構築します。
 */

// 佐渡島のデフォルト座標（フォールバック用）
const DEFAULT_POSITION = { lat: 38.0413, lng: 138.3689 };

/**
 * CSV文字列をPOIオブジェクトの配列に変換
 *
 * @param csvText - 処理するCSV文字列
 * @param type - POIの種類（飲食店、駐車場、トイレなど）
 * @returns 変換されたPOIオブジェクトの配列
 */
export function parseCSVtoPOIs(csvText: string, type: POIType): POI[] {
  if (!csvText) {
    logger.warn('空のCSVデータが渡されました', { type });
    return [];
  }

  try {
    return logger.measureTime(
      'CSV解析処理',
      () => {
        // CSVの行に分割
        const lines = csvText.split('\n');

        // 空のCSVファイルの場合
        if (lines.length === 0) {
          return [];
        }

        // ヘッダー行（項目名）を取得
        const headerLine = lines[0];
        if (!headerLine) {
          logger.warn('CSVにヘッダー行がありません', { type });
          return [];
        }

        const headers = headerLine.split(',').map(h => h.trim());

        // ヘッダーのインデックスをマッピング
        const columnMap = createColumnMap(headers);

        // 無効なヘッダーがあるかチェック
        const requiredColumns = ['name', 'wkt'];
        const missingColumns = requiredColumns.filter(col => columnMap[col] === -1);

        if (missingColumns.length > 0) {
          logger.warn('CSVに必須カラムが不足しています', {
            missingColumns,
            availableColumns: headers,
          });
        }

        // ヘッダーの後の行からデータを処理
        const results = lines
          .slice(1)
          .filter(line => line.trim() !== '')
          .map((line, index) => createPOI(line, columnMap, type, index));

        logger.info('CSVデータ解析完了', {
          type,
          totalEntries: results.length,
          validEntries: results.filter(p => isValidLatLng(p.position.lat, p.position.lng)).length,
        });

        return results;
      },
      LogLevel.INFO
    );
  } catch (error) {
    logger.error('CSVデータの解析中にエラーが発生しました', {
      type,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      csvTextLength: csvText.length,
      csvTextPreview: csvText.substring(0, 100),
    });
    return [];
  }
}

/**
 * 1行のCSVデータからPOIオブジェクトを作成
 * 複雑度を下げるために小さな責務に分割
 */
function createPOI(
  line: string,
  columnMap: Record<string, number | undefined>,
  type: POIType,
  index: number
): POI {
  // CSVの列を分割（カンマの中にカンマがある場合を考慮）
  const columns = parseCSVLine(line);

  // POIの基本情報を抽出
  const basicInfo = extractBasicInfo(columns, columnMap, type, index);

  // POIの位置情報を抽出
  const locationInfo = extractLocationInfo(columns, columnMap);

  // POIのカテゴリ情報を抽出
  const categoryInfo = extractCategoryInfo(columns, columnMap);

  // POIの詳細情報を抽出
  const detailInfo = extractDetailInfo(columns, columnMap);

  // 検索用のテキストを準備
  const searchText = createSearchText(columns, columnMap);

  // 各情報を組み合わせてPOIオブジェクトを構築
  return {
    ...basicInfo,
    ...locationInfo,
    ...categoryInfo,
    ...detailInfo,
    searchText,
  };
}

/**
 * POIの基本情報を抽出
 */
function extractBasicInfo(
  columns: string[],
  columnMap: Record<string, number | undefined>,
  type: POIType,
  index: number
): Pick<POI, 'id' | 'name' | 'type' | 'isClosed'> {
  return {
    id: `${type}-${index}`,
    name: getSafeColumnValue(columns, columnMap.name, '名称不明'),
    type,
    isClosed: getSafeColumnValue(columns, columnMap.closed, '').toLowerCase() === 'true',
  };
}

/**
 * POIの位置情報を抽出
 */
function extractLocationInfo(
  columns: string[],
  columnMap: Record<string, number | undefined>
): Pick<POI, 'position' | 'address' | 'area'> {
  return {
    position: parseWKT(getSafeColumnValue(columns, columnMap.wkt, '')),
    address: getSafeColumnValue(columns, columnMap.address, ''),
    area: getSafeColumnValue(columns, columnMap.area, ''),
  };
}

/**
 * POIのカテゴリ情報を抽出
 */
function extractCategoryInfo(
  columns: string[],
  columnMap: Record<string, number | undefined>
): Pick<POI, 'category' | 'genre'> {
  const category = determineCategory(
    isColumnTrue(columns, columnMap.japaneseFood),
    isColumnTrue(columns, columnMap.westernFood),
    isColumnTrue(columns, columnMap.otherFood),
    isColumnTrue(columns, columnMap.retail)
  );

  return {
    category,
    genre: getSafeColumnValue(columns, columnMap.genre, ''),
  };
}

/**
 * POIの詳細情報を抽出
 */
function extractDetailInfo(
  columns: string[],
  columnMap: Record<string, number | undefined>
): Pick<POI, 'contact' | 'businessHours' | 'parkingInfo' | 'infoUrl' | 'googleMapsUrl'> {
  return {
    contact: getSafeColumnValue(columns, columnMap.contact, ''),
    businessHours: getSafeColumnValue(columns, columnMap.businessHours, ''),
    parkingInfo: getSafeColumnValue(columns, columnMap.parkingInfo, ''),
    infoUrl: getSafeColumnValue(columns, columnMap.info, ''),
    googleMapsUrl: getSafeColumnValue(columns, columnMap.googleMaps, ''),
  };
}

/**
 * 検索用のテキストを作成
 */
function createSearchText(
  columns: string[],
  columnMap: Record<string, number | undefined>
): string {
  const searchTextRaw = [
    getSafeColumnValue(columns, columnMap.name, ''),
    getSafeColumnValue(columns, columnMap.genre, ''),
    getSafeColumnValue(columns, columnMap.address, ''),
  ].join(' ');

  return normalizeText(searchTextRaw);
}

/**
 * カラム値を安全に取得するヘルパー関数
 */
function getSafeColumnValue(
  columns: string[],
  columnIndex: number | undefined,
  defaultValue: string
): string {
  if (columnIndex === undefined || columnIndex === -1 || columnIndex >= columns.length) {
    return defaultValue;
  }
  return columns[columnIndex]?.trim() ?? defaultValue;
}

/**
 * カラム値がtrueかどうかをチェックするヘルパー関数
 */
function isColumnTrue(columns: string[], columnIndex: number | undefined): boolean {
  if (columnIndex === undefined || columnIndex === -1 || columnIndex >= columns.length) {
    return false;
  }
  return columns[columnIndex]?.toLowerCase() === 'true';
}

/**
 * ヘッダー行からカラムのインデックスマップを作成
 */
function createColumnMap(headers: string[]): Record<string, number | undefined> {
  return {
    name: headers.indexOf('名称（入力）'),
    wkt: headers.indexOf('WKT（入力）'),
    closed: headers.indexOf('閉店情報（入力）'),
    genre: headers.indexOf('ジャンル（入力）'),
    japaneseFood: headers.indexOf('和食カテゴリー（入力）'),
    westernFood: headers.indexOf('洋食カテゴリー（入力）'),
    otherFood: headers.indexOf('その他カテゴリー（入力）'),
    retail: headers.indexOf('販売カテゴリー（入力）'),
    parkingInfo: headers.indexOf('駐車場情報（入力）'),
    contact: headers.indexOf('問い合わせ（入力）'),
    address: headers.indexOf('所在地（入力）'),
    area: headers.indexOf('地区（入力）'),
    businessHours: headers.indexOf('営業時間'),
    info: headers.indexOf('関連情報（入力）'),
    googleMaps: headers.indexOf('Google マップで見る（入力）'),
  };
}

/**
 * CSVの行を適切に解析する関数（引用符で囲まれたカンマを処理）
 */
function parseCSVLine(line: string): string[] {
  try {
    const result: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    // 最後の値を追加
    result.push(currentValue);

    return result;
  } catch (error) {
    logger.warn('CSV行の解析中にエラーが発生しました', {
      line: line.substring(0, 50) + (line.length > 50 ? '...' : ''),
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    // エラーが発生した場合は単純にカンマで分割
    return line.split(',');
  }
}

/**
 * WKT形式の座標文字列から緯度・経度を抽出
 * 例: "POINT (138.4665294 38.319763)" → { lat: 38.319763, lng: 138.4665294 }
 */
function parseWKT(wkt: string): google.maps.LatLngLiteral {
  try {
    if (!wkt) {
      logger.warn('空のWKTが渡されました', { wkt });
      return DEFAULT_POSITION;
    }

    // POINT形式のWKTを解析
    const match = wkt.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
    if (match && match.length >= 3 && match[1] && match[2]) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);

      // 有効な緯度・経度かチェック
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }

    logger.warn('無効なWKT形式の座標です', { wkt });
    return DEFAULT_POSITION;
  } catch (error) {
    logger.error('WKT座標の解析中にエラーが発生しました', {
      wkt,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return DEFAULT_POSITION;
  }
}

/**
 * 緯度・経度が有効な範囲内かチェック
 */
function isValidLatLng(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * POIカテゴリーを決定
 */
function determineCategory(
  isJapanese: boolean,
  isWestern: boolean,
  isOther: boolean,
  isRetail: boolean
): POICategory {
  if (isRetail) return 'retail';
  if (isJapanese && !isWestern && !isOther) return 'japanese';
  if (!isJapanese && isWestern && !isOther) return 'western';
  if (!isJapanese && !isWestern && isOther) return 'other';
  if (isJapanese && isWestern) return 'fusion';

  // デフォルト
  return 'unspecified';
}

/**
 * テキストを検索用に正規化（ひらがな・カタカナの区別なく検索できるように）
 */
function normalizeText(text: string): string {
  if (!text) return '';

  return (
    text
      .toLowerCase()
      // カタカナをひらがなに変換
      .replace(/[\u30A1-\u30F6]/g, match => {
        const chr = match.charCodeAt(0) - 0x60;
        return String.fromCharCode(chr);
      })
      // 全角数字を半角に変換
      .replace(/[０-９]/g, match => String.fromCharCode(match.charCodeAt(0) - 0xfee0))
      // 全角英字を半角に変換
      .replace(/[Ａ-Ｚａ-ｚ]/g, match => String.fromCharCode(match.charCodeAt(0) - 0xfee0))
  );
}

/**
 * 複数のCSVデータを結合
 *
 * @param poiArrays - 結合するPOI配列の配列
 * @returns 結合されたPOI配列
 */
export function combinePOIArrays(...poiArrays: POI[][]): POI[] {
  const combined = poiArrays.flat();
  logger.debug('POI配列を結合しました', {
    inputArrayCount: poiArrays.length,
    totalPOICount: combined.length,
    poiCountByType: poiArrays.map(arr => arr.length),
  });
  return combined;
}

/**
 * POIデータをカテゴリでフィルタリング
 *
 * @param pois - フィルタリングするPOI配列
 * @param categories - 表示するカテゴリの配列
 * @returns フィルタリングされたPOI配列
 */
export function filterPOIsByCategory(pois: POI[], categories: POICategory[]): POI[] {
  // 空のカテゴリ配列の場合はフィルタリングしない
  if (categories.length === 0) {
    return pois;
  }

  const filtered = pois.filter(poi => categories.includes(poi.category));
  logger.debug('カテゴリでPOIをフィルタリングしました', {
    originalCount: pois.length,
    filteredCount: filtered.length,
    categories,
  });
  return filtered;
}

/**
 * POIデータを地区でフィルタリング
 *
 * @param pois - フィルタリングするPOI配列
 * @param areas - 表示する地区の配列
 * @returns フィルタリングされたPOI配列
 */
export function filterPOIsByArea(pois: POI[], areas: string[]): POI[] {
  // 空の地区配列の場合はフィルタリングしない
  if (areas.length === 0) {
    return pois;
  }

  const filtered = pois.filter(poi => areas.includes(poi.area));
  logger.debug('地区でPOIをフィルタリングしました', {
    originalCount: pois.length,
    filteredCount: filtered.length,
    areas,
  });
  return filtered;
}

/**
 * POIデータの営業状態でフィルタリング
 *
 * @param pois - フィルタリングするPOI配列
 * @param includeOpen - 営業中のPOIを含める
 * @param includeClosed - 閉店したPOIを含める
 * @returns フィルタリングされたPOI配列
 */
export function filterPOIsByStatus(
  pois: POI[],
  includeOpen: boolean = true,
  includeClosed: boolean = false
): POI[] {
  // 両方含める場合はフィルタリングしない
  if (includeOpen && includeClosed) {
    return pois;
  }

  // 両方含めない場合は空配列を返す
  if (!includeOpen && !includeClosed) {
    return [];
  }

  const filtered = pois.filter(poi => {
    return (includeOpen && !poi.isClosed) || (includeClosed && poi.isClosed);
  });

  logger.debug('営業状態でPOIをフィルタリングしました', {
    originalCount: pois.length,
    filteredCount: filtered.length,
    includeOpen,
    includeClosed,
    openCount: filtered.filter(poi => !poi.isClosed).length,
    closedCount: filtered.filter(poi => poi.isClosed).length,
  });

  return filtered;
}

/**
 * POIデータを検索テキストでフィルタリング
 *
 * @param pois - フィルタリングするPOI配列
 * @param searchText - 検索テキスト
 * @returns フィルタリングされたPOI配列
 */
export function filterPOIsBySearchText(pois: POI[], searchText: string): POI[] {
  if (!searchText || searchText.trim() === '') {
    return pois;
  }

  const normalizedSearchText = normalizeText(searchText);
  const startTime = performance.now();

  const filtered = pois.filter(
    poi =>
      poi.searchText.includes(normalizedSearchText) ||
      normalizeText(poi.name).includes(normalizedSearchText) ||
      normalizeText(poi.genre).includes(normalizedSearchText) ||
      normalizeText(poi.address).includes(normalizedSearchText)
  );

  const duration = performance.now() - startTime;
  logger.debug('テキスト検索でPOIをフィルタリングしました', {
    searchText: normalizedSearchText,
    originalCount: pois.length,
    filteredCount: filtered.length,
    durationMs: duration.toFixed(2),
  });

  return filtered;
}
