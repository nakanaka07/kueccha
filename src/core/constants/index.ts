/**
 * 機能: 定数モジュールの中央エクスポートハブとして機能し、すべての定数を一箇所からアクセス可能にする
 * 依存関係:
 *   - ./areas, ./markers, ./config, ./messages, ./ui モジュール
 * 注意点:
 *   - APPオブジェクトは後方互換性のために維持されているが、新しいコードでは直接のimportを使用することを推奨
 *   - require()を使用している部分は、将来的にはimport文に置き換えるべき
 */
export * from './areas';
export * from './markers';
export * from './config';
export * from './messages';
export * from './ui';

export const APP = {
  areas: require('./areas').AREAS,
  markers: require('./markers').MARKERS,
  businessHours: require('./ui').INFO_WINDOW_BUSINESS_HOURS,
  menuItems: require('./ui').MENU_ITEMS,
  ui: {
    loadingDelay: require('./ui').LOADING_DELAY,
    backgroundHideDelay: require('./ui').BACKGROUND_HIDE_DELAY,
    messages: {
      loading: require('./messages').LOADING_MESSAGES,
      errors: require('./messages').ERRORS,
    },
  },
  config: require('./config').CONFIG,
};
