/**
 * ローディング関連定数ファイル
 */
import { getEnvValue } from '../utils/env.utils';
import type { ProgressPercentage } from '../types/loading.types';

// 定数定義
export const LOADING = {
  // タイミング関連の定数
  timing: {
    LOADING_DELAY: getEnvValue<number>('VITE_LOADING_DELAY', 0, Number, { logErrors: false }),
    BACKGROUND_HIDE_DELAY: getEnvValue<number>('VITE_BACKGROUND_HIDE_DELAY', 1000, Number, {
      logErrors: false,
    }),
    RETRY_TIMEOUT: getEnvValue<number>('VITE_RETRY_TIMEOUT', 30000, Number, { logErrors: false }),
    DEFAULT_LOADING_TIMEOUT: getEnvValue<number>('VITE_LOADING_TIMEOUT', 30000, Number, {
      logErrors: false,
    }),
    get DEFAULT_FADE_DURATION() {
      return this.BACKGROUND_HIDE_DELAY;
    },
  },

  // UI表示関連の定数
  ui: {
    DEFAULT_LOADING_MESSAGE: getEnvValue<string>(
      'VITE_LOADING_MESSAGE',
      'データを読み込んでいます...',
      String,
      { logErrors: false },
    ),
    DEFAULT_SPINNER_CLASS: 'spinner-border text-primary',
    MOBILE_SPINNER_CLASS: 'spinner-border spinner-border-sm text-primary',
  },

  // アニメーション関連の定数
  animation: {
    SPINNER_ANIMATION_DURATION: '0.75s',
    FADE_TIMING_FUNCTION: 'ease-in-out',
    MOBILE_ANIMATION_DURATION: '0.5s',
  },

  // デバイス固有の設定を取得する関数
  getDeviceSettings(isMobile: boolean = false) {
    return {
      spinnerClass: isMobile ? this.ui.MOBILE_SPINNER_CLASS : this.ui.DEFAULT_SPINNER_CLASS,
      animationDuration: isMobile
        ? this.animation.MOBILE_ANIMATION_DURATION
        : this.animation.SPINNER_ANIMATION_DURATION,
      loadingDelay: isMobile ? 0 : this.timing.LOADING_DELAY,
      fadeTimingFunction: this.animation.FADE_TIMING_FUNCTION,
    };
  },

  // よく使用される設定
  get default() {
    return {
      delay: this.timing.LOADING_DELAY,
      message: this.ui.DEFAULT_LOADING_MESSAGE,
      spinnerClass: this.ui.DEFAULT_SPINNER_CLASS,
      animationDuration: this.animation.SPINNER_ANIMATION_DURATION,
      timeout: this.timing.DEFAULT_LOADING_TIMEOUT,
    };
  },
};

// 後方互換性のために一般的な定数をエクスポート
export const DEFAULT_LOADING_MESSAGE = LOADING.ui.DEFAULT_LOADING_MESSAGE;
export const DEFAULT_SPINNER_CLASS = LOADING.ui.DEFAULT_SPINNER_CLASS;
export const DEFAULT_FADE_DURATION = LOADING.timing.DEFAULT_FADE_DURATION;
export const DEFAULT_LOADING_TIMEOUT = LOADING.timing.DEFAULT_LOADING_TIMEOUT;
export const RETRY_TIMEOUT = LOADING.timing.RETRY_TIMEOUT;
