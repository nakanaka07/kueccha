/**
 * マーカー関連のユーティリティ関数
 * 
 * マーカースタイルの設定や操作に関する関数を提供します。
 */

import type { MarkerConfigAttributes, MarkerStyleOptions } from '../types/markers.types';

/**
 * 設定用マーカー属性からスタイルオプションへの変換関数
 * 
 * @param config マーカー設定属性
 * @param isSelected マーカーが選択状態かどうか
 * @returns マーカースタイルオプション
 */
export function configToStyleOptions(
  config: MarkerConfigAttributes,
  isSelected: boolean = false,
): MarkerStyleOptions {
  return {
    iconUrl: config.icon,
    size: config.size,
    color: isSelected && config.highlightColor ? config.highlightColor : config.color,
    zIndex: config.zIndex,
    animation: config.animation,
    isSelected,
    label: config.accessibilityLabel,
  };
}