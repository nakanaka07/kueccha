/**
 * 機能: 定数モジュールの中央エクスポートハブとして機能し、すべての定数を一箇所からアクセス可能にする
 * 依存関係:
 *   - ./areas, ./markers, ./config, ./messages, ./ui モジュール
 * 注意点:
 *   - APPオブジェクトは後方互換性のために維持されているが、新しいコードでは直接のimportを使用することを推奨
 *   - import文で各モジュールをインポートし、レガシーコードとの互換性を保持
 */

// モジュールをインポート
import { AREAS } from './areas';
import { CONFIG } from './config';
import { MARKERS } from './markers';
import { LOADING_MESSAGES, ERRORS } from './messages';
import { INFO_WINDOW_BUSINESS_HOURS, MENU_ITEMS, LOADING_DELAY, BACKGROUND_HIDE_DELAY } from './ui';

// 個別のエクスポート
export * from './areas';
export * from './markers';
export * from './config';
export * from './messages';
export * from './ui';

// 後方互換性のためのAPPオブジェクト
export const APP = {
  areas: AREAS,
  markers: MARKERS,
  businessHours: INFO_WINDOW_BUSINESS_HOURS,
  menuItems: MENU_ITEMS,
  ui: {
    loadingDelay: LOADING_DELAY,
    backgroundHideDelay: BACKGROUND_HIDE_DELAY,
    messages: {
      loading: LOADING_MESSAGES,
      errors: ERRORS,
    },
  },
  config: CONFIG,
};
