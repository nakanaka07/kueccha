/**
 * Google Sheets APIのアダプター実装
 *
 * Google Sheetsからのデータ取得と加工を抽象化し、
 * 型安全なインターフェースを提供します。
 */

import {
  SheetCellValue,
  SheetRow,
  DataProcessingType,
  SheetsConfig,
  SheetRange,
  SheetsRequestOptions,
  SheetsError,
} from '../types';
import { getEnvValue } from '../utils/env.utils';
import { createError } from '../utils/error.utils';

import { SheetsAdapter } from './index';

/**
 * Google Sheets APIのベースURL
 */
const SHEETS_API_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * データ変換処理の定義
 */
const DATA_PROCESSORS: Record<DataProcessingType, (value: string) => any> = {
  string: (value: string) => value,
  number: (value: string) => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  },
  boolean: (value: string) => {
    const lowerValue = value.toLowerCase();
    if (['true', 'yes', '1', 'y'].includes(lowerValue)) return true;
    if (['false', 'no', '0', 'n', ''].includes(lowerValue)) return false;
    return null;
  },
  date: (value: string) => {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  },
  json: (value: string) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },
};

/**
 * シートのデータをオブジェクトに変換するためのマッパー
 */
interface SheetColumnMapper<T> {
  /**
   * 列識別子（インデックスまたはヘッダー名）
   */
  column: number | string;

  /**
   * オブジェクトのプロパティ名
   */
  property: keyof T;

  /**
   * 値の処理方法
   */
  type?: DataProcessingType;

  /**
   * カスタム変換関数
   */
  transform?: (value: SheetCellValue) => any;
}

/**
 * Google Sheets APIのアダプター実装
 */
export class GoogleSheetsAdapter implements SheetsAdapter {
  private readonly apiKey: string;
  private readonly spreadsheetId: string;
  private readonly config: SheetsConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  /**
   * コンストラクタ
   * @param config シート設定
   */
  constructor(config: SheetsConfig) {
    this.apiKey =
      config.apiKey ||
      getEnvValue('VITE_GOOGLE_SHEETS_API_KEY', '', {
        required: true,
        logErrors: true,
      });

    this.spreadsheetId =
      config.spreadsheetId ||
      getEnvValue('VITE_GOOGLE_SPREADSHEET_ID', '', {
        required: true,
        logErrors: true,
      });

    this.config = {
      ...config,
      apiKey: this.apiKey,
      spreadsheetId: this.spreadsheetId,
    };
  }

  /**
   * APIリクエストURLを構築する
   * @param sheetName シート名
   * @param range 範囲（オプション）
   */
  private buildRequestUrl(sheetName: string, range?: string): string {
    const baseUrl = `${SHEETS_API_BASE_URL}/${this.spreadsheetId}/values/`;
    const rangePart = range ? `${sheetName}!${range}` : sheetName;
    const encodedRange = encodeURIComponent(rangePart);
    return `${baseUrl}${encodedRange}?key=${this.apiKey}`;
  }

  /**
   * APIからデータを取得する
   * @param url 取得先URL
   * @param options リクエストオプション
   * @returns レスポンスデータ
   */
  private async fetchFromApi<T>(url: string, options: SheetsRequestOptions = {}): Promise<T> {
    const cacheKey = url + JSON.stringify(options);

    // キャッシュチェック
    if (this.config.cacheTime && options.useCache !== false) {
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.config.cacheTime) {
        return cached.data as T;
      }
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          Accept: 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw createError(
          'DATA',
          'SHEETS_API_ERROR',
          `Google Sheets API error: ${errorData.error?.message || response.statusText}`,
          { status: response.status, url },
        );
      }

      const data = await response.json();

