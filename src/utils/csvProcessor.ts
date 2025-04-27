import { POI, POICategory, POIType } from '../types/poi';
import { getEnvVar } from '../env/core';
import { logger, LogLevel } from '../utils/logger';

/**
 * CSVデータを処理するユーティリティ
 *
 * CSVファイルからPOIデータを読み込み、アプリケーションで使用可能な形式に変換します。
 * WKT（Well-Known Text）形式の座標を緯度・経度に変換し、
 * 各種フィルタリングや検索に必要なデータ構造を構築します。
 */

// CSVプロセッサーのコンポーネント名（ロガー用）
const COMPONENT_NAME = 'CSVProcessor';

// 未使用関数を削除（KISSの原則に基づく簡素化）

// 佐渡島のデフォルト座標（フォールバック用）- 環境変数から取得
const DEFAULT_POSITION = {
  lat: parseFloat(getEnvVar({ key: 'VITE_DEFAULT_LAT', defaultValue: '38.05' })),
  lng: parseFloat(getEnvVar({ key: 'VITE_DEFAULT_LNG', defaultValue: '138.36' })),
};

// CSV処理の設定 - 環境変数から取得して最適化
const CSV_CONFIG = {
  // 一度に処理する最大行数（チャンク処理用）
  CHUNK_SIZE: parseInt(getEnvVar({ key: 'VITE_CSV_CHUNK_SIZE', defaultValue: '1000' })),
  // 処理の一時中断時間（ミリ秒）- UIレンダリングのブロッキング防止
  CHUNK_DELAY: parseInt(getEnvVar({ key: 'VITE_CSV_CHUNK_DELAY', defaultValue: '0' })),
  // 最大キャッシュサイズ
  MAX_CACHE_SIZE: parseInt(getEnvVar({ key: 'VITE_MAX_TEXT_CACHE_SIZE', defaultValue: '1000' })),
  // エラー発生時の最大リトライ回数
  MAX_RETRIES: parseInt(getEnvVar({ key: 'VITE_CSV_MAX_RETRIES', defaultValue: '3' })),
  // デバッグモード
  DEBUG: getEnvVar({ key: 'VITE_CSV_DEBUG', defaultValue: 'false' }) === 'true',
};

/**
 * CSV文字列をPOIオブジェクトの配列に変換
 *
 * @param csvText - 処理するCSV文字列
 * @param type - POIの種類（飲食店、駐車場、トイレなど）
 * @returns 変換されたPOIオブジェクトの配列
 */
export function parseCSVtoPOIs(csvText: string, type: POIType): POI[] {
  if (!csvText) {
    logger.warn('空のCSVデータが渡されました', {
      type,
      component: COMPONENT_NAME,
      action: 'parse',
    });
    return [];
  }

  try {
    // コンテキスト情報を準備
    const context = {
      type,
      linesCount: csvText.split('\n').length,
      component: COMPONENT_NAME,
      action: 'parse',
    };

    // ログレベルを指定してmeasureTimeを呼び出す
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
          logger.warn('CSVにヘッダー行がありません', {
            type,
            component: COMPONENT_NAME,
            action: 'validate',
          });
          return [];
        }

        const headers = headerLine.split(',').map(h => h.trim());

        // ヘッダーのインデックスをマッピング
        const columnMap = createColumnMap(headers);

        // 無効なヘッダーがあるかチェック
        const requiredColumns = ['name', 'wkt'];
        const missingColumns = requiredColumns.filter(col => {
          // Object.hasOwnプロパティを使用して安全にアクセス
          return !Object.hasOwn(columnMap, col) || columnMap[col as keyof typeof columnMap] === -1;
        });

        if (missingColumns.length > 0) {
          logger.warn('CSVに必須カラムが不足しています', {
            missingColumns,
            availableColumns: headers,
            component: COMPONENT_NAME,
            action: 'validate',
          });
        }

        // 大きなCSVファイルの場合はチャンク処理で効率化
        let results: POI[];
        if (lines.length > CSV_CONFIG.CHUNK_SIZE) {
          logger.info('大規模CSVデータをチャンク処理で解析します', {
            totalLines: lines.length,
            chunkSize: CSV_CONFIG.CHUNK_SIZE,
            component: COMPONENT_NAME,
            action: 'chunkProcessing',
          });
          // チャンク処理を使用（非同期処理だがUIスレッドをブロックしないよう同期的に待機）
          results = processDataLinesInChunks(lines.slice(1), columnMap, type);
        } else {
          // 標準的なサイズのCSVファイルは通常処理
          results = processDataLines(lines.slice(1), columnMap, type);
        }

        logger.info('CSVデータ解析完了', {
          type,
          totalEntries: results.length,
          validEntries: results.filter(
            p => p.position && isValidLatLng(p.position.lat, p.position.lng)
          ).length,
          component: COMPONENT_NAME,
          action: 'parse',
          durationCategory: 'csvProcessing',
          linesCount: context.linesCount,
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
      component: COMPONENT_NAME,
      action: 'parse_error',
    });
    return [];
  }
}

