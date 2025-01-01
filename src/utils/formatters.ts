import React from 'react';

type FormatOptions = {
  urlClassName?: string;
  textClassName?: string;
};

export const formatInformation = (text: string | null, options?: FormatOptions) => {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const defaultOptions: Required<FormatOptions> = {
    urlClassName: 'text-blue-600 hover:underline break-all inline',
    textClassName: '',
  };

  const { urlClassName, textClassName } = { ...defaultOptions, ...options };

  return text.split('\n').map((line, lineIndex) =>
    React.createElement(
      React.Fragment,
      { key: `line-${lineIndex}` },
      line.split(urlRegex).map((part, partIndex) => {
        if (part.match(urlRegex)) {
          return React.createElement('a', {
            key: `${lineIndex}-${partIndex}`,
            href: part,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: urlClassName,
            children: part,
          });
        }
        return React.createElement('span', {
          key: `${lineIndex}-${partIndex}`,
          className: textClassName,
          children: part,
        });
      }),
    ),
  );
};
