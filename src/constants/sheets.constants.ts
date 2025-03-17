/**
 * Google Sheets API関連定数ファイル
 * 
 * データソースとなるGoogle Sheetsの設定パラメータを定義します。
 * 環境変数から取得したAPI KeyとスプレッドシートIDが含まれます。
 */
import { SheetRow, SheetColumnIdentifier, SheetsConfig } from '../types/sheets.types';
import { AreaType } from '../types/areas.types';
import { getEnvValue, getEnvValueAsBoolean } from '../utils/env.utils';

// ============================================================================
// 環境と基本設定
// ============================================================================

/** 開発環境かどうかを判定 */
const IS_DEV = getEnvValueAsBoolean('VITE_DEV', import.meta.env.DEV === true);

/**
 * シート名の定義
 * 各データ種別に対応するシート名を定義
 */
export const SHEET_NAMES = {
  /** スポット情報が格納されているシート */
  SPOTS: 'spots',
  
  /** エリア情報が格納されているシート */
  AREAS: 'areas',
  
  /** アプリケーション設定が格納されているシート */
  CONFIG: 'config'
} as const;

/**
 * 特殊処理が必要な列の識別子
 */
export const SPECIAL_COLUMN_TYPES = {
  /** エリア名から型へのマッピング */
  AREA_MAPPING: 'area_mapping',
} as const;

/**
 * シートの列構造定義
 * 各シートの列とデータマッピングを定義
 * 数値: 実際のデータ構造に基づく正確なインデックス（1始まり）
 * 文字列: 特殊処理のための識別子
 */
export const SHEET_COLUMNS = {
  SPOTS: {
    // 基本情報
    ID: 1,
    NAME: 32,
    AREA: SPECIAL_COLUMN_TYPES.AREA_MAPPING, // 特殊処理識別子
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
  }
} as const;

// ============================================================================
// Google Sheets API設定
// ============================================================================

/**
 * Google Sheets API設定を安全に生成する
 * 環境変数から設定を取得
 * 
 * @returns SheetsConfig オブジェクト
 */
function createSheetsConfig(): SheetsConfig {
  return {
    /** Google Sheets API キー */
    apiKey: getEnvValue<string>(
      'VITE_GOOGLE_SHEETS_API_KEY',
      IS_DEV ? 'development-api-key-for-local-testing' : '',
      String,
      {
        required: true,
        logErrors: true,
        throwInProduction: !IS_DEV
      }
    ),
    
    /** スプレッドシートID */
    spreadsheetId: getEnvValue<string>(
      'VITE_GOOGLE_SPREADSHEET_ID',
      IS_DEV ? '1example-spreadsheet-id-for-development' : '',
      String,
      {
        required: true,
        logErrors: true,
        throwInProduction: !IS_DEV
      }
    ),
    
    /** シート別の設定 */
    sheets: [
      { 
        name: SHEET_NAMES.SPOTS, 
        range: 'A2:AX1000',
        primaryKey: 'id' 
      },
      { 
        name: SHEET_NAMES.AREAS, 
        range: 'A2:F100',
        primaryKey: 'id' 
      },
      { 
        name: SHEET_NAMES.CONFIG, 
        range: 'A2:B50',
        isKeyValue: true
      }
    ],
    
    /** キャッシュ有効期間（秒） */
    cacheDuration: getEnvValue('VITE_SHEETS_CACHE_DURATION', 3600, Number), // デフォルト: 1時間
    
    /** リクエスト失敗時の再試行回数 */
    maxRetries: getEnvValue('VITE_SHEETS_MAX_RETRIES', 3, Number),
    
    /** 再試行間隔（ミリ秒） */
    retryDelay: getEnvValue('VITE_SHEETS_RETRY_DELAY', 1000, Number),
  };
}

/**
 * Google Sheets API設定
 * スプレッドシートへのアクセスに必要な設定を定義します
 */
export const SHEETS_CONFIG = createSheetsConfig();

// ============================================================================
// データ変換と処理の設定
// ============================================================================

/**
 * スプレッドシートデータ処理オプション
 */
export const SHEETS_PROCESSING_OPTIONS = {
  /** 日付として解釈する列 */
  dateColumns: ['updatedAt', 'createdAt'],
  
  /** 数値として解釈する列 */
  numberColumns: ['lat', 'lng'],
  
  /** 真偽値として解釈する列 */
  booleanColumns: ['isActive', 'isVisible'],
  
  /** JSON文字列として解釈し、オブジェクトに変換する列 */
  jsonColumns: ['options'],
  
  /** 営業時間関連の列（曜日ごとの処理用） */
  businessHourColumns: [
    'monday', 'tuesday', 'wednesday', 
    'thursday', 'friday', 'saturday', 
    'sunday', 'holiday'
  ],
  
  /** エリアマッピングの定義 */
  areaMapping: {
    'RYOTSU_AIKAWA': ['両津', '相川'],
    'KANAI_SAWADA_NIIBO_HATANO_MANO': ['金井', '佐和田', '新穂', '畑野', '真野'],
    'AKADOMARI_HAMOCHI_OGI': ['赤泊', '羽茂', '小木']
  } as Record<AreaType, string[]>,
  
  /** 未知のエリアに対するデフォルト値 */
  defaultArea: 'RYOTSU_AIKAWA' as AreaType
};