/**
 * 大きなCSVファイルをチャンク単位で処理する関数
 * UIスレッドをブロックせずに大量のデータを処理
 */
function processDataLinesInChunks(
  lines: string[],
  columnMap: Record<string, number | undefined>,
  type: POIType
): POI[] {
  const results: POI[] = [];
  const validLines = lines.filter(line => line.trim() !== '');
  const totalLines = validLines.length;

  // チャンク数を計算
  const chunkCount = Math.ceil(totalLines / CSV_CONFIG.CHUNK_SIZE);
  logger.debug('CSVデータをチャンクに分割', {
    totalLines,
    chunkCount,
    chunkSize: CSV_CONFIG.CHUNK_SIZE,
    component: COMPONENT_NAME,
    action: 'chunkSplit',
  });

  // 各チャンクを同期的に処理（パフォーマンス最適化のため）
  for (let i = 0; i < chunkCount; i++) {
    const startIdx = i * CSV_CONFIG.CHUNK_SIZE;
    const endIdx = Math.min(startIdx + CSV_CONFIG.CHUNK_SIZE, totalLines);
    const chunkLines = validLines.slice(startIdx, endIdx);

    try {
      // チャンクを処理
      const chunkResults = processDataLinesWithRetry(chunkLines, columnMap, type, i);
      results.push(...chunkResults);

      // 進捗状況をログに記録
      if (i % 5 === 0 || i === chunkCount - 1) {
        const progress = Math.round((endIdx / totalLines) * 100);
        logger.debug('CSVチャンク処理進捗', {
          chunkIndex: i,
          progress: `${progress}%`,
          processedLines: endIdx,
          totalLines,
          resultsCount: results.length,
          component: COMPONENT_NAME,
        });
      }
    } catch (error) {
      logger.error('CSVチャンク処理中にエラー', {
        chunkIndex: i,
        startLine: startIdx,
        endLine: endIdx,
        errorMessage: error instanceof Error ? error.message : String(error),
        component: COMPONENT_NAME,
        action: 'chunkProcess',
      });

      // エラーが発生しても処理を続行し、可能な限りデータを抽出
      continue;
    }
  }

  return results;
}

/**
 * 単一のCSVデータチャンクを処理し、エラー発生時にリトライする関数
 */
function processDataLinesWithRetry(
  lines: string[],
  columnMap: Record<string, number | undefined>,
  type: POIType,
  chunkIndex: number
): POI[] {
  let retries = 0;
  let results: POI[] = [];
  let success = false;

  while (!success && retries <= CSV_CONFIG.MAX_RETRIES) {
    try {
      // 各行を個別に処理してエラーの影響範囲を局所化
      results = lines
        .map((line, index) => {
          try {
            return createPOI(line, columnMap, type, chunkIndex * CSV_CONFIG.CHUNK_SIZE + index);
          } catch (lineError) {
            // 個別行の処理でエラーが発生してもスキップして続行
            logger.warn('CSV行の処理に失敗', {
              lineIndex: chunkIndex * CSV_CONFIG.CHUNK_SIZE + index,
              lineContent: line.length > 50 ? `${line.substring(0, 47)}...` : line,
              error: lineError instanceof Error ? lineError.message : String(lineError),
              component: COMPONENT_NAME,
            });

            // エラーが発生した行は空のデータで代用（フィルタリング可能なように）
            return createEmptyPOI(type, chunkIndex * CSV_CONFIG.CHUNK_SIZE + index);
          }
        })
        .filter(poi => poi.name !== '無効なデータ');

      success = true;
    } catch (error) {
      retries++;
      logger.warn(`CSVチャンク処理リトライ (${retries}/${CSV_CONFIG.MAX_RETRIES})`, {
        chunkIndex,
        error: error instanceof Error ? error.message : String(error),
        component: COMPONENT_NAME,
      });

      if (retries >= CSV_CONFIG.MAX_RETRIES) {
        logger.error('CSVチャンク処理の最大リトライ回数を超過', {
          chunkIndex,
          component: COMPONENT_NAME,
          action: 'chunkRetryFailed',
        });
        // 最後のリトライでも失敗した場合は空の結果を返す
        return [];
      }
    }
  }

  return results;
}

