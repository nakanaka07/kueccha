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

  const splitContentByType = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const lines = text.split('\n');

    return {
      text: lines.filter((line) => !line.match(urlRegex)),
      urls: lines.filter((line) => line.match(urlRegex)).filter(isValidUrl),
    };
  };

  const truncateUrl = (url: string, maxLength: number) => {
    if (url.length <= maxLength) return url;
    return `${url.slice(0, maxLength)}...`;
  };

  try {
    const content = splitContentByType(text);

    const createElement = (
      type: 'text' | 'url',
      content: string,
      index: number,
    ) => {
      const isUrl = type === 'url';
      const elementKey = `${type}-${index}-${content}`;

      return React.createElement('div', { key: elementKey }, [
        React.createElement(
          'span',
          { key: `${elementKey}-label` },
          isUrl ? 'URL:' : '説明:'
        ),
        isUrl
          ? React.createElement(
              'a',
              {
                key: `${elementKey}-link`,
                href: content,
                target: '_blank',
                rel: 'noopener noreferrer',
                title: content,
              },
              truncateUrl(content, 30),
            )
          : React.createElement('span', { key: `${elementKey}-text` }, content.trim()),
      ]);
    };

    return React.createElement('div', { key: 'info-container' }, [
      ...content.text.map((line, index) => createElement('text', line, index)),
      ...content.urls.map((url, index) => createElement('url', url, index)),
    ]);
  } catch (error) {
    console.error('Error formatting information:', error);
    return null;
  }
};
