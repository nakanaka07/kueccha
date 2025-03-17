/**
 * UI関連定数ファイル
 * 
 * ユーザーインターフェース要素に関する設定や表示内容を定義します。
 */

/// <reference types="@types/google.maps" />
import type { 
  MenuItem, 
  MenuItemAction,
  MenuActionType, 
  InfoWindowConfig,
  PixelOffset 
} from '../types/ui.types';
import type { BusinessHourDayMapping } from '../types/poi.types';

// ============================================================================
// ヘルパー関数
// ============================================================================

/**
 * Google Maps APIが利用可能かをチェックする
 * 
 * @returns Google Maps APIが利用可能な場合はtrue
 */
function isGoogleMapsAvailable(): boolean {
  return typeof google !== 'undefined' && 
         typeof google.maps !== 'undefined' &&
         typeof google.maps.Size === 'function';
}

/**
 * Google Maps のSize オブジェクトを安全に作成する
 * 
 * @param width - 幅
 * @param height - 高さ
 * @returns Google Maps Size オブジェクトまたは互換性のあるオブジェクト
 */
function createSafePixelOffset(width: number, height: number): PixelOffset {
  if (isGoogleMapsAvailable()) {
    return new google.maps.Size(width, height);
  }
  
  // フォールバック: Google Maps APIが利用できない場合は互換性のあるオブジェクトを返す
  return { width, height, equals: () => false, toString: () => `(${width}, ${height})` };
}

// ============================================================================
// 情報ウィンドウ関連の定数
// ============================================================================

/**
 * 情報ウィンドウに表示する営業時間の曜日定義
 *
 * スポット詳細の情報ウィンドウに表示する営業時間の各曜日とそのデータキーのマッピング。
 */
export const INFO_WINDOW_BUSINESS_HOURS: BusinessHourDayMapping[] = [
  { day: '月曜日', key: 'monday' },
  { day: '火曜日', key: 'tuesday' },
  { day: '水曜日', key: 'wednesday' },
  { day: '木曜日', key: 'thursday' },
  { day: '金曜日', key: 'friday' },
  { day: '土曜日', key: 'saturday' },
  { day: '日曜日', key: 'sunday' },
  { day: '祝祭日', key: 'holiday' },
] as const;

/**
 * 情報ウィンドウの設定を作成する関数
 * Google Maps APIの読み込み状態に依存しない安全な初期化を行う
 */
function createInfoWindowConfig(): InfoWindowConfig {
  return {
    maxWidth: 320,
    pixelOffset: createSafePixelOffset(0, -40), // 安全な方法で作成
    closeOnMapClick: true,
    mobileAdjustment: {
      maxWidth: 280,
      scale: 0.9
    }
  };
}

/**
 * 情報ウィンドウの表示設定
 */
export const INFO_WINDOW_CONFIG = createInfoWindowConfig();

// ============================================================================
// メニュー関連の定数
// ============================================================================

/**
 * メニュー項目の定義
 *
 * アプリケーションのメインメニューに表示する項目のリストです。
 * 各項目にはラベル、タイトル、および関連するアクションが定義されています。
 */
export const MENU_ITEMS: MenuItem[] = [
  {
    label: '表示するエリアを選択',
    title: 'エリアを選択',
    action: 'onAreaSelect',
    icon: 'map-marker',
  },
  {
    label: 'フィードバック',
    title: 'フィードバック',
    action: 'onFeedbackRequest',
    icon: 'comment',
  },
  {
    label: '検索',
    title: '検索',
    action: 'onToggleSearchBar',
    icon: 'search',
  },
] as const;

// ============================================================================
// フォーム関連の定数
// ============================================================================

/**
 * フィードバックフォームの初期値
 */
export const INITIAL_FEEDBACK_FORM: Record<string, string> = {
  name: '',
  email: '',
  message: '',
};

// ============================================================================
// 検索関連の定数
// ============================================================================

/**
 * 検索結果がない場合のメッセージ
 */
export const NO_SEARCH_RESULTS_MESSAGE = '該当する検索結果がありません';

/**
 * 検索プレースホルダーテキスト
 */
export const SEARCH_PLACEHOLDER = 'エリアやスポットを検索...';

/**
 * 検索ボタンのラベル
 */
export const SEARCH_BUTTON_LABEL = '検索';

// ============================================================================
// 位置情報関連の定数
// ============================================================================

/**
 * 位置情報のエラーメッセージ
 */
export const GEOLOCATION_ERROR_MESSAGES = {
  PERMISSION_DENIED: '位置情報へのアクセスが拒否されました。設定から許可してください。',
  POSITION_UNAVAILABLE: '現在地を取得できませんでした。',
  TIMEOUT: '位置情報の取得がタイムアウトしました。',
  UNKNOWN: '位置情報の取得中に不明なエラーが発生しました。'
};