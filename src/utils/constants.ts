import { LoadScriptProps } from '@react-google-maps/api';
import publicToiletIcon from './images/ano_icon01.png';
import recommendIcon from './images/ano_icon_recommend.png';
import ryotsuAikawaIcon from './images/icon_map01.png';
import kanaiSawadaNiiboHatanoManoIcon from './images/icon_map02.png';
import akadomariHamochiOgiIcon from './images/icon_map03.png';
import defaultIcon from './images/row2.png';
import parkingIcon from './images/shi_icon01.png';
import snackIcon from './images/shi_icon02.png';
import currentLocationIcon from './images/shi_icon04.png';
import type { AreaType, Poi } from './types';

// アプリケーション全体で使用する定数を統合
export const APP = {
  // エリア定義
  areas: {
    RYOTSU_AIKAWA: '両津・相川地区',
    KANAI_SAWADA_NIIBO_HATANO_MANO: '金井・佐和田・新穂・畑野・真野地区',
    AKADOMARI_HAMOCHI_OGI: '赤泊・羽茂・小木地区',
    SNACK: 'スナック',
    PUBLIC_TOILET: '公共トイレ',
    PARKING: '駐車場',
    RECOMMEND: 'おすすめ',
    CURRENT_LOCATION: '現在地',
  } as const,

  // マーカー関連の設定
  markers: {
    colors: {
      DEFAULT: '#000000',
      RYOTSU_AIKAWA: '#d9a62e',
      KANAI_SAWADA_NIIBO_HATANO_MANO: '#ec6800',
      AKADOMARI_HAMOCHI_OGI: '#007b43',
      SNACK: '#65318e',
      PUBLIC_TOILET: '#2792c3',
      PARKING: '#333333',
      RECOMMEND: '#d7003a',
      CURRENT_LOCATION: '#42a30f',
    },
    icons: {
      DEFAULT: defaultIcon,
      RYOTSU_AIKAWA: ryotsuAikawaIcon,
      KANAI_SAWADA_NIIBO_HATANO_MANO: kanaiSawadaNiiboHatanoManoIcon,
      AKADOMARI_HAMOCHI_OGI: akadomariHamochiOgiIcon,
      SNACK: snackIcon,
      PUBLIC_TOILET: publicToiletIcon,
      PARKING: parkingIcon,
      RECOMMEND: recommendIcon,
      CURRENT_LOCATION: currentLocationIcon,
    },
  } as const,

  // 営業時間関連
  businessHours: [
    { day: '月曜日', key: 'monday' },
    { day: '火曜日', key: 'tuesday' },
    { day: '水曜日', key: 'wednesday' },
    { day: '木曜日', key: 'thursday' },
    { day: '金曜日', key: 'friday' },
    { day: '土曜日', key: 'saturday' },
    { day: '日曜日', key: 'sunday' },
    { day: '祝祭日', key: 'holiday' },
  ] as const,

  // メニュー項目
  menuItems: [
    {
      label: '表示するエリアを選択',
      title: '表示するエリアを選択',
      action: 'handleAreaClick',
    },
    {
      label: 'フィードバック',
      title: 'フィードバック',
      action: 'handleFeedbackClick',
    },
    {
      label: '検索',
      title: '検索',
      action: 'toggleSearchBar',
    },
  ] as const,

  // UI関連の設定
  ui: {
    loadingDelay: 0,
    backgroundHideDelay: 1000,
    messages: {
      loading: {
        data: 'データを読み込み中です。しばらくお待ちください。',
        map: 'マップを読み込み中です。しばらくお待ちください。',
        retry: 'しばらく経ってから再度お試しください。',
      },
      errors: {
        config: '設定が正しくありません。設定を確認してください。',
        configMissing: '必要な設定が不足しています。設定を追加してください。',
        dataFetch: 'データの取得に失敗しました。ネットワーク接続を確認してください。',
        dataLoading: 'データの読み込みに失敗しました。再試行してください。',
        mapLoading: 'Google Maps の読み込みに失敗しました。再試行してください。',
        mapConfig: 'Google Maps の設定が不完全です。API キーとMap IDを確認してください。',
        systemError: '予期せぬエラーが発生しました。サポートに連絡してください。',
        containerNotFound: 'コンテナ要素が見つかりません。ページをリロードしてください。',
        formSubmission: '送信に失敗しました。もう一度お試しください。',
        geolocation: {
          permissionDenied: '位置情報の取得が許可されていません',
          positionUnavailable: '位置情報が利用できません',
          timeout: '位置情報の取得がタイムアウトしました',
          unknown: '未知のエラーが発生しました',
        },
        validation: {
          emptyName: '名前を入力してください。',
          emptyMessage: 'メッセージを入力してください。',
          invalidEmail: '有効なメールアドレスを入力してください。',
        },
        errorBoundary: {
          unknownError: '予期せぬエラーが発生しました。サポートに連絡してください。',
          retryButton: '再試行',
        },
      },
    },
  } as const,

  // アプリ全体の設定
  config: {
    maps: {
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
      libraries: ['places', 'geometry', 'drawing', 'marker'] as LoadScriptProps['libraries'],
      version: 'weekly',
      language: 'ja',
      defaultCenter: { lat: 38.1, lng: 138.4 },
      defaultZoom: 10,
      geolocation: {
        timeout: 10000,
        maxAge: 0,
        highAccuracy: true,
      },
      style: {
        width: '100%',
        height: '100%',
      },
      options: {
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
        mapTypeId: 'roadmap',
        disableDefaultUI: false,
        disableDoubleClickZoom: false,
        scrollwheel: true,
        clickableIcons: true,
        gestureHandling: 'cooperative',
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: 2,
          position: 1,
          mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: 3,
        },
        zoomControl: true,
        zoomControlOptions: {
          position: 7,
        },
        streetViewControl: true,
        streetViewControlOptions: {
          position: 7,
        },
        cameraControl: true,
        cameraControlOptions: {
          position: 7,
        },
      },
    },
    sheets: {
      apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
      spreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID,
    },
  } as const,
};

