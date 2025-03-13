/**
 * UIコンポーネントの型定義
 * - メニュー項目の基本構造
 * - クリックハンドラー付きメニュー項目の拡張
 */
export interface MenuItem {
  label: string;
  title: string;
  action: string;
  icon?: string;
}

export interface MenuItemWithHandler extends MenuItem {
  onClick: () => void;
}
