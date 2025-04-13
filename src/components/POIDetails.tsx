import React, { useState, useCallback, useMemo } from 'react';

import { POIFooter } from '@/components/POIFooter';
import { POIHeader } from '@/components/POIHeader';
import { InfoTabContent, HoursTabContent, MapTabContent } from '@/components/POITabContents';
import type { PointOfInterest } from '@/types/poi';
import { ENV } from '@/utils/env';
import { logger, LogLevel } from '@/utils/logger';
import '@/global.css';

/**
 * 利用可能なタブの種類
 */
export type TabType = 'info' | 'hours' | 'map';

/**
 * タブ定義
 */
interface TabDefinition {
  id: TabType;
  label: string;
  ariaLabel: string;
}

/**
 * 使用可能なタブ定義
 */
const TABS: TabDefinition[] = [
  { id: 'info', label: '基本情報', ariaLabel: 'POIの基本情報を表示' },
  { id: 'hours', label: '営業時間', ariaLabel: '営業時間と休業日情報を表示' },
  { id: 'map', label: '地図', ariaLabel: 'POIの位置を地図で表示' },
];

// 環境変数から取得したパフォーマンス設定
const LOG_CONFIG = {
  // 環境に応じたログレベル設定
  RENDER_LOG_LEVEL: ENV.env.isDev ? LogLevel.DEBUG : LogLevel.INFO,
  // サンプリングレート (prod環境では20回に1回、開発環境では5回に1回ログを出力)
  SAMPLING_RATE: ENV.env.isProd ? 20 : 5,
};

interface POIDetailsProps {
  /**
   * 表示対象のPOI情報
   */
  poi: PointOfInterest;

  /**
   * 詳細画面を閉じるときのコールバック
   */
  onClose: () => void;
}

/**
 * タブ関連のロジックを分離したカスタムフック
 */
function useTabNavigation(poiId: string, poiName: string) {
  const [activeTab, setActiveTab] = useState<TabType>('info');

  const handleTabChange = useCallback(
    (tab: TabType) => {
      const startTime = performance.now();

      // タブ変更を適用
      setActiveTab(tab);

      // タブ切り替えのパフォーマンスとコンテキスト情報を記録
      const durationMs = performance.now() - startTime;
      logger.info('タブ切り替え', {
        component: 'POIDetails',
        action: 'tab_change',
        entityId: poiId,
        from: activeTab,
        to: tab,
        poiName,
        durationMs,
        status: 'success',
      });
    },
    [activeTab, poiId, poiName]
  );

  return { activeTab, handleTabChange };
}

/**
 * タブナビゲーションコンポーネント
 */
const TabNavigation: React.FC<{
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}> = React.memo(({ activeTab, setActiveTab }) => {
  // サンプリングレートを適用してログ出力（高頻度レンダリングの負荷を軽減）
  if (Math.random() < 1 / LOG_CONFIG.SAMPLING_RATE) {
    // logger.log の代わりにログレベルに応じた適切なメソッドを使用
    if (LOG_CONFIG.RENDER_LOG_LEVEL === LogLevel.DEBUG) {
      logger.debug('TabNavigation レンダリング', {
        component: 'TabNavigation',
        action: 'render',
        activeTab,
      });
    } else {
      logger.info('TabNavigation レンダリング', {
        component: 'TabNavigation',
        action: 'render',
        activeTab,
      });
    }
  }

  return (
    <nav className='poi-tabs' role='tablist' aria-label='POI情報タブ'>
      {TABS.map(tab => (
        <button
          key={tab.id}
          type='button'
          role='tab'
          id={`tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          aria-label={tab.ariaLabel}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
});

TabNavigation.displayName = 'TabNavigation';

/**
 * POI詳細情報表示コンポーネント
 * 選択されたPOIの詳細情報を表示します
 */
const POIDetails: React.FC<POIDetailsProps> = ({ poi, onClose }) => {
  // カスタムフックを使用してタブ関連のロジックを分離
  const { activeTab, handleTabChange } = useTabNavigation(poi.id, poi.name);

  // 現在のタブコンテンツをメモ化
  const activeTabContent = useMemo(() => {
    const startTime = performance.now();

    let content;
    switch (activeTab) {
      case 'info':
        content = <InfoTabContent poi={poi} />;
        break;
      case 'hours':
        content = <HoursTabContent poi={poi} />;
        break;
      case 'map':
        content = <MapTabContent poi={poi} />;
        break;
      default:
        content = null;
    }

    const durationMs = performance.now() - startTime;
    // コンテンツ生成に時間がかかった場合のみログ出力（パフォーマンス監視）
    if (durationMs > 50) {
      logger.warn('タブコンテンツ生成に時間がかかりました', {
        component: 'POIDetails',
        action: 'generate_tab_content',
        entityId: poi.id,
        tab: activeTab,
        durationMs,
      });
    }

    return content;
  }, [activeTab, poi]);

  // サンプリングレートを適用してログ出力（高頻度レンダリングの負荷を軽減）
  if (Math.random() < 1 / LOG_CONFIG.SAMPLING_RATE) {
    // logger.log の代わりにログレベルに応じた適切なメソッドを使用
    if (LOG_CONFIG.RENDER_LOG_LEVEL === LogLevel.DEBUG) {
      logger.debug('POIDetails レンダリング', {
        component: 'POIDetails',
        action: 'render',
        entityId: poi.id,
        activeTab,
      });
    } else {
      logger.info('POIDetails レンダリング', {
        component: 'POIDetails',
        action: 'render',
        entityId: poi.id,
        activeTab,
      });
    }
  }

  return (
    <div
      className='poi-details-container'
      role='dialog'
      aria-labelledby='poi-title'
      aria-describedby='poi-description'
    >
      <POIHeader poi={poi} onClose={onClose} />
      <TabNavigation activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* タブコンテンツ */}
      <div
        role='tabpanel'
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className='tab-content'
      >
        {activeTabContent}
      </div>

      <POIFooter poi={poi} />
    </div>
  );
};

export default React.memo(POIDetails);
