/**
 * フォーマット関連のユーティリティ関数
 * 
 * POIの情報を表示用に整形するためのヘルパー関数を提供します。
 */

import React from 'react';
import type { Poi } from '../types';
import { INFO_WINDOW_BUSINESS_HOURS } from '../constants';

/**
 * テキストをフォーマットしてReact要素を返す関数
 * 
 * @param text - フォーマットするテキスト
 * @returns フォーマットされたReact要素、またはnull
 */
export const formatInformation = (text: string | null): React.ReactElement | null => {
  if (!text?.trim()) return null;

  /**
   * URLが有効かどうかをチェックする関数
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
   */
  const splitContentByType = (text: string): { text: string[]; urls: string[] } => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const lines = text.split('\n');

    return {
      text: lines.filter((line) => !line.match(urlRegex)),
      urls: lines.filter((line) => line.match(urlRegex)).filter(isValidUrl),
    };
  };

  /**
   * URLを指定された長さに切り詰める関数
   */
  const truncateUrl = (url: string, maxLength: number): string => {
    return url.length <= maxLength ? url : `${url.slice(0, maxLength)}...`;
  };

  /**
   * テキストまたはURLのReact要素を作成する関数
   */
  const createElement = (type: 'text' | 'url', content: string, index: number): React.ReactElement | null => {
    const elementKey = `${type}-${index}-${content.substring(0, 10)}`;
    
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
    const textElements = content.text.map((line, index) => createElement('text', line, index));
    const urlElements = content.urls.map((url, index) => createElement('url', url, index));
    
    return React.createElement('div', { key: 'info-container' }, [
      ...textElements.filter(Boolean),
      ...urlElements.filter(Boolean),
    ]);
  } catch (error) {
    console.error('Error formatting information:', error);
    return null;
  }
};

/**
 * 電話番号が有効かどうかをチェックする関数
 * 
 * @param phone - 検証する電話番号文字列
 * @returns 有効な電話番号かどうかのブール値
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9-+() ]+$/;
  return phoneRegex.test(phone);
};

/**
 * POIの営業時間情報を整形して表示形式のリストとして返す関数
 * 
 * @param poi - フォーマットする営業時間情報を含むPOIオブジェクト
 * @returns 曜日と営業時間の表示用ペアの配列
 */
export const formatBusinessHours = (poi: Poi): { day: string; hours: string }[] => {
  return INFO_WINDOW_BUSINESS_HOURS
    .filter(({ key }) => {
      const hours = poi.businessHours?.[key];
      return hours && hours.trim() !== '';
    })
    .map(({ day, key }) => ({
      day,
      hours: poi.businessHours?.[key] || ''
    }));
};

/**
 * POIの休日情報を整形する関数
 * 
 * @param poi - 休日情報を含むPOIオブジェクト
 * @returns フォーマットされた休日情報、または情報がない場合は空文字列
 */
export const formatHolidayInfo = (poi: Poi): string => {
  return poi.holidayInfo?.trim() || '情報なし';
};

/**
 * POIの住所情報を整形する関数
 * 
 * @param poi - 住所情報を含むPOIオブジェクト
 * @returns フォーマットされた住所、または住所がない場合は「住所情報なし」
 */
export const formatAddress = (poi: Poi): string => {
  return poi.address?.trim() || '住所情報なし';
};

/**
 * POIの詳細情報を整形して表示データの配列を作成する関数
 * 
 * @param poi - 詳細情報を含むPOIオブジェクト
 * @returns 整形されたPOI情報の配列 [ラベル, 値]
 */
export const formatPoiDetails = (poi: Poi): [string, string | React.ReactElement | null][] => {
  const details: [string, string | React.ReactElement | null][] = [];
  
  // 基本情報
  details.push(['名称', poi.name]);
  details.push(['カテゴリ', poi.category]);
  
  // 条件付きで情報を追加
  if (poi.address) {
    details.push(['住所', formatAddress(poi)]);
  }
  
  if (poi.phone && isValidPhoneNumber(poi.phone)) {
    details.push(['電話番号', poi.phone]);
  }
  
  if (poi.parking) {
    details.push(['駐車場', poi.parking]);
  }
  
  if (poi.payment) {
    details.push(['決済方法', poi.payment]);
  }
  
  if (poi.information) {
    details.push(['追加情報', formatInformation(poi.information)]);
  }
  
  return details;
};