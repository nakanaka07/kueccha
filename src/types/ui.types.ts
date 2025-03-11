export interface MenuItem {
  label: string;
  title: string;
  action: string;
  icon?: string;
}

export interface MenuItemWithHandler extends MenuItem {
  onClick: () => void;
}
