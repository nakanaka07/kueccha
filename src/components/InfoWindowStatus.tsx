import React, { useMemo } from 'react';

import { PointOfInterest } from '@/types/poi';

// 曜日名の定数配列（コンポーネント外部で定義し、再レンダリング時の再生成を防止）
const DAY_NAMES = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'] as const;

/**
 * 営業状況を表示するバッジコンポーネント
 * POIの営業状態を「閉店」「本日定休日」「営業中」のいずれかで表示します
 */
const StatusBadge: React.FC<{ poi: PointOfInterest }> = ({ poi }) => {
  // 営業状態の計算をメモ化して不要な再計算を防止
  const status = useMemo(() => {
    // 閉店している場合
    if (poi.isClosed) {
      return 'closed';
    }

    // 現在の曜日が定休日かどうかチェック
    const now = new Date();
    const day = now.getDay(); // 0: 日曜, 1: 月曜, ...
    const dayOffKey = `${DAY_NAMES[day]}定休日` as keyof PointOfInterest;
    const isDayOff = poi[dayOffKey] === true;

    // 定休日の場合
    if (isDayOff) {
      return 'day-off';
    }

    // 上記以外は営業中
    return 'open';
  }, [poi]);

  // ステータスに応じたバッジを表示
  switch (status) {
    case 'closed':
      return (
        <span className='status-badge closed' aria-label='閉店'>
          閉店
        </span>
      );
    case 'day-off':
      return (
        <span className='status-badge day-off' aria-label='本日定休日'>
          本日定休日
        </span>
      );
    case 'open':
      return (
        <span className='status-badge open' aria-label='営業中'>
          営業中
        </span>
      );
    default:
      return null;
  }
};

export default StatusBadge;
