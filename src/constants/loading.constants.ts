/**
 * ローディング関連定数ファイル
 *
 * ローディング表示や遷移に関連する時間設定やデフォルト値を定義します。
 * これらの値はアプリケーション全体でローディング状態の視覚的表現を一貫させるために使用されます。
 */
import { getEnvValue } from '../utils/env.utils';

import type {
  LoadingState,
  validateProgress,
  createInitialLoadingState,
} from '../types/loading.types';

// ============================================================================
// 型定義
// ============================================================================

/**
 * タイミング関連定数の型定義
 */
type TimingConstantsType = {
  /** ローディング表示開始の遅延時間（ミリ秒） */
  LOADING_DELAY: number;
  /** 背景要素の非表示遅延時間（ミリ秒） */
  BACKGROUND_HIDE_DELAY: number;
  /** フェードエフェクトのデフォルト時間（ミリ秒） */
  DEFAULT_FADE_DURATION: number;
  /** ローディングのタイムアウト時間（ミリ秒） */
  DEFAULT_LOADING_TIMEOUT: number;
};

/**
 * UI表示関連定数の型定義
 */
type UIConstantsType = {
  /** ローディング中に表示するデフォルトメッセージ */
  DEFAULT_LOADING_MESSAGE: string;
  /** ローディングスピナーのデフォルトスタイルクラス */
  DEFAULT_SPINNER_CLASS: string;
  /** モバイル用ローディングスピナーのスタイルクラス */
  MOBILE_SPINNER_CLASS: string;
};

/**
 * アニメーション関連定数の型定義
 */
type AnimationConstantsType = {
  /** スピナーの回転速度（CSSアニメーション用、秒単位） */
  SPINNER_ANIMATION_DURATION: string;
  /** フェードイン/アウトのイージング関数 */
  FADE_TIMING_FUNCTION: string;
  /** モバイル用のスピナーアニメーション時間 */
  MOBILE_ANIMATION_DURATION: string;
};

// ============================================================================
// 定数定義
// ============================================================================

/**
 * タイミング関連の定数
 * 時間や遅延に関する設定値を定義します
 */
export const TimingConstants: TimingConstantsType = {
  // 即時表示（値を増やすことでローディング表示の開始を遅延させることが可能）
  LOADING_DELAY: getEnvValue<number>('VITE_LOADING_DELAY', 0, Number, {
    logErrors: false,
  }),

  // ローディング完了後、背景要素を非表示にするまでの遅延時間（ミリ秒）
  BACKGROUND_HIDE_DELAY: getEnvValue<number>('VITE_BACKGROUND_HIDE_DELAY', 1000, Number, {
    logErrors: false,
  }),

  // フェードエフェクトのデフォルト時間
  get DEFAULT_FADE_DURATION(): number {
    return this.BACKGROUND_HIDE_DELAY;
  },

  // ローディングのタイムアウト時間（ミリ秒）
  DEFAULT_LOADING_TIMEOUT: getEnvValue<number>('VITE_LOADING_TIMEOUT', 30000, Number, {
    logErrors: false,
  }),
};

/**
 * UI表示関連の定数
 * メッセージやスタイルクラスなど、表示に関する設定を定義します
 */
export const UIConstants: UIConstantsType = {
  // ローディング中に表示するデフォルトメッセージ
  DEFAULT_LOADING_MESSAGE: getEnvValue<string>(
    'VITE_LOADING_MESSAGE',
    'データを読み込んでいます...',
    String,
    {
      logErrors: false,
    },
  ),

  // ローディングスピナーのデフォルトスタイルクラス
  DEFAULT_SPINNER_CLASS: 'spinner-border text-primary',

  // モバイル用ローディングスピナーのスタイルクラス
  MOBILE_SPINNER_CLASS: 'spinner-border spinner-border-sm text-primary',
};

/**
 * アニメーション関連の定数
 * アニメーションの時間やイージング関数を定義します
 */
export const AnimationConstants: AnimationConstantsType = {
  // スピナーの回転速度（CSSアニメーション用、秒単位）
  SPINNER_ANIMATION_DURATION: '0.75s',

  // フェードイン/アウトのイージング関数
  FADE_TIMING_FUNCTION: 'ease-in-out',

  // モバイル用のスピナーアニメーション時間（より速い）
  MOBILE_ANIMATION_DURATION: '0.5s',
};

// ============================================================================
// エクスポート用の定数
// ============================================================================

/**
 * よく使用される定数をアプリケーション全体からアクセスしやすくするためのエクスポート
 */
export const DEFAULT_LOADING_MESSAGE = UIConstants.DEFAULT_LOADING_MESSAGE;
export const DEFAULT_SPINNER_CLASS = UIConstants.DEFAULT_SPINNER_CLASS;
export const DEFAULT_FADE_DURATION = TimingConstants.DEFAULT_FADE_DURATION;
export const DEFAULT_LOADING_TIMEOUT = TimingConstants.DEFAULT_LOADING_TIMEOUT;

// ============================================================================
// ヘルパー関数
// ============================================================================

/**
 * デバイスに応じたローディング設定を提供する関数
 *
 * @param isMobile モバイルデバイスかどうか
 * @returns デバイスに最適化されたローディング設定
 */
export function getDeviceSpecificLoadingSettings(isMobile: boolean = false) {
  return {
    spinnerClass: isMobile ? UIConstants.MOBILE_SPINNER_CLASS : UIConstants.DEFAULT_SPINNER_CLASS,
    animationDuration: isMobile
      ? AnimationConstants.MOBILE_ANIMATION_DURATION
      : AnimationConstants.SPINNER_ANIMATION_DURATION,
    loadingDelay: isMobile ? 0 : TimingConstants.LOADING_DELAY, // モバイルではより早く表示
    fadeTimingFunction: AnimationConstants.FADE_TIMING_FUNCTION,
  };
}

/**
 * 統合されたローディング設定
 * 使用頻度が高い設定を一箇所にまとめたオブジェクト
 */
export const LoadingConfig = {
  timing: TimingConstants,
  ui: UIConstants,
  animation: AnimationConstants,
  getDeviceSettings: getDeviceSpecificLoadingSettings,

  // よく使用される組み合わせ設定
  default: {
    delay: TimingConstants.LOADING_DELAY,
    message: UIConstants.DEFAULT_LOADING_MESSAGE,
    spinnerClass: UIConstants.DEFAULT_SPINNER_CLASS,
    animationDuration: AnimationConstants.SPINNER_ANIMATION_DURATION,
    timeout: TimingConstants.DEFAULT_LOADING_TIMEOUT,
  },
};
