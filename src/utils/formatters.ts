import React from 'react';

// テキストをフォーマットしてReact要素を返す関数
export const formatInformation = (
  text: string | null,
): React.ReactElement | null => {
  if (!text?.trim()) return null;

  // URLが有効かどうかをチェックする関数
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // テキストをURLとその他のテキストに分割する関数
  const splitContentByType = (
    text: string,
  ): { text: string[]; urls: string[] } => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const lines = text.split('\n');

    return {
      text: lines.filter((line) => !line.match(urlRegex)),
      urls: lines.filter((line) => line.match(urlRegex)).filter(isValidUrl),
    };
  };

  // URLを指定された長さに切り詰める関数
  const truncateUrl = (url: string, maxLength: number): string => {
    if (url.length <= maxLength) return url;
    return `${url.slice(0, maxLength)}...`;
  };

  // テキストまたはURLのReact要素を作成する関数
  const createElement = (
    type: 'text' | 'url',
    content: string,
    index: number,
  ): React.ReactElement | null => {
    const elementKey = `${type}-${index}-${content}`;

    try {
      return React.createElement('div', { key: elementKey }, [
        type === 'url'
          ? React.createElement(
              'a',
              {
                key: `${elementKey}-link`,
                href: content,
                target: '_blank',
                rel: 'noopener noreferrer',
                title: content,
                className: 'formatted-url', // クラス名を追加
              },
              truncateUrl(content, 30),
            )
          : React.createElement(
              'span',
              { key: `${elementKey}-text` },
              content.trim(),
            ),
      ]);
    } catch (error) {
      console.error('Error creating element:', error);
      return null;
    }
  };

  try {
    const content = splitContentByType(text);

    return React.createElement('div', { key: 'info-container' }, [
      ...content.text.map((line, index) => createElement('text', line, index)),
      ...content.urls.map((url, index) => createElement('url', url, index)),
    ]);
  } catch (error) {
    console.error('Error formatting information:', error);
    return null;
  }
};

// 電話番号が有効かどうかをチェックする関数
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9-+() ]+$/;
  return phoneRegex.test(phone);
};
