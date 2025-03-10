export const LOADING_MESSAGES = {
  data: 'データを読み込み中です。しばらくお待ちください。',
  map: 'マップを読み込み中です。しばらくお待ちください。',
  retry: 'しばらく経ってから再度お試しください。',
};

export const ERRORS = {
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
};

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
