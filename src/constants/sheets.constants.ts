/**
 * Google Sheets API関連定数ファイル
 */
import { getEnvValue, getEnvValueAsBoolean } from '../utils/env.utils';

import type { AreaType } from '../types/areas.types';
import type { SheetRow, SheetColumnIdentifier, SheetsConfig } from '../types/sheets.types';

// 環境設定
const IS_DEV = getEnvValueAsBoolean('VITE_DEV', import.meta.env.DEV === true);

// シート名の定義
export const SHEET_NAMES = {
  SPOTS: 'spots',
  AREAS: 'areas', 
  CONFIG: 'config',
} as const;

// 特殊列定義
export const SPECIAL_COLUMN_TYPES = {
  AREA_MAPPING: 'area_mapping',
} as const;

// シートの列構造定義
export const SHEET_COLUMNS = {
  SPOTS: {
    // 基本情報
    ID: 1,
    NAME: 32,
    AREA: SPECIAL_COLUMN_TYPES.AREA_MAPPING,
    GENRE: 33,
    CATEGORY: 34,

    // 施設詳細
    PARKING: 35,
    PAYMENT: 36,

    // 営業時間
    MONDAY: 37,
    TUESDAY: 38,
    WEDNESDAY: 39,
    THURSDAY: 40,
    FRIDAY: 41,
    SATURDAY: 42,
    SUNDAY: 43,
    HOLIDAY: 44,
    HOLIDAY_INFO: 45,

    // 追加情報
    INFORMATION: 46,
    VIEW: 47,
    PHONE: 48,
    ADDRESS: 49,
  },
} as const;

// Google Sheets API設定を生成
function createSheetsConfig(): SheetsConfig {
  return {
    apiKey: getEnvValue<string>(
      'VITE_GOOGLE_SHEETS_API_KEY',
      IS_DEV ? 'development-api-key-for-local-testing' : '',
      String,
      { required: true, logErrors: true, throwInProduction: !IS_DEV }
    ),

    spreadsheetId: getEnvValue<string>(
      'VITE_GOOGLE_SPREADSHEET_ID',
      IS_DEV ? '1example-spreadsheet-id-for-development' : '',
      String,
      { required: true, logErrors: true, throwInProduction: !IS_DEV }
    ),

    sheets: [
      { name: SHEET_NAMES.SPOTS, range: 'A2:AX1000', primaryKey: 'id' },
      { name: SHEET_NAMES.AREAS, range: 'A2:F100', primaryKey: 'id' },
      { name: SHEET_NAMES.CONFIG, range: 'A2:B50', isKeyValue: true },
    ],

    cacheDuration: getEnvValue('VITE_SHEETS_CACHE_DURATION', 3600, Number),
    maxRetries: getEnvValue('VITE_SHEETS_MAX_RETRIES', 3, Number),
    retryDelay: getEnvValue('VITE_SHEETS_RETRY_DELAY', 1000, Number),
  };
}

// Google Sheets API設定
export const SHEETS_CONFIG = createSheetsConfig();

// データ処理オプション
export const SHEETS_PROCESSING_OPTIONS = {
  dateColumns: ['updatedAt', 'createdAt'],
  numberColumns: ['lat', 'lng'],
  booleanColumns: ['isActive', 'isVisible'],
  jsonColumns: ['options'],
  businessHourColumns: [
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday', 'holiday',
  ],
  areaMapping: {
    RYOTSU_AIKAWA: ['両津', '相川'],
    KANAI_SAWADA_NIIBO_HATANO_MANO: ['金井', '佐和田', '新穂', '畑野', '真野'],
    AKADOMARI_HAMOCHI_OGI: ['赤泊', '羽茂', '小木'],
  } as Record<AreaType, string[]>,
  defaultArea: 'RYOTSU_AIKAWA' as AreaType,
};

// 1始まりの列インデックスを0始まりに変換
export function getAdjustedColumnIndex(columnIdentifier: SheetColumnIdentifier): number {
  return typeof columnIdentifier === 'number' ? columnIdentifier - 1 : -1;
}

// エリア名からAreaType列挙型への変換
function getAreaTypeFromName(areaName?: string | null): AreaType {
  if (!areaName) return SHEETS_PROCESSING_OPTIONS.defaultArea;

  const mapping = SHEETS_PROCESSING_OPTIONS.areaMapping;
  const normalizedAreaName = areaName.trim().toLowerCase();

  for (const [areaType, names] of Object.entries(mapping)) {
    if (names.some((name) => normalizedAreaName.includes(name.toLowerCase()))) {
      return areaType as AreaType;
    }
  }

  return SHEETS_PROCESSING_OPTIONS.defaultArea;
}

// 指定された列の値を取得（特殊処理対応）
function getColumnValue<T>(
  row: SheetRow,
  columnIdentifier: SheetColumnIdentifier,
  defaultValue: T,
): T {
  if (typeof columnIdentifier === 'number') {
    const adjustedIndex = getAdjustedColumnIndex(columnIdentifier);
    return (row[adjustedIndex] ?? defaultValue) as T;
  }

  switch (columnIdentifier) {
    case SPECIAL_COLUMN_TYPES.AREA_MAPPING:
      const nameIndex = getAdjustedColumnIndex(SHEET_COLUMNS.SPOTS.NAME);
      const areaName = row[nameIndex] as string;
      return getAreaTypeFromName(areaName) as unknown as T;
    default:
      return defaultValue;
  }
}

// 営業時間情報を構造化オブジェクトに変換
function createBusinessHoursObject(row: SheetRow): Record<string, string> {
  const result: Record<string, string> = {};
  const columns = SHEETS_PROCESSING_OPTIONS.businessHourColumns;
  const baseColumn = SHEET_COLUMNS.SPOTS.MONDAY;

  if (typeof baseColumn !== 'number') return result;

  columns.forEach((day, index) => {
    const columnIndex = baseColumn + index;
    const adjustedIndex = getAdjustedColumnIndex(columnIndex);
    result[day] = String(row[adjustedIndex] ?? '');
  });

  const holidayInfoColumn = SHEET_COLUMNS.SPOTS.HOLIDAY_INFO;
  if (typeof holidayInfoColumn === 'number') {
    const adjustedIndex = getAdjustedColumnIndex(holidayInfoColumn);
    result.holidayInfo = String(row[adjustedIndex] ?? '');
  }

  return result;
}

// JSON文字列をオブジェクトに変換
function parseJsonSafely<T>(jsonString: string | undefined | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    return defaultValue;
  }
}

// 文字列を指定された型に変換
function convertValueByType(
  value: unknown,
  type: 'string' | 'number' | 'boolean' | 'date',
): unknown {
  if (value === null || value === undefined) return null;

  switch (type) {
    case 'string':
      return String(value);
    case 'number':
      return Number(value);
    case 'boolean':
      if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        return lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1';
      }
      return Boolean(value);
    case 'date':
      return value ? new Date(String(value)) : null;
    default:
      return value;
  }
}

// データ変換ヘルパー関数
export const dataTransformHelpers = {
  getAreaTypeFromName,
  getColumnValue,
  createBusinessHoursObject,
  parseJsonSafely,
  convertValueByType,
};