import React from 'react';

export const formatInformation = (text: string | null): React.ReactElement | null => {
  if (!text?.trim()) return null;

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const splitContentByType = (text: string): { text: string[]; urls: string[] } => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const lines = text.split('\n');

    return {
      text: lines.filter((line) => !line.match(urlRegex)),
      urls: lines.filter((line) => line.match(urlRegex)).filter(isValidUrl),
    };
  };

  const truncateUrl = (url: string, maxLength: number): string => {
    if (url.length <= maxLength) return url;
    return `${url.slice(0, maxLength)}...`;
  };

  const createElement = (type: 'text' | 'url', content: string, index: number): React.ReactElement | null => {
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
                className: 'formatted-url',
              },
              truncateUrl(content, 30),
            )
          : React.createElement('span', { key: `${elementKey}-text` }, content.trim()),
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

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9-+() ]+$/;
  return phoneRegex.test(phone);
};
