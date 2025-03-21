/**
 * デバイス検出とレスポンシブ対応のユーティリティ
 */

/** レスポンシブ設計のブレークポイント (ピクセル単位) */
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE_DESKTOP: 1440,
};

/**
 * デバイスと画面サイズを考慮したモバイル判定
 * @returns モバイル向けUIを表示すべきかどうか
 */
export function isMobile(): boolean {
  // ブラウザ環境チェック
  if (typeof window === 'undefined') return false;

  // デバイス判定（ユーザーエージェント）
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator?.userAgent || '',
  );

  // 画面サイズ判定
  const isMobileViewport = window.innerWidth <= BREAKPOINTS.MOBILE;

  return isMobileDevice || isMobileViewport;
}

/**
 * デバイス設定の統合オブジェクト
 */
export const DeviceConfig = {
  breakpoints: BREAKPOINTS,
  isMobile: typeof window !== 'undefined' ? isMobile() : false,
  isTouch: typeof window !== 'undefined' && 'ontouchstart' in window,
};

export default DeviceConfig;
