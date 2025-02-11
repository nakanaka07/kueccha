// Reactと必要なフックをインポート
import React, { useEffect, useRef } from 'react';
// MarkerProps型とPoi型をインポート
import type { MarkerProps, Poi } from '../../utils/types';
// スタイルシートをインポート
import './Marker.css';
// 各種アイコン画像をインポート
import recommendIcon from '../../utils/images/ano_icon_recommend.png';
import ryotsuAikawaIcon from '../../utils/images/icon_map01.png';
import kanaiSawadaNiiboHatanoManoIcon from '../../utils/images/icon_map02.png';
import akadomariHamochiOgiIcon from '../../utils/images/icon_map03.png';
import snackIcon from '../../utils/images/shi_icon02.png';
import publicToiletIcon from '../../utils/images/ano_icon01.png';
import parkingIcon from '../../utils/images/shi_icon01.png';
import currentLocationIcon from '../../utils/images/shi_icon04.png';
import defaultIcon from '../../utils/images/row2.png';

// 各エリアに対応するアイコンのマッピングを定義
const markerIcons: Record<string, string> = {
  RECOMMEND: recommendIcon,
  RYOTSU_AIKAWA: ryotsuAikawaIcon,
  KANAI_SAWADA_NIIBO_HATANO_MANO: kanaiSawadaNiiboHatanoManoIcon,
  AKADOMARI_HAMOCHI_OGI: akadomariHamochiOgiIcon,
  SNACK: snackIcon,
  PUBLIC_TOILET: publicToiletIcon,
  PARKING: parkingIcon,
  CURRENT_LOCATION: currentLocationIcon,
  DEFAULT: defaultIcon,
};

// Markerコンポーネントを定義し、React.memoでメモ化
const Marker = React.memo(
  ({
    poi, // POI情報
    onClick, // クリック時のハンドラー
    map, // マップインスタンス
    isSelected, // 選択状態
  }: MarkerProps & { isSelected: boolean }) => {
    // マーカーの参照を保持するためのuseRefフック
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
      null,
    );

    // マーカーの初期化とクリーンアップを行うuseEffectフック
    useEffect(() => {
      // マップが存在しない場合は何もしない
      if (!map || !window.google?.maps) return;

      // POIエリアに対応するアイコンURLを取得
      const iconUrl = markerIcons[poi.area] || markerIcons.DEFAULT;

      // アイコン要素を作成
      const iconElement = document.createElement('div');
      iconElement.style.backgroundImage = `url(${iconUrl})`;
      iconElement.style.backgroundSize = 'contain';
      iconElement.style.width = '32px';
      iconElement.style.height = '32px';

      // マーカーを作成
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: poi.location, // マーカーの位置
        map, // マップインスタンス
        title: poi.name, // マーカーのタイトル
        content: iconElement, // マーカーのコンテンツ
        zIndex: poi.area === 'CURRENT_LOCATION' ? 2000 : 1, // Zインデックス
      });

      // マーカーのクリックイベントを設定
      marker.addListener('click', () => onClick(poi));
      // マーカーの参照を保持
      markerRef.current = marker;

      // 特定のエリアの場合はアイコンを点滅させる
      if (poi.area === 'RECOMMEND' || poi.area === 'CURRENT_LOCATION') {
        iconElement.classList.add('blinking');
      }

      // クリーンアップ関数を返す
      return () => {
        if (markerRef.current) {
          markerRef.current.map = null; // マーカーをマップから削除
          google.maps.event.clearInstanceListeners(markerRef.current); // イベントリスナーをクリア
        }
      };
    }, [map, poi, onClick]);

    // マーカーの選択状態を監視し、クラスを追加/削除するuseEffectフック
    useEffect(() => {
      if (
        markerRef.current &&
        markerRef.current.content instanceof HTMLElement
      ) {
        if (isSelected) {
          markerRef.current.content.classList.add('selected-marker');
          // handleResultClickを呼び出す
          handleResultClick(poi);
        } else {
          markerRef.current.content.classList.remove('selected-marker');
        }
      }
    }, [isSelected]);

    // handleResultClick関数を定義
    const handleResultClick = (poi: Poi) => {
      onClick(poi);
    };

    // このコンポーネントはDOMに何もレンダリングしない
    return null;
  },
);

// コンポーネントの表示名を設定
Marker.displayName = 'Marker';

// Markerコンポーネントをエクスポート
export { Marker };
export default Marker;
