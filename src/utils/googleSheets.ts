import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';

import { parseCSVtoPOIs } from './csvProcessor';

import type { POIType } from '@/types/poi-types';
import { getEnv } from '@/utils/env/core';
import { logger } from '@/utils/logger';

/**
 * シートデータの型定義
 */
interface SheetData {
  range: string;
  majorDimension: string;
  values: string[][];
}

/**
 * Google Sheets APIレスポンスの型定義
 */
interface SheetsResponse {
  spreadsheetId: string;
  valueRanges: SheetData[];
}

/**
 * キャッシュエントリの型定義
 */
interface CacheEntry {
  range: string;
  data: SheetData;
  timestamp: number;
}

/**
 * POI データキャッシュのデータベース構造
 */
interface POIDatabase {
  sheets: {
    key: string;
    value: CacheEntry;
    indexes: { timestamp: number };
  };
}

/**
 * APIエラーメッセージのマッピング
 */
const API_ERROR_MESSAGES = {
  403: 'Google Sheets APIキーの権限が不足しています',
  404: 'スプレッドシートが見つかりません',
  default: 'API応答エラー',
};

/**
 * キャッシュ制御設定
 */
const CACHE_CONFIG = {
  /** キャッシュ有効期限（ミリ秒）: 60分 */
  EXPIRY_MS: 60 * 60 * 1000,
  /** データベース名 */
  DB_NAME: 'poi-cache-db',
  /** データベースバージョン */
  DB_VERSION: 1,
};

/**
 * IndexedDBの初期化
 * @returns IndexedDBのインスタンス
 */
async function initDB(): Promise<IDBPDatabase<POIDatabase>> {
  return openDB<POIDatabase>(CACHE_CONFIG.DB_NAME, CACHE_CONFIG.DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sheets')) {
        const store = db.createObjectStore('sheets', { keyPath: 'range' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    },
  });
}

/**
 * キャッシュエントリが有効かどうかを確認
 * @param timestamp キャッシュのタイムスタンプ
 * @returns 有効ならtrue、期限切れならfalse
 */
function isCacheValid(timestamp: number): boolean {
  const currentTime = Date.now();
  const expiryTime = timestamp + CACHE_CONFIG.EXPIRY_MS;
  return currentTime < expiryTime;
}

/**
 * Google Sheets APIからデータを取得する
 * @param sheetRanges 取得するシート範囲の配列
 * @returns シートデータの配列
 */
