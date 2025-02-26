/**
 * SearchResults.tsx
 *
 * このファイルは地図アプリケーション内で検索結果を表示するためのコンポーネントを実装しています。
 * 検索結果のPOI（Point of Interest）データをリスト形式で表示し、ユーザーが項目をクリックして
 * 詳細を確認できるようにします。アクセシビリティに配慮し、マウスだけでなくキーボード操作にも
 * 対応しています。
 *
 * 主な機能：
 * - 検索結果のPOIをリスト形式で表示
 * - 各POIのクリックイベント処理
 * - キーボードアクセシビリティのサポート
 */

// 必要なライブラリと型のインポート
import React, { useCallback } from 'react';
// Reactライブラリとフックをインポート - UIコンポーネントの構築と最適化に必要
import styles from './SearchResults-module.css';
// CSSモジュールをインポート - コンポーネント固有のスタイルをカプセル化
import type { Poi, SearchResultsProps } from '../../utils/types';
// 型定義をインポート - タイプセーフな実装を実現

/**
 * SearchResultsコンポーネント
 *
 * 検索結果のPOIデータをリスト形式で表示し、クリックイベントを処理します。
 * 各POIはカード形式で表示され、名前、説明、住所などの情報を含みます。
 * アクセシビリティ対応としてキーボード操作も可能です。
 *
 * @param results - 表示する検索結果のPOI配列
 * @param onResultClick - 検索結果がクリックされたときに実行されるコールバック関数
 */
const SearchResults: React.FC<SearchResultsProps> = ({ results, onResultClick }) => {
  /**
   * 検索結果がクリックされたときに呼び出される関数
   *
   * クリックされたPOIを親コンポーネントに通知します。
   * useCallbackでメモ化することで、不要な再レンダリングを防ぎます。
   *
   * @param poi - クリックされたPOIオブジェクト
   */
  const handleResultClick = useCallback(
    (poi: Poi) => {
      // 親コンポーネントから渡されたコールバックを呼び出し、クリックされたPOIを通知
      onResultClick(poi);
    },
    [onResultClick], // onResultClickが変更された場合にのみ関数を再生成
  );

  // 検索結果がない場合の表示
  if (results.length === 0) {
    return (
      <div className={styles.noResults} role="status" aria-live="polite">
        検索結果がありません
      </div>
    );
  }

  // 検索結果の一覧を表示するJSXを返します
  return (
    // 検索結果全体を包むコンテナ要素
    <div className={styles.searchResults} role="listbox" aria-label="検索結果">
      {/* 検索結果の配列をマッピングし、各POIを個別の要素として表示 */}
      {results.map((poi) => (
        <div
          key={poi.id} // Reactの再レンダリング最適化のため、各項目に一意のキーを設定
          className={styles.searchResultItem} // 検索結果項目のスタイル適用
          onClick={() => handleResultClick(poi)} // マウスクリック時のイベントハンドラを設定
          role="option" // スクリーンリーダー向けにリストオプションとしての役割を明示
          aria-selected="false" // 選択状態を明示（通常は選択されていない状態）
          tabIndex={0} // キーボードでフォーカス可能にする（タブ操作の対象に含める）
          onKeyDown={(e) => {
            // キーボードイベントを処理するハンドラ
            if (e.key === 'Enter' || e.key === ' ') {
              // EnterキーまたはSpaceキーが押された場合の処理
              e.preventDefault(); // ブラウザのデフォルト動作を防止（スクロールなど）
              handleResultClick(poi); // クリックと同じ動作を実行し、アクセシビリティを確保
            }
          }}
        >
          {/* POIの名前をヘッダーとして表示 */}
          <h3>{poi.name}</h3>

          {/* POIの説明文を表示（説明が存在する場合のみ） */}
          {typeof poi.description === 'string' && <p>{poi.description}</p>}

          {/* 説明がない場合は代替テキストを表示（必要に応じて） */}
          {!poi.description && <p className={styles.noDescription}>詳細情報なし</p>}

          {/* POIの住所情報を表示（住所が存在する場合のみ） */}
          {poi.address && <p className={styles.address}>{poi.address}</p>}
        </div>
      ))}
    </div>
  );
};

// React.memoでコンポーネントをメモ化
// propsが変更されない限り再レンダリングをスキップし、パフォーマンスを最適化
export default React.memo(SearchResults);
