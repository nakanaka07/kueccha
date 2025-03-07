import { useState, useEffect } from 'react';
import { BACKGROUND_HIDE_DELAY } from '../../constants/ui';

/**
 * ローディング状態とフェードアウト処理を管理するカスタムフック
 *
 * @param isLoading - ロード中かどうかを示すフラグ
 * @param isLoaded - 読み込みが完了したかどうかを示すフラグ
 * @param fadeDuration - フェードアウトにかかる時間（ミリ秒）
 * @returns オブジェクト { isVisible, isFading }
 */
export function useLoadingState(isLoading: boolean, isLoaded: boolean, fadeDuration: number = BACKGROUND_HIDE_DELAY) {
  // 表示状態を管理（ロード中は表示する）
  const [isVisible, setIsVisible] = useState(isLoading);
  // フェードアウト中かどうかを管理
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // ロード完了時（isLoading=false & isLoaded=true）にフェードアウト処理を実行
    if (!isLoading && isLoaded) {
      setIsFading(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsFading(false);
      }, fadeDuration);

      return () => clearTimeout(timer);
    } else {
      // ロード中またはデータが未ロードの場合は表示
      setIsFading(false);
      setIsVisible(true);
    }
  }, [isLoaded, isLoading, fadeDuration]);

  return { isVisible, isFading };
}
