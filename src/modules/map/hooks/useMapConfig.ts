/*
 * 機能: マップ設定の検証と提供を行うカスタムフック
 * 依存関係:
 *   - React (useState, useEffect)
 *   - MAPS_CONFIG（マップ設定定数）
 *   - ERROR_MESSAGES（エラーメッセージ定数）
 * 注意点:
 *   - 必須設定（apiKey, mapId）が欠けている場合エラーを生成
 *   - マップ設定をアプリケーション全体で一貫して利用できるよう正規化
 *   - 設定値のフォールバック処理が含まれる
 */

import { useState, useEffect } from 'react';
import { MAPS_CONFIG } from '../../../constants/config';
import { ERROR_MESSAGES } from '../../../constants/messages';

export function useMapConfig() {
  const [configError, setConfigError] = useState<Error | null>(null);

  useEffect(() => {
    if (!(MAPS_CONFIG.apiKey && MAPS_CONFIG.mapId)) {
      setConfigError(new Error(ERROR_MESSAGES.MAP.CONFIG_MISSING));
    } else {
      setConfigError(null);
    }
  }, []);

  return {
    configError,
    apiKey: MAPS_CONFIG.apiKey || '',
    mapId: MAPS_CONFIG.mapId || '',
    libraries: MAPS_CONFIG.libraries,
    version: MAPS_CONFIG.version,
    language: MAPS_CONFIG.language,
    defaultCenter: MAPS_CONFIG.defaultCenter,
    defaultZoom: MAPS_CONFIG.defaultZoom,
    mapOptions: {
      ...MAPS_CONFIG.options,
      mapTypeControlOptions: {
        ...MAPS_CONFIG.options.mapTypeControlOptions,
        mapTypeIds: Array.from(MAPS_CONFIG.options.mapTypeControlOptions.mapTypeIds),
      },
    },
  };
}
