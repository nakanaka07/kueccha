// UI設定
export const LOADING_DELAY = 0;
export const BACKGROUND_HIDE_DELAY = 1000;

// 営業時間表示関連
export const INFO_WINDOW_BUSINESS_HOURS = [
  { day: '月曜日', key: 'monday' },
  { day: '火曜日', key: 'tuesday' },
  { day: '水曜日', key: 'wednesday' },
  { day: '木曜日', key: 'thursday' },
  { day: '金曜日', key: 'friday' },
  { day: '土曜日', key: 'saturday' },
  { day: '日曜日', key: 'sunday' },
  { day: '祝祭日', key: 'holiday' },
] as const;

// メニュー項目定義
export const MENU_ITEMS = [
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
] as const;
