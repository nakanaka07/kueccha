/**
 * 機能: UIに関連する定数を定義（ローディング遅延、背景非表示遅延、営業時間表示形式、メニュー項目）
 * 依存関係:
 *   - なし
 * 注意点:
 *   - メニュー項目のactionプロパティは文字列として定義されており、実行時に対応するハンドラーと関連付ける必要あり
 *   - const assertionを使用して型安全性を確保
 */

export const LOADING_DELAY = 0;
export const BACKGROUND_HIDE_DELAY = 1000;

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

/**
 * UI関連の定数
 */

export interface MenuItem {
  label: string;
  title: string;
  action: string;
  icon?: string;
  // onClick はオリジナルのMenuItemにはなく、後で追加されるプロパティ
}

// 拡張した型を定義
export interface MenuItemWithHandler extends MenuItem {
  onClick: () => void;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    label: '検索',
    title: '場所を検索',
    action: 'toggleSearchBar',
    icon: 'search',
  },
  {
    label: '現在地',
    title: '現在地に移動',
    action: 'getCurrentLocation',
    icon: 'location',
  },
  {
    label: '設定',
    title: '設定を開く',
    action: 'openSettings',
    icon: 'settings',
  },
];
