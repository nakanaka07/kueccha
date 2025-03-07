import React from 'react';

export const formatInformation = (text: string | null): React.ReactElement | null => {
  if (!text?.trim()) return null;

  // URLの正規表現を改善（より正確に検出する）
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const splitContentByType = (text: string): { text: string[]; urls: string[] } => {
    const lines = text.split('\n');
    const result = { text: [], urls: [] } as { text: string[]; urls: string[] };

    // 各行ごとに処理し、URL部分とテキスト部分を分離する
    lines.forEach((line) => {
      const matches = line.match(urlRegex);

      if (matches && matches.length > 0) {
        // URLを含む行
        const validUrls = matches.filter(isValidUrl);
        result.urls.push(...validUrls);

        // URLを除いたテキスト部分があれば追加
        const textPart = line.replace(urlRegex, '').trim();
        if (textPart) result.text.push(textPart);
      } else if (line.trim()) {
        // 通常のテキスト行
        result.text.push(line);
      }
    });

    return result;
  };

  const truncateUrl = (url: string, maxLength: number): string => {
    if (url.length <= maxLength) return url;

    // URLをより読みやすく省略する
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname;

      if (domain.length + 5 >= maxLength) {
        return `${domain.substring(0, maxLength - 3)}...`;
      }

      const pathMaxLength = maxLength - domain.length - 3;
      const truncatedPath = path.length > pathMaxLength ? `${path.substring(0, pathMaxLength)}...` : path;

      return `${domain}${truncatedPath}`;
    } catch {
      // 万が一失敗したら単純な省略に戻す
      return `${url.slice(0, maxLength)}...`;
    }
  };

  const createElement = (type: 'text' | 'url', content: string, index: number): React.ReactElement | null => {
    if (!content.trim()) return null;

    const elementKey = `${type}-${index}-${content.substring(0, 20)}`;

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
    const elements = [
      ...content.text.map((line, index) => createElement('text', line, index)),
      ...content.urls.map((url, index) => createElement('url', url, index)),
    ].filter(Boolean); // nullを除外

    return elements.length > 0 ? React.createElement('div', { key: 'info-container' }, elements) : null;
  } catch (error) {
    console.error('Error formatting information:', error);
    return null;
  }
};

export const isValidPhoneNumber = (phone: string): boolean => {
  // より厳格な電話番号チェック（国際標準対応）
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}$/;
  return phone ? phoneRegex.test(phone) : false;
};
