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

    const createElement = (type: 'text' | 'url', content: string, index: number) => {
      const isUrl = type === 'url';
      return React.createElement(
        'div',
        {
          key: `${type}-${index}`,
          className: 'grid grid-cols-[6rem_1fr] items-baseline',
        },
        [
          React.createElement(
            'span',
            {
              className: 'text-sm font-semibold text-gray-600',
            },
            isUrl ? 'URL:' : '説明:',
          ),
          isUrl
            ? React.createElement(
                'a',
                {
                  href: content,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  className: 'text-sm text-blue-600 hover:underline block',
                },
                content,
              )
            : React.createElement(
                'span',
                {
                  className: 'text-sm',
                },
                content.trim(),
              ),
        ],
      );
    };

    return React.createElement('div', { className: 'space-y-2' }, [
      ...content.text.map((line, index) => createElement('text', line, index)),
      ...content.urls.map((url, index) => createElement('url', url, index)),
    ]);
  } catch (error) {
    console.error('Error formatting information:', error);
    return null;
  }
};