/**
 * 1始まりの列インデックスを0始まりの配列インデックスに変換
 * 
 * @param columnIdentifier - 列識別子（数値または特殊識別子）
 * @returns 0始まりのインデックス、または -1（特殊識別子の場合）
 */
export function getAdjustedColumnIndex(columnIdentifier: SheetColumnIdentifier): number {
  return typeof columnIdentifier === 'number' ? columnIdentifier - 1 : -1;
}

// ============================================================================
// データ変換ヘルパー関数
// ============================================================================

/**
 * エリア名からAreaType列挙型への変換
 * 正規化と部分一致チェックによる堅牢な変換
 * 
 * @param areaName - スプレッドシートのエリア名
 * @returns 対応するAreaType値またはデフォルト値
 */
function getAreaTypeFromName(areaName?: string | null): AreaType {
  if (!areaName) {
    console.warn('エリア名が空です。デフォルト値を使用します。');
    return SHEETS_PROCESSING_OPTIONS.defaultArea;
  }
  
  const mapping = SHEETS_PROCESSING_OPTIONS.areaMapping;
  const normalizedAreaName = areaName.trim().toLowerCase();
  
  for (const [areaType, names] of Object.entries(mapping)) {
    // 正規表現による単語境界チェックではなく、各名前が含まれるかを確認
    if (names.some(name => normalizedAreaName.includes(name.toLowerCase()))) {
      return areaType as AreaType;
    }
  }
  
  console.warn(`未知のエリア名: "${areaName}"。デフォルト値を使用します。`);
  return SHEETS_PROCESSING_OPTIONS.defaultArea;
}

/**
 * 指定された列の値を取得（特殊処理対応）
 * 
 * @param row - スプレッドシートの行データ
 * @param columnIdentifier - 列識別子
 * @param defaultValue - デフォルト値
 * @returns 取得した値または変換後の値
 */
function getColumnValue<T>(row: SheetRow, columnIdentifier: SheetColumnIdentifier, defaultValue: T): T {
  // 通常の列インデックスの場合
  if (typeof columnIdentifier === 'number') {
    const adjustedIndex = getAdjustedColumnIndex(columnIdentifier);
    return (row[adjustedIndex] ?? defaultValue) as T;
  }
  
  // 特殊識別子の場合
  switch (columnIdentifier) {
    case SPECIAL_COLUMN_TYPES.AREA_MAPPING:
      // エリア名から適切なエリアタイプを取得
      const nameIndex = getAdjustedColumnIndex(SHEET_COLUMNS.SPOTS.NAME);
      const areaName = row[nameIndex] as string;
      return getAreaTypeFromName(areaName) as unknown as T;
    default:
      console.warn(`未知の列識別子: ${columnIdentifier}`);
      return defaultValue;
  }
}

/**
 * 営業時間情報を構造化オブジェクトに変換
 * 
 * @param row - スプレッドシートの行データ
 * @returns 構造化された営業時間データ
 */
function createBusinessHoursObject(row: SheetRow): Record<string, string> {
  const result: Record<string, string> = {};
  const columns = SHEETS_PROCESSING_OPTIONS.businessHourColumns;
  const baseColumn = SHEET_COLUMNS.SPOTS.MONDAY;
  
  if (typeof baseColumn !== 'number') {
    console.error('営業時間の基準列が数値ではありません');
    return result;
  }
  
  // 各曜日の営業時間を取得
  columns.forEach((day, index) => {
    const columnIndex = baseColumn + index;
    const adjustedIndex = getAdjustedColumnIndex(columnIndex);
    result[day] = String(row[adjustedIndex] ?? '');
  });
  
  // 営業時間特記事項を追加
  const holidayInfoColumn = SHEET_COLUMNS.SPOTS.HOLIDAY_INFO;
  if (typeof holidayInfoColumn === 'number') {
    const adjustedIndex = getAdjustedColumnIndex(holidayInfoColumn);
    result.holidayInfo = String(row[adjustedIndex] ?? '');
  }
  
  return result;
}

/**
 * JSON文字列をオブジェクトに変換（エラー処理付き）
 * 
 * @param jsonString - 変換するJSON文字列
 * @param defaultValue - 変換に失敗した場合のデフォルト値
 * @returns パースされたオブジェクトまたはデフォルト値
 */
function parseJsonSafely<T>(jsonString: string | undefined | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error(`JSON解析エラー: ${error instanceof Error ? error.message : String(error)}`);
    return defaultValue;
  }
}

/**
 * 文字列を指定された型に変換
 * 
 * @param value - 変換する値
 * @param type - 変換する型
 * @returns 変換された値
 */
function convertValueByType(value: unknown, type: 'string' | 'number' | 'boolean' | 'date'): unknown {
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

/**
 * データ変換ヘルパー関数オブジェクト
 * スプレッドシートからのデータをアプリケーション用に変換
 */
export const dataTransformHelpers = {
  getAreaTypeFromName,
  getColumnValue,
  createBusinessHoursObject,
  parseJsonSafely,
  convertValueByType
};