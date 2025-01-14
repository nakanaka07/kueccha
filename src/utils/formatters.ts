import React from 'react';

export const formatInformation = (text: string | null) => {
  if (!text?.trim()) return null;

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
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
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const lines = text.split('\n');

    return {
      text: lines.filter((line) => !line.match(urlRegex)),
      urls: lines.filter((line) => line.match(urlRegex)).filter(isValidUrl),
    };
  };

  try {
    const content = splitContentByType(text);

    const createElement = (
      type: 'text' | 'url',
      content: string,
      index: number,
    ) => {
      const isUrl = type === 'url';
      return React.createElement('div', { key: `${type}-${index}` }, [
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
      ]);
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
