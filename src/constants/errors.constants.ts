/**
 * エラーメッセージ関連定数ファイル
 * 
 * アプリケーション全体で使用される多言語対応エラーメッセージを定義します。
 * メッセージは日本語(ja)と英語(en)で提供されます。
 */

import { 
  SupportedLanguage, 
  DEFAULT_LANGUAGE,
  LocalizedMessage,
  getCurrentLanguage,
  getLocalizedMessage
} from './i18n.constants';

import type {
  ErrorCategory,
  ErrorCode,
  ErrorMessagesSchema
} from '../types/errors.types';

// ============================================================================
// 再利用可能な共通エラーメッセージ
// ============================================================================

/**
 * 共通エラーメッセージ定義
 * 冗長性を排除し、再利用可能なメッセージを定義します。
 */
const COMMON_MESSAGES: Record<string, LocalizedMessage> = {
  INVALID_CONFIGURATION: {
    ja: '設定が正しくありません。設定を確認してください。',
    en: 'Invalid configuration. Please check your settings.'
  },
  MISSING_CONFIGURATION: {
    ja: '必要な設定が不足しています。設定を追加してください。',
    en: 'Required configuration is missing. Please add the necessary settings.'
  },
  FETCH_FAILED: {
    ja: 'データの取得に失敗しました。ネットワーク接続を確認してください。',
    en: 'Failed to fetch data. Please check your network connection.'
  },
  LOADING_FAILED: {
    ja: 'データの読み込みに失敗しました。再試行してください。',
    en: 'Failed to load data. Please try again.'
  },
  RETRY_MESSAGE: {
    ja: 'しばらく経ってから再度お試しください。',
    en: 'Please try again after a while.'
  },
  UNKNOWN_ERROR: {
    ja: '予期せぬエラーが発生しました。サポートに連絡してください。',
    en: 'An unexpected error occurred. Please contact support.'
  },
};

// ============================================================================
// カテゴリー別エラーメッセージ
// ============================================================================

/**
 * エラーメッセージ定義
 *
 * アプリケーション内で使用される各種エラーメッセージを定義します。
 * カテゴリ別に整理され、多言語対応した一貫したエラーメッセージを提供します。
 */
export const ERROR_MESSAGES: ErrorMessagesSchema = {
  CONFIG: {
    INVALID: COMMON_MESSAGES.INVALID_CONFIGURATION,
    MISSING: COMMON_MESSAGES.MISSING_CONFIGURATION,
  },
  DATA: {
    FETCH_FAILED: COMMON_MESSAGES.FETCH_FAILED,
    LOADING_FAILED: COMMON_MESSAGES.LOADING_FAILED,
    NOT_FOUND: {
      ja: 'ID: {id} のデータが見つかりません。',
      en: 'Data with ID: {id} not found.'
    }
  },
  LOADING: {
    DATA: {
      ja: 'データを読み込み中です。しばらくお待ちください。',
      en: 'Loading data. Please wait.'
    },
    MAP: {
      ja: 'マップを読み込み中です。しばらくお待ちください。',
      en: 'Loading map. Please wait.'
    },
  },
  MAP: {
    LOAD_FAILED: {
      ja: 'Google Maps の読み込みに失敗しました。再試行してください。',
      en: 'Failed to load Google Maps. Please try again.'
    },
    CONFIG_MISSING: COMMON_MESSAGES.MISSING_CONFIGURATION,
    RETRY_MESSAGE: COMMON_MESSAGES.RETRY_MESSAGE,
  },
  SYSTEM: {
    CONTAINER_NOT_FOUND: {
      ja: 'コンテナ要素が見つかりません。ページをリロードしてください。',
      en: 'Container element not found. Please reload the page.'
    },
    UNKNOWN: COMMON_MESSAGES.UNKNOWN_ERROR,
  },
  FORM: {
    EMPTY_NAME: {
      ja: '名前を入力してください。',
      en: 'Please enter your name.'
    },
    EMPTY_MESSAGE: {
      ja: 'メッセージを入力してください。',
      en: 'Please enter a message.'
    },
    INVALID_EMAIL: {
      ja: '有効なメールアドレスを入力してください。',
      en: 'Please enter a valid email address.'
    },
    SUBMISSION_FAILED: {
      ja: '送信に失敗しました。もう一度お試しください。',
      en: 'Submission failed. Please try again.'
    },
    FIELD_REQUIRED: {
      ja: '{field}は必須項目です。',
      en: '{field} is required.'
    },
    FIELD_TOO_SHORT: {
      ja: '{field}は{min}文字以上で入力してください。',
      en: '{field} must be at least {min} characters.'
    },
    FIELD_TOO_LONG: {
      ja: '{field}は{max}文字以下で入力してください。',
      en: '{field} must be no more than {max} characters.'
    }
  },
  ERROR_BOUNDARY: {
    UNKNOWN_ERROR: COMMON_MESSAGES.UNKNOWN_ERROR,
    RETRY_BUTTON: {
      ja: '再試行',
      en: 'Retry'
    },
  },
  GEOLOCATION: {
    PERMISSION_DENIED: {
      ja: '位置情報の取得が許可されていません。',
      en: 'Location permission denied.'
    },
    POSITION_UNAVAILABLE: {
      ja: '位置情報が利用できません。',
      en: 'Location information is unavailable.'
    },
    TIMEOUT: {
      ja: '位置情報の取得がタイムアウトしました。',
      en: 'Location request timed out.'
    },
    UNKNOWN: {
      ja: '未知のエラーが発生しました。',
      en: 'An unknown error occurred.'
    },
  },
} as const;