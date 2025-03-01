/**
 * SkeletonLoader.tsx
 *
 * @description
 * データ読み込み中に表示するスケルトンUI（コンテンツのプレースホルダー）を生成するコンポーネント。
 * 実際のコンテンツが読み込まれる前に、その形状や構造を視覚的に表現し、
 * ユーザーにコンテンツの配置や読み込み状態を直感的に伝えます。
 *
 * @usage
 * 以下のようなケースで使用します：
 * - APIからのデータフェッチング中の表示
 * - 画像やメディアの読み込み中
 * - リスト項目やカードなどのコンテナの読み込み中
 * - テキストコンテンツが表示される前のプレースホルダー
 * - ページ全体のレイアウトの事前表示
 *
 * @features
 * - 複数の形状オプション（長方形、円形、テキスト）
 * - カスタマイズ可能なサイズ設定
 * - 複数のスケルトン要素を一度に生成可能
 * - パルスアニメーション効果（CSSで実装）
 * - アクセシビリティ対応（スクリーンリーダーからは非表示）
 *
 * @props
 * - type: 'rectangle' | 'circle' | 'text' - スケルトンUIの形状
 * - width?: string - 要素の幅（デフォルト: '100%'）
 * - height?: string - 要素の高さ（デフォルト: '20px'）
 * - count?: number - 生成する要素の数（デフォルト: 1）
 *
 * @example
 * // シンプルな使用例：1つのテキスト行
 * <SkeletonLoader type="text" />
 *
 * // 複数行のテキストを模倣
 * <SkeletonLoader type="text" count={3} />
 *
 * // プロフィール画像のプレースホルダー
 * <SkeletonLoader type="circle" width="60px" height="60px" />
 *
 * // カードレイアウトの例
 * <div className="card">
 *   <SkeletonLoader type="rectangle" height="150px" /> // 画像部分
 *   <div className="content">
 *     <SkeletonLoader type="text" width="70%" /> // タイトル
 *     <SkeletonLoader type="text" count={3} /> // テキスト本文
 *   </div>
 * </div>
 *
 * @bestPractices
 * - 実際のコンテンツとできるだけ似た形状やサイズを使用する
 * - スケルトンUIが表示される時間が長すぎると不安感を与えるため、長時間の表示を避ける
 * - モバイルでは要素数を減らしてシンプルなスケルトンUIを表示する
 * - 複雑なレイアウトでは複数のSkeletonLoader要素を組み合わせて使用する
 *
 * @dependencies
 * - SkeletonLoader.module.css: アニメーションとスタイルを提供するCSSモジュール
 * - React: Fragment機能を使用して複数要素を返却
 * - LoadingFallback: このコンポーネントを利用する可能性のある親コンポーネント
 */

import React from 'react';
import styles from './SkeletonLoader.module.css';

/**
 * スケルトンローダーのプロパティ定義
 *
 * @property type - スケルトン要素の形状を指定（長方形、円形、テキスト行）
 * @property width - 要素の幅を指定（任意のCSSサイズ値）
 * @property height - 要素の高さを指定（任意のCSSサイズ値）
 * @property count - 生成する要素の数（リスト表示などで複数要素を生成する場合に使用）
 */
export interface SkeletonLoaderProps {
  type: 'rectangle' | 'circle' | 'text';
  width?: string;
  height?: string;
  count?: number;
}

/**
 * スケルトンローダーコンポーネント
 *
 * 指定された形状、サイズ、数のスケルトンUI要素を生成します。
 * プレースホルダーとして機能し、実際のコンテンツがロードされるまでの間、
 * ページのレイアウトを保持します。
 *
 * @param type - スケルトン要素の形状
 * @param width - 要素の幅（デフォルト: '100%'）
 * @param height - 要素の高さ（デフォルト: '20px'）
 * @param count - 生成する要素の数（デフォルト: 1）
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, width = '100%', height = '20px', count = 1 }) => {
  // 指定された数だけスケルトン要素の配列を生成
  const items = Array(count)
    .fill(0)
    .map((_, index) => (
      <div
        key={index}
        className={`${styles.skeleton} ${styles[type]}`}
        style={{ width, height }}
        aria-hidden="true" // スクリーンリーダーでは読み上げない
      />
    ));

  // Fragmentを使用して複数の要素を返す
  return <>{items}</>;
};

export default SkeletonLoader;
