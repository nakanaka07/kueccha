// ReactとuseCallbackフックをインポートします。
// React: Reactコンポーネントを作成するために使用します。
// useCallback: メモ化されたコールバック関数を作成するために使用します。
import React, { useCallback } from 'react';
// CSSモジュールをインポートします。
// styles: このコンポーネント専用のスタイルを定義したCSSモジュールです。
import styles from './SearchResults.module.css';
// 型定義をインポートします。
// Poi: ポイントオブインタレストの型を定義します。
import type { Poi } from '../../utils/types';

// SearchResultsコンポーネントのプロパティの型を定義します。
// results: 検索結果のポイントオブインタレストの配列です。
// onResultClick: 検索結果がクリックされたときに呼び出されるコールバック関数です。
interface SearchResultsProps {
  results: Poi[];
  onResultClick: (poi: Poi) => void;
}

// SearchResultsコンポーネントを定義します。
// 検索結果を表示し、クリックイベントを処理します。
const SearchResults: React.FC<SearchResultsProps> = ({ results, onResultClick }) => {
  // 検索結果がクリックされたときに呼び出される関数を定義します。
  // useCallbackフックを使用して、onResultClickが変更された場合にのみこの関数を再生成します。
  const handleResultClick = useCallback(
    (poi: Poi) => {
      // 検索結果がクリックされたことをコンソールにログ出力します。
      console.log('Result clicked:', poi);
      // 親コンポーネントから渡されたonResultClickコールバックを呼び出します。
      onResultClick(poi);
    },
    [onResultClick], // onResultClickが変更された場合にのみこの関数を再生成します。
  );

  // 検索結果を表示するためのJSXを返します。
  return (
    <div className={styles.searchResults}>
      {/* 検索結果の配列をマッピングし、各結果を表示します。 */}
      {results.map((poi) => (
        <div
          key={poi.id} // 各結果の一意のキーとしてpoi.idを使用します。
          className={styles.searchResultItem} // CSSモジュールのクラスを適用します。
          onClick={() => handleResultClick(poi)} // クリックイベントハンドラを設定します。
          role="button" // アクセシビリティのためにrole属性を設定します。
          tabIndex={0} // キーボード操作を可能にするためにtabIndexを設定します。
          onKeyDown={(e) => {
            // キーボードイベントハンドラを設定します。
            if (e.key === 'Enter' || e.key === ' ') {
              // Enterキーまたはスペースキーが押された場合に処理を行います。
              e.preventDefault(); // デフォルトの動作を防ぎます。
              handleResultClick(poi); // クリックイベントハンドラを呼び出します。
            }
          }}
        >
          <h3>{poi.name}</h3> {/* 検索結果の名前を表示します。 */}
          <p>
            {typeof poi.description === 'string'
              ? poi.description // 検索結果の説明を表示します。
              : 'No description available'}{' '}
            {/* 説明がない場合のフォールバックテキストを表示します。 */}
          </p>
          <p>{poi.address}</p> {/* 検索結果の住所を表示します。 */}
        </div>
      ))}
    </div>
  );
};

// React.memoを使用して、propsが変更されない限りコンポーネントを再レンダリングしないようにします。
export default React.memo(SearchResults);
