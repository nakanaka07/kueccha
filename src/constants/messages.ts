export const ERROR_MESSAGES = {
  MAP: {
    LOAD_FAILED: 'マップの読み込みに失敗しました',
    RETRY_MESSAGE: 'しばらく経ってから再度お試しください',
  },
  DATA: {
    FETCH_FAILED: 'データの取得に失敗しました',
    LOADING_FAILED: 'データの読み込みに失敗しました',
  },
  CONFIG: {
    MISSING: '必要な設定が不足しています',
    INVALID: '設定が正しくありません',
  },
  SYSTEM: {
    UNKNOWN: '予期せぬエラーが発生しました',
    CONTAINER_NOT_FOUND: 'コンテナ要素が見つかりません',
  },
  LOADING: {
    MAP: 'マップを読み込んでいます...',
    DATA: '読み込み中...',
  },
} as const;
