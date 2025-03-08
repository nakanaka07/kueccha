/*
 * 機能: マップ読み込み中に表示されるローディングコンポーネント
 * 依存関係:
 *   - React
 *   - Map.module.css（スタイル定義）
 * 注意点:
 *   - アクセシビリティ対応済み（aria-label, role, aria-busy属性）
 *   - スタイルはMap.module.cssに依存
 *   - シンプルなテキストベースのローディング表示
 */

import React from 'react';
import styles from './Map.module.css';

const LOADING_ARIA_LABEL = '地図読み込み中';

const MapLoading: React.FC = () => {
  return (
    <div className={styles.loadingContainer} aria-label={LOADING_ARIA_LABEL} role="progressbar" aria-busy="true">
      マップを読み込み中...
    </div>
  );
};

export default MapLoading;
