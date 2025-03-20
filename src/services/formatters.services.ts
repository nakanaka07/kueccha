/**
 * POI情報の表示用フォーマッター
 */

import React from 'react';
import { INFO_WINDOW_BUSINESS_HOURS } from '../constants';
import type { Poi } from '../types';

/**
 * テキストをURLリンクを含むReact要素に変換
 */
export const formatInformation = (text: string | null): React.ReactElement | null => {
  if (!text?.trim()) return null;

  try {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const lines = text.split('\n');
    const textLines = lines.filter(line => !line.match(urlRegex));
    const urlLines = lines
      .filter(line => line.match(urlRegex))
      .filter(line => {
        try { new URL(line); return true; } catch { return false; }
      });

    const textElements = textLines.map((line, i) => (
      <div key={`text-${i}`}>
        <span>{line.trim()}</span>
      </div>
    ));
    
    const urlElements = urlLines.map((url, i) => (
      <div key={`url-${i}`}>
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={url}
          className="formatted-url"
        >
          {url.length <= 30 ? url : `${url.slice(0, 30)}...`}
        </a>
      </div>
    ));

    return <div key="info-container">{[...textElements, ...urlElements]}</div>;
  } catch (error) {
    console.error('Error formatting information:', error);
    return null;
  }
};

/**
 * 電話番号の有効性を検証
 */
export const isValidPhoneNumber = (phone: string): boolean => 
  /^[0-9-+() ]+$/.test(phone);

/**
 * POIの営業時間情報を整形
 */
export const formatBusinessHours = (poi: Poi): { day: string; hours: string }[] => 
  INFO_WINDOW_BUSINESS_HOURS
    .filter(({ key }) => poi.businessHours?.[key]?.trim())
    .map(({ day, key }) => ({
      day,
      hours: poi.businessHours?.[key] || '',
    }));

/**
 * POIの休日情報を整形
 */
export const formatHolidayInfo = (poi: Poi): string => 
  poi.holidayInfo?.trim() || '情報なし';

/**
 * POIの住所情報を整形
 */
export const formatAddress = (poi: Poi): string => 
  poi.address?.trim() || '住所情報なし';

/**
 * POIの詳細情報を整形
 */
export const formatPoiDetails = (poi: Poi): [string, string | React.ReactElement | null][] => {
  const details: [string, string | React.ReactElement | null][] = [
    ['名称', poi.name],
    ['カテゴリ', poi.category]
  ];

  if (poi.address) details.push(['住所', formatAddress(poi)]);
  if (poi.phone && isValidPhoneNumber(poi.phone)) details.push(['電話番号', poi.phone]);
  if (poi.parking) details.push(['駐車場', poi.parking]);
  if (poi.payment) details.push(['決済方法', poi.payment]);
  if (poi.information) details.push(['追加情報', formatInformation(poi.information)]);

  return details;
};