/**
 * アプリケーション全体で使用するログ関連の型定義
 */
export type LogCategory = 
  | 'CONFIG' 
  | 'API' 
  | 'APP' 
  | 'AUTH' 
  | 'DB'
  | 'APP_LOAD'
  | 'UI'
  | 'PWA'
  | 'SYSTEM';

export type LogCode =
  | 'ENV_ERROR'
  | 'ENV_WARNING'
  | 'ENV_DEFAULT'
  | 'ENV_CHECK'
  | 'PWA_WARNING';