      // キャッシュに保存
      if (this.config.cacheTime && options.useCache !== false) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw createError(
          'DATA',
          'SHEETS_FETCH_FAILED',
          `Failed to fetch data from Sheets: ${error.message}`,
          { url },
          error,
        );
      }
      throw error;
    }
  }

  /**
   * シートから生データを取得する
   * @param sheetName シート名
   * @param range 範囲
   * @param options リクエストオプション
   */
  private async fetchRawSheetData(
    sheetName: string,
    range?: string,
    options: SheetsRequestOptions = {},
  ): Promise<{ values: SheetRow[] }> {
    const url = this.buildRequestUrl(sheetName, range);
    return this.fetchFromApi<{ values: SheetRow[] }>(url, options);
  }

  /**
   * スプレッドシートからデータを取得する
   * @param sheetName シート名
   * @param range 範囲（オプション）
   * @param options リクエストオプション
   */
  async fetchData<T>(sheetName: string, range?: string, options: SheetsRequestOptions = {}): Promise<T[]> {
    try {
      const response = await this.fetchRawSheetData(sheetName, range, options);

      if (!response.values || response.values.length === 0) {
        return [];
      }

      // 最初の行をヘッダーとして扱う
      const headers = response.values[0];
      const rows = response.values.slice(1);

      // データを変換
      return rows.map((row) => {
        const obj = {} as any;

        // 各列の値をプロパティにマッピング
        headers.forEach((header, index) => {
          if (index < row.length) {
            obj[String(header)] = row[index];
          } else {
            obj[String(header)] = null; // 値がない場合はnull
          }
        });

        return obj as T;
      });
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      return [];
    }
  }

  /**
   * カスタムマッピングを使用してデータを取得
   * @param sheetName シート名
   * @param mappers 列マッパー
   * @param range 範囲（オプション）
   * @param options リクエストオプション
   */
  async fetchMappedData<T>(
    sheetName: string,
    mappers: SheetColumnMapper<T>[],
    range?: string,
    options: SheetsRequestOptions = {},
  ): Promise<T[]> {
    try {
      const response = await this.fetchRawSheetData(sheetName, range, options);

      if (!response.values || response.values.length === 0) {
        return [];
      }

      const headers = response.values[0];
      const rows = response.values.slice(1);

      // ヘッダー名から列インデックスへのマッピングを作成
      const headerMap = new Map<string, number>();
      headers.forEach((header, index) => {
        headerMap.set(String(header), index);
      });

      return rows.map((row) => {
        const obj = {} as any;

        // マッパーを使用してデータを変換
        mappers.forEach((mapper) => {
          let columnIndex: number;

          if (typeof mapper.column === 'string') {
            columnIndex = headerMap.get(mapper.column) ?? -1;
          } else {
            columnIndex = mapper.column;
          }

          if (columnIndex >= 0 && columnIndex < row.length) {
            const value = row[columnIndex];

            if (mapper.transform) {
              obj[mapper.property as string] = mapper.transform(value);
            } else if (mapper.type && DATA_PROCESSORS[mapper.type]) {
              obj[mapper.property as string] = DATA_PROCESSORS[mapper.type](String(value));
            } else {
              obj[mapper.property as string] = value;
            }
          } else {
            obj[mapper.property as string] = null;
          }
        });

        return obj as T;
      });
    } catch (error) {
      console.error('Error fetching mapped data:', error);
      return [];
    }
  }

  /**
   * スプレッドシートにデータを書き込む
   * @param sheetName シート名
   * @param range 範囲
   * @param values 値の配列
   */
  async writeData(sheetName: string, range: string, values: any[][]): Promise<boolean> {
    // 書き込み機能の実装（必要な場合）
    // Google Sheets APIの書き込み機能は認証が必要で複雑なため
    // 当面は読み取り専用としています

    throw createError('DATA', 'WRITE_NOT_SUPPORTED', 'データの書き込みはまだサポートされていません');
  }

  /**
   * キャッシュをクリアする
   * @param pattern 特定のパターンに一致するキーのみクリア
   */
  clearCache(pattern?: RegExp): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Google Sheets Adapterを作成するファクトリ関数
 * @param config オプションの設定
 */
export function createGoogleSheetsAdapter(config: Partial<SheetsConfig> = {}): SheetsAdapter {
  const defaultConfig: SheetsConfig = {
    apiKey: '',
    spreadsheetId: '',
    cacheTime: 5 * 60 * 1000, // 5分
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
  };

  return new GoogleSheetsAdapter({
    ...defaultConfig,
    ...config,
  });
}
