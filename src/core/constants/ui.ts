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

export interface MenuItem {
  label: string;
  title: string;
  action: string;
  icon?: string;
}
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
