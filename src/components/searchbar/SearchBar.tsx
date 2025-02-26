/**
 * SearchBar.tsx
 *
 * このファイルは地図アプリケーション内で検索機能を提供するSearchBarコンポーネントを実装しています。
 * ユーザーは検索ボックスに入力することでPOI（Point of Interest）データを検索できます。
 * 入力に応じてリアルタイムで検索候補を表示し、ユーザーがより効率的に目的の場所を見つけられるようサポートします。
 *
 * 主な機能：
 * - テキスト入力フィールドでの検索クエリ入力
 * - 検索クエリに基づくリアルタイムの検索候補表示
 * - 検索、クリア、一覧表示のためのボタン操作
 */

// Reactと必要なフックをインポートします。
import React, { useState, useEffect, useCallback } from 'react';
// React: UIコンポーネントを構築するためのライブラリです。
// useState: コンポーネント内で状態を管理するためのフックです。検索クエリや候補リストの状態を保持します。
// useEffect: 副作用（API呼び出しやDOM操作など）を処理するためのフックです。検索候補の更新に使用します。
// useCallback: パフォーマンス最適化のため、関数をメモ化するフックです。不要な再レンダリングを防ぎます。
// SearchBarコンポーネント専用のスタイルをインポートします。
import './SearchBar-module.css';
// このCSSファイルには検索バーの視覚的なデザイン（入力フィールド、ボタン、候補リストなど）が定義されています。
// アプリケーション全体で使用される型定義をインポートします。
import { Poi, SearchBarProps } from '../../utils/types';
// Poi: 地図上の位置情報（名前、座標、ID、エリアなど）を表す型定義です。
// SearchBarProps: SearchBarコンポーネントが受け取るプロパティの型を定義します。

/**
 * SearchBarコンポーネント
 *
 * ユーザーがPOI（Point of Interest）を検索するためのインターフェースを提供します。
 * 検索クエリの入力、候補の表示、検索実行などの機能を提供します。
 *
 * @param onSearch - 検索実行時に呼び出されるコールバック関数。検索クエリや特殊コマンド（'clear'/'all'）を親コンポーネントに通知します。
 * @param pois - 検索対象となるPOIのリスト。検索候補の生成に使用されます。
 */
