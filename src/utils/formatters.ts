// Reactライブラリをインポートします。
// React要素を作成するために使用します。
import React from 'react';

// テキストをフォーマットしてReact要素を返す関数
// 引数としてテキストを受け取り、フォーマットされたReact要素を返します。
export const formatInformation = (
  text: string | null,
): React.ReactElement | null => {
  // テキストが空またはnullの場合はnullを返す
  if (!text?.trim()) return null;

  // URLが有効かどうかをチェックする関数
  // 引数としてURL文字列を受け取り、有効なURLかどうかを判定します。
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url); // URLオブジェクトを生成して有効性をチェック
      return true;
    } catch {
      return false;
    }
  };

  // テキストをURLとその他のテキストに分割する関数
  // 引数としてテキストを受け取り、URLとテキストに分割します。
  const splitContentByType = (
    text: string,
  ): { text: string[]; urls: string[] } => {
    const urlRegex = /(https?:\/\/[^\s]+)/g; // URLを検出する正規表現
    const lines = text.split('\n'); // テキストを行ごとに分割

    return {
      text: lines.filter((line) => !line.match(urlRegex)), // URLでない行を抽出
      urls: lines.filter((line) => line.match(urlRegex)).filter(isValidUrl), // 有効なURLを抽出
    };
  };

  // URLを指定された長さに切り詰める関数
  // 引数としてURLと最大長を受け取り、URLを切り詰めます。
  const truncateUrl = (url: string, maxLength: number): string => {
    if (url.length <= maxLength) return url; // URLが指定された長さ以下の場合はそのまま返す
    return `${url.slice(0, maxLength)}...`; // URLが長い場合は切り詰めて返す
  };

  // テキストまたはURLのReact要素を作成する関数
  // 引数として要素のタイプ、内容、インデックスを受け取り、React要素を作成します。
  const createElement = (
    type: 'text' | 'url',
    content: string,
    index: number,
  ): React.ReactElement | null => {
    const elementKey = `${type}-${index}-${content}`; // 要素のキーを生成

    try {
      // React要素を作成して返す
      return React.createElement('div', { key: elementKey }, [
        type === 'url'
          ? React.createElement(
              'a',
              {
                key: `${elementKey}-link`, // リンク要素のキー
                href: content, // リンクのURL
                target: '_blank', // 新しいタブで開く
                rel: 'noopener noreferrer', // セキュリティ対策
                title: content, // リンクのタイトル
                className: 'formatted-url', // クラス名を追加
              },
              truncateUrl(content, 30), // URLを切り詰めて表示
            )
          : React.createElement(
              'span',
              { key: `${elementKey}-text` }, // テキスト要素のキー
              content.trim(), // テキストを表示
            ),
      ]);
    } catch (error) {
      console.error('Error creating element:', error); // エラーが発生した場合はコンソールに出力
      return null;
    }
  };

  try {
    const content = splitContentByType(text); // テキストをURLとその他のテキストに分割

    return React.createElement('div', { key: 'info-container' }, [
      ...content.text.map((line, index) => createElement('text', line, index)), // テキスト要素を作成
      ...content.urls.map((url, index) => createElement('url', url, index)), // URL要素を作成
    ]);
  } catch (error) {
    console.error('Error formatting information:', error); // エラーが発生した場合はコンソールに出力
    return null;
  }
};

// 電話番号が有効かどうかをチェックする関数
// 引数として電話番号文字列を受け取り、有効な電話番号かどうかを判定します。
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9-+() ]+$/; // 電話番号を検証する正規表現
  return phoneRegex.test(phone); // 電話番号が有効かどうかをチェック
};
