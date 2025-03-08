/**
 * 機能: ローディング状態の表示とフェードアウト効果を管理するカスタムフック
 * 依存関係:
 *   - React hooks (useState, useEffect)
 *   - BACKGROUND_HIDE_DELAY 定数 (UI定数)
 * 注意点:
 *   - isLoading と isLoaded の2つのフラグで状態を制御
 *   - フェードアウト効果のタイミングはfadeDurationで調整可能
 *   - アニメーションにはCSSトランジションと連携することを想定
 *   - コンポーネントがアンマウントされる前にタイマーをクリアする
 */
import { useState, useEffect } from 'react';
import { BACKGROUND_HIDE_DELAY } from '../../constants/ui';

export function useLoadingState(isLoading: boolean, isLoaded: boolean, fadeDuration: number = BACKGROUND_HIDE_DELAY) {
  const [isVisible, setIsVisible] = useState(isLoading);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!isLoading && isLoaded) {
      setIsFading(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsFading(false);
      }, fadeDuration);

      return () => clearTimeout(timer);
    } else {
      setIsFading(false);
      setIsVisible(true);
    }
  }, [isLoaded, isLoading, fadeDuration]);

  return { isVisible, isFading };
}
