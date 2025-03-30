import React, { useState, useCallback, useMemo } from 'react';

import { POIFooter } from '@/components/POIFooter';
import { POIHeader } from '@/components/POIHeader';
import { InfoTabContent, HoursTabContent, MapTabContent } from '@/components/POITabContents';
import { PointOfInterest } from '@/types/poi';
import { logger } from '@/utils/logger';
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
 * タブナビゲーションコンポーネント
 */
const TabNavigation: React.FC<{
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}> = React.memo(({ activeTab, setActiveTab }) => {
  // ログ出力
  logger.debug('TabNavigationをレンダリング', { activeTab });

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
  const [activeTab, setActiveTab] = useState<TabType>('info');

  // コールバックの安定化
  const handleTabChange = useCallback(
    (tab: TabType) => {
      logger.info('タブ切り替え', {
        from: activeTab,
        to: tab,
        poiId: poi.id,
        poiName: poi.name,
      });
      setActiveTab(tab);
    },
    [activeTab, poi.id, poi.name]
  );

  // 現在のタブコンテンツをメモ化
  const activeTabContent = useMemo(() => {
    switch (activeTab) {
      case 'info':
        return <InfoTabContent poi={poi} />;
      case 'hours':
        return <HoursTabContent poi={poi} />;
      case 'map':
        return <MapTabContent poi={poi} />;
      default:
        return null;
    }
  }, [activeTab, poi]);

  logger.debug('POIDetails レンダリング', {
    poiId: poi.id,
    activeTab,
  });

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
