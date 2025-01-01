import React from 'react';

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

export const formatInformation = (text: string | null) => {
  if (!text?.trim()) return null;

  try {
    const content = splitContentByType(text);

    return React.createElement('div', { className: 'space-y-2' }, [
      // テキストの表示
      ...content.text.map((line, index) =>
        React.createElement(
          'div',
          {
            key: `text-${index}`,
            className: 'grid grid-cols-[6rem_1fr] items-baseline',
          },
          [
            React.createElement(
              'span',
              {
                className: 'text-sm font-semibold text-gray-600',
              },
              '説明:',
            ),
            React.createElement(
              'span',
              {
                className: 'text-sm',
              },
              line.trim(),
            ),
          ],
        ),
      ),
      // URLリンクの表示
      ...content.urls.map((url, index) =>
        React.createElement(
          'div',
          {
            key: `url-${index}`,
            className: 'grid grid-cols-[6rem_1fr] items-baseline',
          },
          [
            React.createElement(
              'span',
              {
                className: 'text-sm font-semibold text-gray-600',
              },
              'URL:',
            ),
            React.createElement(
              'a',
              {
                href: url,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'text-sm text-blue-600 hover:underline block',
              },
              url,
            ),
          ],
        ),
      ),
    ]);
  } catch (error) {
    console.error('Error formatting information:', error);
    return null;
  }
};
