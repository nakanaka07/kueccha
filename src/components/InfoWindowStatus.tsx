import React, { useMemo } from 'react';

import { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';

// 曜日名の定数配列（コンポーネント外部で定義し、再レンダリング時の再生成を防止）
const DAY_NAMES = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'] as const;

// 営業状態の種類を型として定義
type BusinessStatus = 'closed' | 'day-off' | 'open';

/**
 * 営業状況を表示するバッジコンポーネント
 * POIの営業状態を「閉店」「本日定休日」「営業中」のいずれかで表示します
 */
const StatusBadge: React.FC<{ poi: PointOfInterest }> = ({ poi }) => {
  // 営業状態の計算をメモ化して不要な再計算を防止
  const status = useMemo(() => {
    logger.debug('営業状態の計算を実行', { poiId: poi.id, name: poi.name });

    // 閉店している場合
    if (poi.isClosed) {
      logger.debug('POIは閉店しています', { poiId: poi.id });
      return 'closed';
    }

    // 現在の曜日が定休日かどうかチェック
    const now = new Date();
    const day = now.getDay(); // 0: 日曜, 1: 月曜, ...
    const dayName = DAY_NAMES[day];
    const dayOffKey = `${dayName}定休日` as keyof PointOfInterest;
    const isDayOff = poi[dayOffKey] === true;

    // 定休日の場合
    if (isDayOff) {
      logger.debug('今日は定休日です', { poiId: poi.id, dayName });
      return 'day-off';
    }

    // 上記以外は営業中
    logger.debug('POIは営業中です', { poiId: poi.id });
    return 'open';
  }, [poi]); // poiオブジェクトが変更された時のみ再計算

  // ステータス表示テキストとラベルのマッピング
  const statusConfig: Record<BusinessStatus, { text: string; label: string }> = {
    closed: { text: '閉店', label: '閉店しています' },
    'day-off': { text: '本日定休日', label: '本日は定休日です' },
    open: { text: '営業中', label: '現在営業中です' },
  };

  // 現在のステータスに対応する設定を取得
  const currentConfig = statusConfig[status as BusinessStatus];

  // ステータスに応じたバッジを表示
  return (
    <span className={`status-badge ${status}`} aria-label={currentConfig.label}>
      {currentConfig.text}
    </span>
  );
};

export default StatusBadge;
