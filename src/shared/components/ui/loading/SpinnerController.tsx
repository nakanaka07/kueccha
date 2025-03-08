/*
 * 機能: ローディングスピナーの表示制御ロジックを担当するコンテナコンポーネント
 * 依存関係:
 *   - React（useState, useEffect, memo）
 *   - SpinnerViewコンポーネント
 *   - useLoadingStateフック
 * 注意点:
 *   - 遅延表示（delayMs）機能によりちらつき防止が可能
 *   - isLoadingとisLoadedプロパティを使用することでローディング状態を制御できます
 *   - ローディング完了時にフェードアウト効果を適用可能（fadeDuration）
 */
import React, { useState, useEffect } from 'react';
import { SpinnerView } from './SpinnerView';
import { useLoadingState } from '../core/hooks/useLoadingState';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  label?: string;
  isLoading?: boolean;
  isLoaded?: boolean;
  delayMs?: number;
  fadeDuration?: number;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color,
  className = '',
  label = 'ローディング中',
  isLoading,
  isLoaded,
  delayMs = 0,
  fadeDuration = 5000,
}) => {
  const [shouldRender, setShouldRender] = useState(delayMs === 0);

  const { isVisible, isFading } =
    isLoading !== undefined && isLoaded !== undefined
      ? useLoadingState(isLoading, isLoaded, fadeDuration)
      : { isVisible: true, isFading: false };

  useEffect(() => {
    if (delayMs > 0) {
      const timer = setTimeout(() => setShouldRender(true), delayMs);
      return () => clearTimeout(timer);
    }
  }, [delayMs]);

  if (!isVisible || !shouldRender) return null;

  return <SpinnerView size={size} color={color} className={className} label={label} isFading={isFading} />;
};

Spinner.displayName = 'Spinner';

export default React.memo(Spinner);
