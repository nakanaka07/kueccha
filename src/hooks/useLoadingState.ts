/**
 * useLoadingState.ts
 *
 * @description
 * ローディング状態の管理と視覚的なフェードアウトエフェクトを提供するカスタムフック。
 * データの読み込み状態に基づいて、ローディングコンポーネントの表示・非表示とアニメーション効果を
 * 制御するために使用します。
 *
 * @param isLoading - 現在ロード中かどうかを示すフラグ。trueの場合、ローディングインジケーターを表示。
 * @param isLoaded - ロードが完了したかどうかを示すフラグ。trueになると、フェードアウト処理を開始。
 * @param fadeDuration - フェードアウト効果の持続時間（ミリ秒単位）。
 *
 * @returns {Object} ローディング表示の状態管理に必要なオブジェクト
 * @returns {boolean} isVisible - コンポーネントを表示すべきかどうか。falseの場合、完全に非表示に。
 * @returns {boolean} isFading - 現在フェードアウト中かどうか。CSSアニメーションの適用に使用。
 *
 * @example
 * // LoadingFallbackコンポーネント内での使用例
 * const { isVisible, isFading } = useLoadingState(isDataLoading, !!data, 1000);
 *
 * // isVisibleがfalseの場合は何も表示しない
 * if (!isVisible) return null;
 *
 * // isFadingを使用してCSSクラスを条件付きで適用
 * return (
 *   <div className={`loadingIndicator ${isFading ? 'fadeOut' : ''}`}>
 *     ロード中...
 *   </div>
 * );
 *
 * @notes
 * - isLoadingがfalseかつisLoadedがtrueになった時点でフェードアウト処理を開始します
 * - フェードアウト中はisFadingがtrueになり、CSS側でアニメーションを実装できます
 * - fadeDuration後に完全に非表示（isVisible=false）になります
 * - コンポーネントのアンマウント時にタイマーをクリアし、メモリリークを防止します
 */
import { useState, useEffect } from 'react';

/**
 * ローディング状態の管理と視覚的なフェードアウト効果を提供するカスタムフック
 */
export function useLoadingState(isLoading: boolean, isLoaded: boolean, fadeDuration: number) {
  // コンポーネントを表示するかどうかの状態
  const [isVisible, setIsVisible] = useState(isLoading);

  // フェードアウトアニメーションを適用するかどうかの状態
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // ロード完了時：フェードアウト効果を開始し、一定時間後に非表示にする
    if (!isLoading && isLoaded) {
      setIsFading(true);

      const timer = setTimeout(() => {
        setIsVisible(false); // コンポーネントを非表示に
        setIsFading(false); // フェード状態をリセット
      }, fadeDuration);

      // コンポーネントのアンマウント時にタイマーをクリア
      return () => clearTimeout(timer);
    }
    // ロード中またはロード前：即時表示
    else {
      setIsFading(false);
      setIsVisible(true);
    }
  }, [isLoaded, isLoading, fadeDuration]);

  return { isVisible, isFading };
}