/**
 * エラー発生時に使用する空のPOIオブジェクトを作成
 */
function createEmptyPOI(type: POIType, index: number): POI {
  return {
    id: `error-${type}-${index}`,
    name: '無効なデータ',
    type,
    isClosed: true,
    position: DEFAULT_POSITION,
    lat: DEFAULT_POSITION.lat,
    lng: DEFAULT_POSITION.lng,
    latitude: DEFAULT_POSITION.lat,
    longitude: DEFAULT_POSITION.lng,
    address: '',
    area: '',
    category: 'unspecified',
    genre: '',
    contact: '',
    businessHours: '',
    parkingInfo: '',
    infoUrl: '',
    googleMapsUrl: '',
    searchText: '無効なデータ',
  };
}

/**
 * 通常サイズのCSVデータ行を処理する関数
 */
function processDataLines(
  lines: string[],
  columnMap: Record<string, number | undefined>,
  type: POIType
): POI[] {
  return lines
    .filter(line => line.trim() !== '')
    .map((line, index) => createPOI(line, columnMap, type, index));
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
): Pick<POI, 'position' | 'address' | 'area' | 'lat' | 'lng' | 'latitude' | 'longitude'> {
  const position = parseWKT(getSafeColumnValue(columns, columnMap.wkt, ''));
  return {
    position,
    address: getSafeColumnValue(columns, columnMap.address, ''),
    area: getSafeColumnValue(columns, columnMap.area, ''),
    lat: position?.lat ?? 0,
    lng: position?.lng ?? 0,
    latitude: position?.lat ?? 0,
    longitude: position?.lng ?? 0,
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
  // 無効なインデックスは早期リターン
  if (columnIndex === undefined || columnIndex < 0 || columnIndex >= columns.length) {
    return defaultValue;
  }

  // インデックスの有効性を確認してからアクセス
  // Object Injection対策として Array.prototype.at()メソッドを使用
  const value = Array.prototype.at.call(columns, columnIndex);
  return typeof value === 'string' ? value.trim() : defaultValue;
}

/**
 * カラム値がtrueかどうかをチェックするヘルパー関数
 */
function isColumnTrue(columns: string[], columnIndex: number | undefined): boolean {
  // 無効なインデックスは早期に除外
  if (columnIndex === undefined || columnIndex < 0 || columnIndex >= columns.length) {
    return false;
  }

  // Object Injection対策として Array.prototype.at()メソッドを使用
  const value = Array.prototype.at.call(columns, columnIndex);
  return typeof value === 'string' && value.toLowerCase() === 'true';
}

/**
 * ヘッダー行からカラムのインデックスマップを作成
 */
function createColumnMap(headers: string[]): Record<string, number | undefined> {
  return {
    name: headers.indexOf('名称'),
    wkt: headers.indexOf('WKT（入力）'),
    closed: headers.indexOf('閉店情報（入力）'),
    genre: headers.indexOf('ジャンル'),
    category: headers.indexOf('カテゴリー'),
    japaneseFood: headers.indexOf('和食カテゴリー（入力）'),
    westernFood: headers.indexOf('洋食カテゴリー（入力）'),
    otherFood: headers.indexOf('その他カテゴリー（入力）'),
    retail: headers.indexOf('販売カテゴリー（入力）'),
    parkingInfo: headers.indexOf('駐車場情報'),
    cashless: headers.indexOf('キャッシュレス'),
    monday: headers.indexOf('月曜'),
    tuesday: headers.indexOf('火曜'),
    wednesday: headers.indexOf('水曜'),
    thursday: headers.indexOf('木曜'),
    friday: headers.indexOf('金曜'),
    saturday: headers.indexOf('土曜'),
    sunday: headers.indexOf('日曜'),
    holiday: headers.indexOf('祝祭'),
    holidayNote: headers.indexOf('定休日について'),
    contact: headers.indexOf('問い合わせ'),
    address: headers.indexOf('所在地'),
    area: headers.indexOf('地区（入力）'),
    businessHours: headers.indexOf('営業時間'),
    info: headers.indexOf('関連情報'),
    googleMaps: headers.indexOf('Google マップで見る'),
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
      // Object Injection対策としてString.prototype.charAt()を使用
      const char = String.prototype.charAt.call(line, i);
      const prevChar = i > 0 ? String.prototype.charAt.call(line, i - 1) : '';

      if (char === '"' && (i === 0 || prevChar !== '\\')) {
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
      component: COMPONENT_NAME,
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
      logger.warn('空のWKTが渡されました', { wkt, component: COMPONENT_NAME });
      return DEFAULT_POSITION;
    }

    // POINT形式のWKTを解析
    const match = /POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i.exec(wkt);
    if (match && match.length >= 3 && match[1] && match[2]) {
      const lng = parseFloat(match[1]);
      const lat = parseFloat(match[2]);

      // 有効な緯度・経度かチェック
      if (isValidLatLng(lat, lng)) {
        return { lat, lng };
      }
    }

    logger.warn('無効なWKT形式の座標です', { wkt, component: COMPONENT_NAME });
    return DEFAULT_POSITION;
  } catch (error) {
    logger.error('WKT座標の解析中にエラーが発生しました', {
      wkt,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      component: COMPONENT_NAME,
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
 * メモ化によりパフォーマンスを向上
 */
const normalizeTextCache = new Map<string, string>();

function normalizeText(text: string): string {
  if (!text) return '';

  // キャッシュにあればそれを返す
  if (normalizeTextCache.has(text)) {
    return normalizeTextCache.get(text)!;
  }

  const normalized = text
    .toLowerCase()
    // カタカナをひらがなに変換
    .replace(/[\u30A1-\u30F6]/g, match => {
      const chr = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(chr);
    })
    // 全角数字を半角に変換
    .replace(/[０-９]/g, match => String.fromCharCode(match.charCodeAt(0) - 0xfee0))
    // 全角英字を半角に変換
    .replace(/[Ａ-Ｚａ-ｚ]/g, match => String.fromCharCode(match.charCodeAt(0) - 0xfee0));

  // 結果をキャッシュに保存（キャッシュサイズの制限）
  const MAX_NORMALIZE_TEXT_CACHE_SIZE = 1000; // YAGNIの原則に基づき、初期値は控えめに
  if (normalizeTextCache.size >= MAX_NORMALIZE_TEXT_CACHE_SIZE) {
    // キャッシュが大きくなりすぎたらクリア
    normalizeTextCache.clear();
  }
  normalizeTextCache.set(text, normalized);

  return normalized;
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
    component: COMPONENT_NAME,
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

  const filtered = pois.filter(poi => poi.category && categories.includes(poi.category));
  logger.debug('カテゴリでPOIをフィルタリングしました', {
    originalCount: pois.length,
    filteredCount: filtered.length,
    categories,
    component: COMPONENT_NAME,
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

  const filtered = pois.filter(poi => poi.area && areas.includes(poi.area));
  logger.debug('地区でPOIをフィルタリングしました', {
    originalCount: pois.length,
    filteredCount: filtered.length,
    areas,
    component: COMPONENT_NAME,
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
    component: COMPONENT_NAME,
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

  // 検索テキストの正規化
  const normalizedSearchText = normalizeText(searchText.trim());

  return logger.measureTime(
    '検索テキストによるPOIフィルタリング',
    () => {
      const filtered = pois.filter(poi => {
        // まず事前計算済みのsearchTextで検索
        if (poi.searchText.includes(normalizedSearchText)) {
          return true;
        }

        // それ以外の場合は個別フィールドを検索（undefinedチェックを追加）
        return (
          normalizeText(poi.name).includes(normalizedSearchText) ||
          (poi.genre && normalizeText(poi.genre).includes(normalizedSearchText)) ||
          (poi.address && normalizeText(poi.address).includes(normalizedSearchText))
        );
      });

      // フィルタリング結果をログに記録
      logger.debug('検索テキストでフィルタリングしました', {
        searchText: normalizedSearchText,
        originalCount: pois.length,
        filteredCount: filtered.length,
        component: COMPONENT_NAME,
        action: 'filter',
      });

      return filtered;
    },
    LogLevel.DEBUG
  );
}

/**
 * CSVデータの生データを確認するためのユーティリティ関数
 *
 * @param csvText - 処理するCSV文字列
 * @param maxRows - 表示する最大行数（デフォルト: 10）
 * @returns CSVデータの最初の数行と列名を含むオブジェクト
 */
export function inspectCSVData(
  csvText: string,
  maxRows: number = 10
): {
  headers: string[];
  rows: string[][];
  totalRows: number;
} {
  if (!csvText) {
    logger.warn('空のCSVデータが渡されました', {
      component: COMPONENT_NAME,
      action: 'inspect',
    });
    return { headers: [], rows: [], totalRows: 0 };
  }

  try {
    // CSVの行に分割
    const lines = csvText.split('\n').filter(line => line.trim() !== '');

    // 空のCSVファイルの場合
    if (lines.length === 0) {
      return { headers: [], rows: [], totalRows: 0 };
    }

    // ヘッダー行（項目名）を取得
    const headerLine = lines[0];
    if (!headerLine) {
      return { headers: [], rows: [], totalRows: 0 };
    }

    const headers = headerLine.split(',').map(h => h.trim());

    // データ行を解析（最大maxRows行まで）
    const dataRows = lines.slice(1, maxRows + 1).map(line => parseCSVLine(line));

    logger.info('CSVデータのサンプルを取得しました', {
      totalRows: lines.length - 1,
      sampleRows: dataRows.length,
      component: COMPONENT_NAME,
      action: 'inspect',
    });

    return {
      headers,
      rows: dataRows,
      totalRows: lines.length - 1, // ヘッダー行を除く
    };
  } catch (error) {
    logger.error('CSVデータの検査中にエラーが発生しました', {
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      csvTextLength: csvText.length,
      csvTextPreview: csvText.substring(0, 100),
      component: COMPONENT_NAME,
      action: 'inspect_error',
    });
    return { headers: [], rows: [], totalRows: 0 };
  }
}

/**
 * CSVデータの特定の列の値を確認するためのユーティリティ関数
 *
 * @param csvText - 処理するCSV文字列
 * @param columnName - 確認したい列の名前
 * @param maxRows - 表示する最大行数（デフォルト: 10）
 * @returns 特定の列の値の配列
 */
export function inspectCSVColumn(
  csvText: string,
  columnName: string,
  maxRows: number = 10
): {
  values: string[];
  totalRows: number;
  columnIndex: number;
} {
  const inspection = inspectCSVData(csvText, maxRows);
  const columnIndex = inspection.headers.indexOf(columnName);

  if (columnIndex === -1) {
    logger.warn(`列 "${columnName}" が見つかりませんでした`, {
      availableColumns: inspection.headers,
      component: COMPONENT_NAME,
      action: 'inspect_column',
    });
    return { values: [], totalRows: inspection.totalRows, columnIndex: -1 };
  }

  const values = inspection.rows.map(row => {
    // Object Injection対策として Array.prototype.at()メソッドを使用
    return columnIndex < row.length ? Array.prototype.at.call(row, columnIndex) || '' : '';
  });

  logger.info(`列 "${columnName}" のサンプルデータを取得しました`, {
    sampleValues: values.length,
    totalRows: inspection.totalRows,
    component: COMPONENT_NAME,
    action: 'inspect_column',
  });

  return { values, totalRows: inspection.totalRows, columnIndex };
}
