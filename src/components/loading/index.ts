/**
 * @fileoverview ローディング関連コンポーネントの集約モジュール
 *
 * @description
 * アプリケーション全体で一貫したローディング表現を実現するためのコンポーネントをエクスポートします。
 * 様々なローディング表示パターン（スピナー、スケルトン、フォールバック）を統一的なAPIで提供し、
 * ユーザー体験の向上とコード再利用性の促進を目的としています。
 *
 * @module LoadingComponents
 *
 * @usage
 * 以下のようなケースで使用します：
 * - APIリクエスト中のローディング状態表示
 * - 画面遷移時の読み込みインジケーター
 * - 非同期処理中のフィードバック提供
 * - データが存在しない場合のプレースホルダー表示
 *
 * @example
 * // 個別コンポーネントのインポート
 * import { Spinner, LoadingFallback } from '../components/loading';
 *
 * // 使用例
 * function DataView({ isLoading, data, error }) {
 *   if (isLoading) return <Spinner size="large" />;
 *   if (error) return <LoadingFallback error={error} />;
 *   return <div>{data.map(item => <Item key={item.id} {...item} />)}</div>;
 * }
 *
 * @example
 * // 統一APIを使用した例
 * import { LoadingIndicators } from '../components/loading';
 *
 * function ProfileView({ isLoading, profile, error }) {
 *   if (error) return <LoadingIndicators.Fallback error={error} />;
 *
 *   return (
 *     <div className="profile-container">
 *       {isLoading ? (
 *         <LoadingIndicators.Skeleton type="text" count={3} />
 *       ) : (
 *         <ProfileDetails data={profile} />
 *       )}
 *     </div>
 *   );
 * }
 *
 * @bestPractices
 * - ローディング表示は適切な場所に配置し、ユーザーに明確なフィードバックを提供する
 * - 短時間のローディングには遅延表示（delayMs）を使用してちらつきを防止する
 * - エラー状態には必ずユーザーが理解できるメッセージと可能であれば回復手段を提供する
 * - モバイルデバイスでのパフォーマンスを考慮し、必要に応じてよりシンプルな表示を選択する
 */

// 各コンポーネントを正しくエクスポート
import { useLoadingState } from '../../hooks/useLoadingState';
import { LoadingFallback } from '../loadingfallback/LoadingFallback';
import { SkeletonLoader } from '../skeleton/SkeletonLoader';
import { Spinner } from '../spinner/Spinner';

/**
 * ローディング状態管理カスタムフック
 *
 * @description
 * ローディング状態の管理とフェードアウト効果の制御を行うフック。
 * 表示・非表示の制御とアニメーション状態を提供します。
 *
 * @see {@link ../../hooks/useLoadingState.ts} - 実装の詳細
 */
export { useLoadingState };

/**
 * スピナーコンポーネント
 *
 * @description
 * シンプルな回転アニメーションによるローディングインジケーター。
 * ボタン内やフォーム送信時など、小さなスペースでのローディング表示に適しています。
 *
 * @see {@link ../spinner/Spinner.tsx} - 実装の詳細
 */
export { Spinner };

/**
 * ローディングフォールバックコンポーネント
 *
 * @description
 * 画面全体または大きな領域でのローディング状態表示。
 * エラー表示やリトライ機能も備えています。
 *
 * @see {@link ../loadingfallback/LoadingFallback.tsx} - 実装の詳細
 */
export { LoadingFallback };

/**
 * スケルトンローダーコンポーネント
 *
 * @description
 * コンテンツの形状を模したプレースホルダー表示。
 * データ読み込み中に実際のUIレイアウトを予見させることでユーザー体験を向上します。
 *
 * @see {@link ../skeleton/SkeletonLoader.tsx} - 実装の詳細
 */
export { SkeletonLoader };

/**
 * 統一されたローディングインジケーターAPI
 *
 * @description
 * 全てのローディングコンポーネントに一貫したアクセス方法を提供する統一オブジェクト。
 * アプリケーション全体での一貫性を保ちながら、コンテキストに応じて適切な
 * ローディング表示を選択できます。
 *
 * @property {Spinner} Spinner - 回転アニメーションによるシンプルなローディングインジケーター
 * @property {LoadingFallback} Fallback - 画面全体または大きな領域でのローディング表示
 * @property {SkeletonLoader} Skeleton - コンテンツ形状を模したプレースホルダー表示
 *
 * @example
 * // コンテキストに応じて適切なローディング表示を選択
 * function ContentLoader({ type, isLoading, data }) {
 *   if (!isLoading) return <Content data={data} />;
 *
 *   switch (type) {
 *     case 'spinner':
 *       return <LoadingIndicators.Spinner size="medium" />;
 *     case 'skeleton':
 *       return <LoadingIndicators.Skeleton type="text" count={5} />;
 *     default:
 *       return <LoadingIndicators.Fallback message="読み込み中..." />;
 *   }
 * }
 */
export const LoadingIndicators = {
  Spinner,
  Fallback: LoadingFallback,
  Skeleton: SkeletonLoader,
};
