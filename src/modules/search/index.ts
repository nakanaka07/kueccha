/*
 * 機能: 検索モジュールのエントリーポイント。コンポーネント、フックをアプリケーションの他の部分に公開する
 * 依存関係:
 *   - React
 *   - ./components/SearchBarContainer
 *   - ./components/SearchResults
 *   - ./hooks/useSearch
 * 注意点:
 *   - このファイルは検索関連の機能をアプリケーションに提供するための参照点として機能します
 *   - SearchOptionsインターフェースも一緒にエクスポーネットされています
 */

export { default as SearchBar } from './components/SearchBarContainer';
export { default as SearchResults } from './components/SearchResults';

export { default as useSearch, type SearchOptions } from './hooks/useSearch';
