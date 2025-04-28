/**
 * クライアント側で実行される環境変数検証
 * ブラウザ環境でも安全に動作するよう設計
 * 静的ホスティング環境を前提とした実装
 */

import { getEnvVar } from '../src/env/core';

import { logger } from '@/utils/logger';

// 検証対象の環境変数 - 定数による一元管理
const CLIENT_ENV_KEYS = {
  GOOGLE_API_KEY: 'VITE_GOOGLE_API_KEY',
  GOOGLE_MAPS_MAP_ID: 'VITE_GOOGLE_MAPS_MAP_ID',
  APP_NAME: 'VITE_APP_NAME',
  APP_VERSION: 'VITE_APP_VERSION',
  STORAGE_PREFIX: 'VITE_STORAGE_PREFIX',
};

/**
 * 必須環境変数リスト（パフォーマンスのために配列を定数化）
 */
const REQUIRED_ENV_VARS = [
  CLIENT_ENV_KEYS.GOOGLE_API_KEY,
  // 他の必須変数をここに追加
];

/**
 * 警告対象の環境変数リスト（存在しなくてもエラーではないが、確認が必要）
 */
const WARNING_ENV_VARS = [CLIENT_ENV_KEYS.GOOGLE_MAPS_MAP_ID, CLIENT_ENV_KEYS.STORAGE_PREFIX];

/**
 * 環境変数の値が有効かどうか判定する
 * @param key 検証する環境変数のキー
 * @returns 検証結果（成功=true、失敗=false）と値
 */
function checkEnvVar(key: string): { isValid: boolean; value: string } {
  try {
    const value = getEnvVar({ key, defaultValue: '' });
    return { isValid: Boolean(value), value };
  } catch {
    return { isValid: false, value: '' };
  }
}

/**
 * 値の長さが特定の基準内か検証する
 * @param value 検証する値
 * @param minLength 最小長（デフォルト=1）
 * @param maxLength 最大長（デフォルトなし）
 * @returns 検証結果（成功=true、失敗=false）
 */
function validateLength(value: string, minLength = 1, maxLength?: number): boolean {
  return value.length >= minLength && (maxLength === undefined || value.length <= maxLength);
}

/**
 * クライアント側で必要な環境変数を検証する
 * @returns 検証結果（成功=true、失敗=false）と問題点のリスト
 */
export function validateClientEnv(): { isValid: boolean; issues: string[] } {
  try {
    const issues: string[] = [];
    let isValid = true;

    // 必須環境変数のチェック
    const missingVars = REQUIRED_ENV_VARS.filter(key => {
      const { isValid: exists } = checkEnvVar(key);
      return !exists;
    });

    // 欠落している変数があればエラーリストに追加
    if (missingVars.length > 0) {
      const errorMsg = `必須環境変数が欠落しています: ${missingVars.join(', ')}`;
      issues.push(errorMsg);
      isValid = false;
    }

    // Google APIキーの特殊検証
    const { isValid: hasApiKey, value: apiKey } = checkEnvVar(CLIENT_ENV_KEYS.GOOGLE_API_KEY);
    if (hasApiKey) {
      // APIキーが短すぎる場合は警告（通常のAPIキーは長い文字列）
      if (!validateLength(apiKey, 20)) {
        const warning = `Google API Keyが短すぎる可能性があります(${apiKey.length}文字)`;
        issues.push(warning);
        isValid = false;
      }

      // 明らかに不正な値のチェック（プレースホルダーなど）
      if (['YOUR_API_KEY', 'REPLACE_WITH_YOUR_KEY', 'API_KEY_HERE'].includes(apiKey)) {
        const error = `Google API Keyにプレースホルダー値(${apiKey})が設定されています`;
        issues.push(error);
        isValid = false;
      }
    }

    // 警告対象の環境変数をチェック
    WARNING_ENV_VARS.forEach(key => {
      const { isValid: exists } = checkEnvVar(key);
      if (!exists) {
        const warning = `推奨環境変数 ${key} が未設定です`;
        issues.push(warning);
        // 警告のみなのでisValidはfalseにしない
      }
    });

    // アプリケーション名のチェック
    const { isValid: hasAppName, value: appName } = checkEnvVar(CLIENT_ENV_KEYS.APP_NAME);
    if (!hasAppName || !validateLength(appName, 2)) {
      const warning = `アプリケーション名が未設定または短すぎます(${appName})`;
      issues.push(warning);
      // 必須ではないのでisValidはtrueのまま
    }

    // 検証結果をログに出力
    if (!isValid) {
      logger.error('クライアント環境変数の検証に失敗しました', {
        component: 'client-env-validator',
        issues,
      });
    } else if (issues.length > 0) {
      logger.warn('クライアント環境変数に警告があります', {
        component: 'client-env-validator',
        warnings: issues,
      });
    } else {
      logger.info('クライアント環境変数バリデーション完了', {
        component: 'client-env-validator',
        validated: true,
      });
    }

    return { isValid, issues };
  } catch (error) {
    // 予期せぬエラーの安全な処理
    const errorMsg = `環境変数の検証中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMsg, {
      component: 'client-env-validator',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { isValid: false, issues: [errorMsg] };
  }
}

/**
 * 環境変数の一部値を安全に表示するための関数（開発目的のみ）
 * @param key 環境変数キー
 * @returns マスクされた環境変数の値
 */
export function getDebugEnvValue(key: string): string {
  try {
    const value = getEnvVar({ key, defaultValue: '' });
    if (!value) return '[未設定]';

    // APIキーなど機密情報は一部をマスク
    if (key.includes('API_KEY') || key.includes('SECRET')) {
      if (value.length <= 8) return '[マスク済み]';
      return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    }

    return value;
  } catch {
    return '[アクセス不可]';
  }
}
