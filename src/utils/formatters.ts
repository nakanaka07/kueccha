import React from 'react';

/**
 * テキスト情報をフォーマットしてReact要素として返す関数
 * @param text フォーマットするテキスト
 * @returns フォーマットされたReact要素
 */
export const formatInformation = (text: string | null) => {
  // テキストが空またはnullの場合はnullを返す
  if (!text?.trim()) return null;

  /**
   * URLが有効かどうかをチェックする関数
   * @param url チェックするURL
   * @returns 有効なURLの場合はtrue、無効なURLの場合はfalse
   */
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * テキストをURLとその他のテキストに分割する関数
   * @param text 分割するテキスト
   * @returns URLとその他のテキストを含むオブジェクト
   */
  const splitContentByType = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const lines = text.split('\n');

    return {
      text: lines.filter((line) => !line.match(urlRegex)),
      urls: lines.filter((line) => line.match(urlRegex)).filter(isValidUrl),
    };
  };

  try {
    const content = splitContentByType(text);

    /**
     * テキストまたはURLのReact要素を作成する関数
     * @param type 要素のタイプ ('text' または 'url')
     * @param content 要素の内容
     * @param index 要素のインデックス
     * @returns 作成されたReact要素
     */
    const createElement = (type: 'text' | 'url', content: string, index: number) => {
      const isUrl = type === 'url';
      return React.createElement(
        'div',
        {
          key: `${type}-${index}`,
        },
        [
          React.createElement('span', {}, isUrl ? 'URL:' : '説明:'),
          isUrl
            ? React.createElement(
                'a',
                {
                  href: content,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                },
                content,
              )
            : React.createElement('span', {}, content.trim()),
        ],
      );
    };

    return React.createElement('div', {}, [
      ...content.text.map((line, index) => createElement('text', line, index)),
      ...content.urls.map((url, index) => createElement('url', url, index)),
    ]);
  } catch (error) {
    console.error('Error formatting information:', error);
    return null;
  }
};
