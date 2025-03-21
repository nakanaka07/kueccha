/**
 * 環境変数管理ユーティリティ
 * 
 * プロジェクト全体で一貫した環境変数アクセスを提供します。
 * 環境変数の型安全性と存在確認を行います。
 */

// 環境タイプの定義
export type Environment = 'development' | 'production' | 'test';

// 現在の環境を取得
export const getEnvironment = (): Environment => {
  const env = import.meta.env.MODE || process.env.NODE_ENV || 'development';
  return env as Environment;
};

// 環境変数の型安全な取得
export const getEnvVariable = (key: string, defaultValue: string = ''): string => {
  const value = import.meta.env[`VITE_${key}`] || process.env[`VITE_${key}`] || defaultValue;
  return value;
};

// 必須環境変数の取得（存在しない場合は警告を出す）
export const getRequiredEnvVariable = (key: string): string => {
  const fullKey = `VITE_${key}`;
  const value = import.meta.env[fullKey] || process.env[fullKey];
  
  if (!value && getEnvironment() !== 'test') {
    console.warn(`Warning: Required environment variable ${fullKey} is not set.`);
  }
  
  return value || '';
};

// 開発環境かどうかを判定
export const isDevelopment = (): boolean => getEnvironment() === 'development';

// 本番環境かどうかを判定
export const isProduction = (): boolean => getEnvironment() === 'production';

// テスト環境かどうかを判定
export const isTest = (): boolean => getEnvironment() === 'test';

// API関連の環境変数
export const MAPS_API_KEY = getRequiredEnvVariable('GOOGLE_MAPS_API_KEY');
export const MAPS_MAP_ID = getRequiredEnvVariable('GOOGLE_MAPS_MAP_ID');
export const SHEETS_API_KEY = getRequiredEnvVariable('GOOGLE_SHEETS_API_KEY');
export const SPREADSHEET_ID = getRequiredEnvVariable('GOOGLE_SPREADSHEET_ID');

// EmailJS関連の環境変数
export const EMAILJS_SERVICE_ID = getRequiredEnvVariable('EMAILJS_SERVICE_ID');
export const EMAILJS_TEMPLATE_ID = getRequiredEnvVariable('EMAILJS_TEMPLATE_ID');
export const EMAILJS_PUBLIC_KEY = getRequiredEnvVariable('EMAILJS_PUBLIC_KEY');