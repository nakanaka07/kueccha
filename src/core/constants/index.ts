// エリア関連
export * from './areas';

// マーカー関連
export * from './markers';

// 設定関連
export * from './config';

// メッセージ関連
export * from './messages';

// UI関連
export * from './ui';

// APP定数（後方互換性のため）
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
