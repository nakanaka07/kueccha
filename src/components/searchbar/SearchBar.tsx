// Reactと必要なフックをインポートします。
// useState: 状態を管理するために使用します。
// useEffect: 副作用を処理するために使用します。
// useCallback: メモ化されたコールバック関数を作成するために使用します。
import React, { useState, useEffect, useCallback } from 'react';
// CSSファイルをインポートします。スタイルを適用するために使用します。
import './SearchBar.css';
// 型定義をインポートします。
// Poi: ポイントオブインタレストの型を定義します。
// SearchBarProps: SearchBarコンポーネントのプロパティの型を定義します。
import { Poi, SearchBarProps } from '../../utils/types';

// SearchBarコンポーネントを定義します。
// onSearch: 検索クエリが変更されたときに呼び出されるコールバック関数です。
// pois: 検索対象のポイントオブインタレストの配列です。
const SearchBar: React.FC<SearchBarProps> = ({ onSearch, pois }) => {
  // 検索クエリを管理する状態変数です。初期値は空文字列です。
  const [query, setQuery] = useState('');
  // 検索候補を管理する状態変数です。初期値は空の配列です。
  const [suggestions, setSuggestions] = useState<Poi[]>([]);

  // 入力フィールドの変更を処理する関数です。
  // useCallbackフックを使用して、依存関係が変更された場合にのみこの関数を再生成します。
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value); // 入力値を状態に設定します。
    },
    [], // 依存関係は空の配列です。この関数は一度だけ生成されます。
  );

  // 検索ボタンがクリックされたときに呼び出される関数です。
  const handleSearch = useCallback(() => {
    onSearch(query); // 親コンポーネントから渡されたonSearchコールバックを呼び出します。
  }, [onSearch, query]); // onSearchとqueryが変更された場合にのみこの関数を再生成します。

  // クリアボタンがクリックされたときに呼び出される関数です。
  const handleClear = useCallback(() => {
    setQuery(''); // 検索クエリを空にします。
    setSuggestions([]); // 検索候補を空にします。
    onSearch('clear'); // 親コンポーネントから渡されたonSearchコールバックを呼び出します。
  }, [onSearch]); // onSearchが変更された場合にのみこの関数を再生成します。

  // 一覧ボタンがクリックされたときに呼び出される関数です。
  const handleShowAll = useCallback(() => {
    setQuery(''); // 検索クエリを空にします。
    setSuggestions([]); // 検索候補を空にします。
    onSearch('all'); // 親コンポーネントから渡されたonSearchコールバックを呼び出します。
  }, [onSearch]); // onSearchが変更された場合にのみこの関数を再生成します。

  // 検索候補がクリックされたときに呼び出される関数です。
  const handleSuggestionClick = useCallback(
    (suggestion: Poi) => {
      setQuery(suggestion.name); // 検索クエリを候補の名前に設定します。
      setSuggestions([]); // 検索候補を空にします。
      onSearch(suggestion.name); // 親コンポーネントから渡されたonSearchコールバックを呼び出します。
    },
    [onSearch], // onSearchが変更された場合にのみこの関数を再生成します。
  );

  // 検索クエリが変更されたときに検索候補を更新するための副作用を処理します。
  useEffect(() => {
    if (query) {
      // 検索クエリが存在する場合、検索候補をフィルタリングします。
      const filteredSuggestions = pois.filter((poi) => poi.name.toLowerCase().includes(query.toLowerCase()));
      setSuggestions(filteredSuggestions); // フィルタリングされた候補を状態に設定します。
    } else {
      setSuggestions([]); // 検索クエリが空の場合、検索候補を空にします。
    }
  }, [query, pois]); // queryとpoisが変更された場合にのみこの副作用を再実行します。

  // コンポーネントのJSXを返します。
  return (
    <div className="search-bar">
      <input
        type="text" // 入力フィールドのタイプをテキストに設定します。
        value={query} // 入力フィールドの値を状態から取得します。
        onChange={handleInputChange} // 入力フィールドの変更イベントハンドラを設定します。
        placeholder="検索..." // プレースホルダーを設定します。
        className="search-input" // CSSクラスを設定します。
      />
      <div className="search-buttons">
        <button onClick={handleSearch} className="search-button">
          検索
        </button>
        <button onClick={handleClear} className="search-button">
          クリア
        </button>
        <button onClick={handleShowAll} className="search-button">
          一覧
        </button>
      </div>
      <div className="suggestions">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id} // 各候補の一意のキーとしてsuggestion.idを使用します。
            onClick={() => handleSuggestionClick(suggestion)} // クリックイベントハンドラを設定します。
            className="suggestion-item" // CSSクラスを設定します。
          >
            {suggestion.name} {/* 候補の名前を表示します。 */}
          </div>
        ))}
      </div>
    </div>
  );
};

// SearchBarコンポーネントをエクスポートします。
export default SearchBar;
