/**
 * デバイス検出とプラットフォーム関連のユーティリティ
 */

/** モバイルデバイス判定のためのユーザーエージェント正規表現 */
const MOBILE_UA_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

/** レスポンシブ設計のブレークポイント (ピクセル単位) */
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE_DESKTOP: 1440,
};

/**
 * デバイスの種類を判定
 * @returns モバイルデバイスかどうか
 */
export function isMobileDevice(): boolean {
  // ブラウザ環境以外では常にfalseを返す
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return false;
  }
  return MOBILE_UA_REGEX.test(navigator.userAgent);
}

/**
 * 画面サイズに基づくモバイル判定
 * @returns 現在の画面幅がモバイルサイズかどうか
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= BREAKPOINTS.MOBILE;
}

/**
 * デバイスと画面サイズの両方を考慮したスマート判定
 * @returns モバイル向けUIを表示すべきかどうか
 */
export function isMobileExperience(): boolean {
  return isMobileDevice() || isMobileViewport();
}

/**
 * デバイス設定の統合オブジェクト
 */
export const DeviceConfig = {
  isMobile: isMobileExperience(),
  breakpoints: BREAKPOINTS,
  isTouch: typeof window !== 'undefined' && ('ontouchstart' in window),
  isMobileCheck: isMobileExperience,
};