const SearchBar: React.FC<SearchBarProps> = ({ onSearch, pois }) => {
  // 検索クエリを管理する状態変数です。
  // ユーザーの入力内容を保持し、検索処理と候補フィルタリングに使用されます。
  // 初期値は空文字列で、ユーザーが何も入力していない状態を表します。
  const [query, setQuery] = useState('');

  // 検索候補を管理する状態変数です。
  // ユーザーの入力に基づいてフィルタリングされたPOI一覧を保持します。
  // 初期値は空の配列で、候補がない状態を表します。
  const [suggestions, setSuggestions] = useState<Poi[]>([]);

  /**
   * 入力フィールドの変更を処理するコールバック関数です。
   * ユーザーがテキスト入力フィールドを変更するたびに呼び出されます。
   *
   * @param e - 入力イベントオブジェクト。イベント対象の値（ユーザーの入力内容）を取得するために使用します。
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // イベントから取得した新しい値を検索クエリ状態にセットします。
      // この更新により、useEffectフックが実行され、検索候補が自動的に更新されます。
      setQuery(e.target.value);
    },
    [], // 依存配列が空なので、このコールバックはコンポーネントがマウントされたときに一度だけ生成されます。
  );

  /**
   * 検索ボタンがクリックされたときに呼び出される関数です。
   * 現在の検索クエリを使用して検索処理を実行します。
   */
  const handleSearch = useCallback(() => {
    // 親コンポーネントから渡されたonSearch関数に現在の検索クエリを渡して実行します。
    // これにより、親コンポーネント側で適切なPOIフィルタリングや地図の更新などが行われます。
    onSearch(query);
  }, [onSearch, query]); // onSearchまたはqueryが変更された場合にのみ関数を再生成します。

  /**
   * クリアボタンがクリックされたときに呼び出される関数です。
   * 検索状態をリセットし、すべての検索条件をクリアします。
   */
  const handleClear = useCallback(() => {
    // 検索クエリを空に設定します。これにより入力フィールドがクリアされます。
    setQuery('');
    // 検索候補リストを空にします。これによりドロップダウンリストが非表示になります。
    setSuggestions([]);
    // 特殊コマンド'clear'を親コンポーネントに送信して、検索結果のクリアを要求します。
    onSearch('clear');
  }, [onSearch]); // onSearchが変更された場合にのみ関数を再生成します。

  /**
   * 一覧ボタンがクリックされたときに呼び出される関数です。
   * すべてのPOIを表示するためのリクエストを送信します。
   */
  const handleShowAll = useCallback(() => {
    // 検索クエリを空に設定します。
    setQuery('');
    // 検索候補リストを空にします。
    setSuggestions([]);
    // 特殊コマンド'all'を親コンポーネントに送信して、すべてのPOIの表示を要求します。
    onSearch('all');
  }, [onSearch]); // onSearchが変更された場合にのみ関数を再生成します。

  /**
   * 検索候補がクリックされたときに呼び出される関数です。
   * 選択された候補を検索クエリとして設定し、検索を実行します。
   *
   * @param suggestion - クリックされたPOI候補オブジェクト。選択された特定のPOIの情報を含みます。
   */
  const handleSuggestionClick = useCallback(
    (suggestion: Poi) => {
      // 選択された候補の名前を検索クエリとして設定します。これにより入力フィールドが更新されます。
      setQuery(suggestion.name);
      // 候補一覧を非表示にするために空にします。選択後は候補リストは不要になります。
      setSuggestions([]);
      // 選択された候補の名前で検索を実行します。これにより特定のPOIが検索結果として表示されます。
      onSearch(suggestion.name);
    },
    [onSearch], // onSearchが変更された場合にのみ関数を再生成します。
  );

  /**
   * 検索クエリの変更を監視し、それに応じて検索候補を更新するeffectフックです。
   * queryまたはpoisが変更されるたびに実行されます。
   * このフックにより、ユーザーが入力するたびにリアルタイムで検索候補が更新されます。
   */
  useEffect(() => {
    if (query) {
      // 検索クエリが存在する場合（空でない場合）、POIリストをフィルタリングします。
      // 検索は大文字小文字を区別せず、部分一致で行われます。
      const filteredSuggestions = pois.filter((poi) => poi.name.toLowerCase().includes(query.toLowerCase()));
      // フィルタリングされた候補リストを状態にセットします。これにより候補一覧が更新されます。
      setSuggestions(filteredSuggestions);
    } else {
      // 検索クエリが空の場合、候補リストを空にします。
      // これにより、ドロップダウンメニューが非表示になります。
      setSuggestions([]);
    }
  }, [query, pois]); // queryまたはpoisが変更された場合にのみ副作用を再実行します。
  // queryの変更でユーザー入力に応じた候補を更新し、poisの変更で検索対象データの変更を反映します。

  /**
   * SearchBarコンポーネントのレンダリング
   * 検索入力フィールド、操作ボタン、検索候補の一覧を含むUIを構築します。
   */
  return (
    <div className="search-bar">
      {/* 検索クエリを入力するためのテキストフィールド */}
      <input
        type="text" // 入力タイプをテキストに指定します。
        value={query} // 入力値を検索クエリ状態と同期させ、制御されたコンポーネントにします。
        onChange={handleInputChange} // 値が変更されたときのハンドラを設定します。
        placeholder="検索..." // 入力フィールドが空のときに表示されるプレースホルダーテキストです。
        className="search-input" // スタイリングのためのCSSクラスです。
      />

      {/* 検索関連の操作ボタングループ */}
      <div className="search-buttons">
        {/* 検索実行ボタン - クリックすると現在のクエリで検索を実行します */}
        <button onClick={handleSearch} className="search-button">
          検索
        </button>

        {/* 検索条件クリアボタン - クリックすると検索状態がリセットされます */}
        <button onClick={handleClear} className="search-button">
          クリア
        </button>

        {/* 全POI表示ボタン - クリックするとすべてのPOIが表示されます */}
        <button onClick={handleShowAll} className="search-button">
          一覧
        </button>
      </div>

      {/* 検索候補のドロップダウンリスト - 検索クエリに基づく候補を表示します */}
      <div className="suggestions">
        {/* 候補リストをマップして各候補をクリック可能なアイテムとして表示します */}
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id} // Reactの最適化のための一意のキー。POIのIDを使用します。
            onClick={() => handleSuggestionClick(suggestion)} // クリック時にこの候補を選択します。
            className="suggestion-item" // スタイリングのためのCSSクラスです。
          >
            {suggestion.name} {/* POIの名前を表示します。ユーザーに視覚的なフィードバックを提供します。 */}
          </div>
        ))}
      </div>
    </div>
  );
};

// SearchBarコンポーネントをデフォルトエクスポートします。
// これにより他のファイルからimport SearchBar from './SearchBar'の形式でインポートできます。
export default SearchBar;
