import React from 'react'; // Reactをインポート

// 情報をフォーマットする関数
export const formatInformation = (text: string | null) => {
  if (!text?.trim()) return null; // テキストが空またはnullの場合はnullを返す

  // URLが有効かどうかをチェックする関数
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url); // URLオブジェクトを作成して有効性をチェック
      return true; // 有効なURLの場合はtrueを返す
    } catch {
      return false; // 無効なURLの場合はfalseを返す
    }
  };

  // テキストをURLとその他のテキストに分割する関数
  const splitContentByType = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g; // URLを検出する正規表現
    const lines = text.split('\n'); // テキストを行ごとに分割

    return {
      text: lines.filter((line) => !line.match(urlRegex)), // URLでない行を抽出
      urls: lines.filter((line) => line.match(urlRegex)).filter(isValidUrl), // 有効なURLを抽出
    };
  };

  // URLを指定された長さに切り詰める関数
  const truncateUrl = (url: string, maxLength: number) => {
    if (url.length <= maxLength) return url; // URLが指定された長さ以下の場合はそのまま返す
    return `${url.slice(0, maxLength)}...`; // URLが長い場合は切り詰めて返す
  };

  try {
    const content = splitContentByType(text); // テキストをURLとその他のテキストに分割

    // 要素を作成する関数
    const createElement = (
      type: 'text' | 'url',
      content: string,
      index: number,
    ) => {
      const elementKey = `${type}-${index}-${content}`; // 要素のキーを生成

      try {
        return React.createElement('div', { key: elementKey }, [
          React.createElement(
            'span',
            { key: `${elementKey}-label` },
            type === 'url' ? 'URL:' : '説明:', // URLの場合は'URL:'、テキストの場合は'説明:'を表示
          ),
          type === 'url'
            ? React.createElement(
                'a',
                {
                  key: `${elementKey}-link`,
                  href: content,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  title: content,
                },
                truncateUrl(content, 30), // URLを切り詰めて表示
              )
            : React.createElement(
                'span',
                { key: `${elementKey}-text` },
                content.trim(), // テキストを表示
              ),
        ]);
      } catch (error) {
        console.error('Error creating element:', error); // 要素の作成中にエラーが発生した場合はコンソールにエラーを表示
        return null; // nullを返す
      }
    };

    return React.createElement('div', { key: 'info-container' }, [
      ...content.text.map((line, index) => createElement('text', line, index)), // テキスト要素を作成
      ...content.urls.map((url, index) => createElement('url', url, index)), // URL要素を作成
    ]);
  } catch (error) {
    console.error('Error formatting information:', error); // フォーマット中にエラーが発生した場合はコンソールにエラーを表示
    return null; // nullを返す
  }
};
