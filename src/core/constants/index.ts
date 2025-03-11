import { AREAS } from './areas';
import { CONFIG } from './config';
import { MARKERS } from './markers';
import { LOADING_MESSAGES, ERRORS } from './messages';
import { INFO_WINDOW_BUSINESS_HOURS, MENU_ITEMS, LOADING_DELAY, BACKGROUND_HIDE_DELAY } from './ui';

export * from './areas';
export * from './markers';
export * from './config';
export * from './messages';
export * from './ui';

export const APP = {
  areas: AREAS,
  markers: MARKERS,
  businessHours: INFO_WINDOW_BUSINESS_HOURS,
  menuItems: MENU_ITEMS,
  ui: {
    loadingDelay: LOADING_DELAY,
    backgroundHideDelay: BACKGROUND_HIDE_DELAY,
    messages: {
      loading: LOADING_MESSAGES,
      errors: ERRORS,
    },
  },
  config: CONFIG,
};
