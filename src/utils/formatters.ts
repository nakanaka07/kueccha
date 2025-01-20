import React from 'react';

export const formatInformation = (text: string | null) => {
  if (!text?.trim()) return null; // テキストが空またはnullの場合はnullを返す

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url); // URLが有効かどうかをチェック
      return true;
    } catch {
      return false;
    }
  };

  /**
   * テキストをURLとその他のテキストに分離する関数
   * @param text 分離するテキスト
   * @returns URLとその他のテキストを含むオブジェクト
   */
  const splitContentByType = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g; // URLを検出する正規表現
    const lines = text.split('\n'); // テキストを行ごとに分割

    return {
      text: lines.filter((line) => !line.match(urlRegex)), // URLでない行をフィルタ
      urls: lines.filter((line) => line.match(urlRegex)).filter(isValidUrl), // 有効なURLをフィルタ
    };
  };

  try {
    const content = splitContentByType(text); // テキストをURLとその他のテキストに分離

    const createElement = (
      type: 'text' | 'url',
      content: string,
      index: number,
    ) => {
      const isUrl = type === 'url'; // タイプがURLかどうかをチェック
      return React.createElement('div', { key: `${type}-${index}` }, [
        React.createElement('span', {}, isUrl ? 'URL:' : '説明:'), // タイプに応じたラベルを作成
        isUrl
          ? React.createElement(
              'a',
              {
                href: content,
                target: '_blank',
                rel: 'noopener noreferrer',
              },
              content,
            ) // URLの場合はリンクを作成
          : React.createElement('span', {}, content.trim()), // テキストの場合はスパンを作成
      ]);
    };

    return React.createElement('div', {}, [
      ...content.text.map((line, index) => createElement('text', line, index)), // テキストを要素に変換
      ...content.urls.map((url, index) => createElement('url', url, index)), // URLを要素に変換
    ]);
  } catch (error) {
    console.error('Error formatting information:', error); // エラーをコンソールに出力
    return null; // エラーが発生した場合はnullを返す
  }
};