export async function fetchFromGoogleSheets(sheetRanges: string[]): Promise<SheetData[]> {
  // 型安全な環境変数アクセス
  const API_KEY = getEnv('VITE_GOOGLE_API_KEY', { required: true }).trim();
  const SPREADSHEET_ID = getEnv('VITE_GOOGLE_SPREADSHEET_ID', { required: true }).trim();

  // オフラインサポート - キャッシュからデータ取得を試みる
  try {
    // オンラインの場合はAPIから取得
    if (navigator.onLine) {
      logger.info('Google Sheets APIからデータを取得します', {
        component: 'googleSheets',
        action: 'fetch_api',
        ranges: sheetRanges,
      });

      // 複数のシート範囲をURLパラメータに変換
      const ranges = sheetRanges.map(range => `ranges=${encodeURIComponent(range)}`).join('&');
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${ranges}&key=${API_KEY}`;

      const response = await fetch(url);

      // HTTPステータスコードによる詳細なエラーハンドリング
      if (!response.ok) {
        const statusCode = response.status;
        let errorText: string;
        try {
          errorText = await response.text();
        } catch {
          // 例外変数を省略
          errorText = 'レスポンステキストの取得に失敗しました';
        }

        logger.error(`Google Sheets API応答エラー`, {
          component: 'googleSheets',
          action: 'api_error',
          statusCode,
          errorText,
          spreadsheetId: SPREADSHEET_ID,
        }); // 特定のステータスコードに対するエラーメッセージ
        const errorMessage =
          API_ERROR_MESSAGES[statusCode as keyof typeof API_ERROR_MESSAGES] ||
          `${API_ERROR_MESSAGES.default}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // 明示的な型アサーションでany型の使用を回避
      const data = (await response.json()) as SheetsResponse;

      // 成功時のINFOログ
      logger.info('Google Sheets APIからデータを取得しました', {
        component: 'googleSheets',
        action: 'fetch_success',
        ranges: sheetRanges,
        rowCounts: data.valueRanges.map(range => range.values.length || 0),
      }); // キャッシュへのデータ保存
      try {
        const db = await initDB();
        const tx = db.transaction('sheets', 'readwrite');
        const now = Date.now();
        const batchPromises = [];

        // バッチ処理による効率的なキャッシュ保存
        for (const valueRange of data.valueRanges) {
          batchPromises.push(
            tx.store.put({
              range: valueRange.range,
              data: valueRange,
              timestamp: now,
            })
          );
        }

        // Promise.allでバッチ処理を並列実行
        await Promise.all(batchPromises);
        await tx.done;

        logger.debug('シートデータをキャッシュに保存しました', {
          component: 'googleSheets',
          action: 'cache_save',
          ranges: sheetRanges,
          itemCount: data.valueRanges.length,
        });
      } catch (cacheError) {
        logger.warn('キャッシュへのデータ保存に失敗しました', {
          component: 'googleSheets',
          action: 'cache_save_error',
          error: cacheError instanceof Error ? cacheError.message : String(cacheError),
        });
        // キャッシュエラーは許容してAPIデータを返す
      }

      return data.valueRanges;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(`Google Sheets APIエラー`, {
      component: 'googleSheets',
      action: 'fetch_error',
      error: errorMessage,
      isOnline: navigator.onLine,
    });

    // API取得に失敗した場合、キャッシュから取得を試みる
    logger.info('キャッシュからデータの取得を試みます', {
      component: 'googleSheets',
      action: 'cache_fallback',
    });
  }
  // キャッシュからデータを取得
  try {
    const db = await initDB();
    const cachedData: SheetData[] = [];
    const expiredRanges: string[] = [];
    const missingRanges: string[] = [];

    // 並列処理でキャッシュからのデータ取得を効率化
    const cacheResults = await Promise.all(
      sheetRanges.map(async range => {
        const cachedItem = (await db.get('sheets', range)) as CacheEntry | undefined;
        return { range, cachedItem };
      })
    );

    // 取得した結果を分類
    for (const { range, cachedItem } of cacheResults) {
      if (cachedItem) {
        if (isCacheValid(cachedItem.timestamp)) {
          cachedData.push(cachedItem.data);
        } else {
          expiredRanges.push(range);
        }
      } else {
        missingRanges.push(range);
      }
    }

    // ログ情報を構造化
    const cacheStatus = {
      component: 'googleSheets',
      totalRanges: sheetRanges.length,
      validCache: cachedData.length,
      expiredCache: expiredRanges.length,
      missingCache: missingRanges.length,
    };

    if (expiredRanges.length > 0) {
      logger.debug('一部のキャッシュデータが期限切れです', {
        ...cacheStatus,
        action: 'cache_expired',
        expiredRanges,
      });
    }

    if (cachedData.length > 0) {
      logger.info('キャッシュからデータを取得しました', {
        ...cacheStatus,
        action: 'cache_hit',
      });
      return cachedData;
    }

    logger.info('有効なキャッシュデータがありません', {
      ...cacheStatus,
      action: 'cache_miss',
    });
  } catch (cacheError) {
    logger.warn('キャッシュからのデータ取得に失敗しました', {
      component: 'googleSheets',
      action: 'cache_error',
      error: cacheError instanceof Error ? cacheError.message : String(cacheError),
    });
  }

  // APIもキャッシュも失敗した場合
  throw new Error(
    'Google Sheetsデータを取得できませんでした。オンライン状態とAPIキーを確認してください。'
  );
}

/**
 * スプレッドシート値から2次元配列をCSV文字列に変換
 * @param values 変換する2次元配列
 * @returns CSV形式の文字列
 */
export function convertValuesToCSV(values: string[][]): string {
  if (!values || values.length === 0) return '';

  return values
    .map(row =>
      row
        .map(cell => {
          // nullとundefinedを適切に処理
          const cellValue = cell ?? '';
          // カンマまたは引用符を含むセルは引用符で囲み、内部の引用符はエスケープする
          if (cellValue.includes(',') || cellValue.includes('"')) {
            return `"${cellValue.replace(/"/g, '""')}"`;
          }
          return cellValue;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Google SheetsからPOIデータを取得する
 * @param poiType POIの種類
 * @param sheetRange シート範囲（例: 'レストラン!A1:Z1000'）
 * @returns POIデータの配列（エラー時は空配列）
 */
export async function fetchPOIsFromSheet(poiType: POIType, sheetRange: string) {
  logger.debug('POIデータ取得を開始', {
    component: 'googleSheets',
    action: 'fetch_pois',
    poiType,
    sheetRange,
  });

  try {
    const sheetData = await fetchFromGoogleSheets([sheetRange]);

    // データチェック - 値が存在しない場合は早期リターン
    if (!sheetData[0]?.values?.length) {
      logger.warn(`シート「${sheetRange}」にデータがありません`, {
        component: 'googleSheets',
        action: 'fetch_pois_empty',
        poiType,
      });
      return [];
    }

    // データ変換処理
    const csvString = convertValuesToCSV(sheetData[0].values);
    const pois = parseCSVtoPOIs(csvString, poiType);

    logger.info(`${poiType}データを正常に取得しました`, {
      component: 'googleSheets',
      action: 'fetch_pois_success',
      poiType,
      count: pois.length,
    });

    return pois;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(`${poiType}データの取得に失敗`, {
      component: 'googleSheets',
      action: 'fetch_pois_error',
      poiType,
      sheetRange,
      error: errorMessage,
    });

    // KISS原則に従い、一貫して空配列を返す（呼び出し元での特別な処理不要）
    return [];
  }
}