// TODO: 将来的には下記の古い定数は非推奨とし、APP定数のみを使うようにリファクタリングすることを検討
// 後方互換性のための定義
export const AREAS = APP.areas;
export const MARKERS = APP.markers;
export const INFO_WINDOW_BUSINESS_HOURS = APP.businessHours;
export const MENU_ITEMS = APP.menuItems;
export const LOADING_DELAY = APP.ui.loadingDelay;
export const BACKGROUND_HIDE_DELAY = APP.ui.backgroundHideDelay;
export const LOADING_MESSAGES = APP.ui.messages.loading;
export const ERRORS = APP.ui.messages.errors;
export const APP_CONFIG = {
  maps: APP.config.maps,
  sheets: APP.config.sheets,
  markers: APP.markers,
};
export const MAPS_CONFIG = APP_CONFIG.maps;
export const SHEETS_CONFIG = APP_CONFIG.sheets;

export const ERROR_MESSAGES = {
  CONFIG: { INVALID: ERRORS.config, MISSING: ERRORS.configMissing },
  DATA: { FETCH_FAILED: ERRORS.dataFetch, LOADING_FAILED: ERRORS.dataLoading },
  LOADING: { DATA: LOADING_MESSAGES.data, MAP: LOADING_MESSAGES.map },
  MAP: {
    LOAD_FAILED: ERRORS.mapLoading,
    CONFIG_MISSING: ERRORS.mapConfig,
    RETRY_MESSAGE: LOADING_MESSAGES.retry,
  },
  SYSTEM: {
    CONTAINER_NOT_FOUND: ERRORS.containerNotFound,
    UNKNOWN: ERRORS.systemError,
  },
  FORM: {
    EMPTY_NAME: ERRORS.validation.emptyName,
    EMPTY_MESSAGE: ERRORS.validation.emptyMessage,
    INVALID_EMAIL: ERRORS.validation.invalidEmail,
    SUBMISSION_FAILED: ERRORS.formSubmission,
  },
  ERROR_BOUNDARY: {
    UNKNOWN_ERROR: ERRORS.errorBoundary.unknownError,
    RETRY_BUTTON: ERRORS.errorBoundary.retryButton,
  },
  GEOLOCATION: {
    PERMISSION_DENIED: ERRORS.geolocation.permissionDenied,
    POSITION_UNAVAILABLE: ERRORS.geolocation.positionUnavailable,
    TIMEOUT: ERRORS.geolocation.timeout,
    UNKNOWN: ERRORS.geolocation.unknown,
  },
};

export const INITIAL_VISIBILITY: Record<AreaType, boolean> = Object.keys(AREAS).reduce(
  (acc, area) => ({
    ...acc,
    [area]: area !== 'SNACK' && area !== 'PUBLIC_TOILET' && area !== 'PARKING' && area !== 'CURRENT_LOCATION',
  }),
  {} as Record<AreaType, boolean>,
);

export const CURRENT_LOCATION_POI: Poi = {
  id: 'current-location',
  name: '現在地',
  area: 'CURRENT_LOCATION' as AreaType,
  category: '現在地',
  genre: '現在地',
  location: { lat: 0, lng: 0 }, // デフォルト値を設定（実際には useCurrentLocationPoi で上書きされる）
};

// MARKER_ICONSとして再エクスポート
export const MARKER_ICONS = MARKERS.icons;
