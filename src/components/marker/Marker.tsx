import React, { useEffect, useRef } from 'react'; // Reactと必要なフックをインポート
import type { MarkerProps } from '../../utils/types'; // 型定義をインポート
import './Marker.css'; // スタイルシートをインポート

import recommendIcon from '../../utils/images/ano_icon03.png'; // おすすめエリアのアイコンをインポート
import ryotsuAikawaIcon from '../../utils/images/shi_icon03.png'; // 両津・相川地区のアイコンをインポート
import kanaiSawadaNiiboHatanoManoIcon from '../../utils/images/shi_icon03.png'; // 金井・佐和田・新穂・畑野・真野地区のアイコンをインポート
import akadomariHamochiOgiIcon from '../../utils/images/shi_icon03.png'; // 赤泊・羽茂・小木地区のアイコンをインポート
import snackIcon from '../../utils/images/shi_icon02.png'; // スナックのアイコンをインポート
import publicToiletIcon from '../../utils/images/ano_icon01.png'; // 公共トイレのアイコンをインポート
import parkingIcon from '../../utils/images/shi_icon01.png'; // 駐車場のアイコンをインポート
import currentLocationIcon from '../../utils/images/shi_icon04.png'; // 現在地のアイコンをインポート
import defaultIcon from '../../utils/images/row2.png'; // デフォルトのアイコンをインポート

// マーカーアイコンのパスを定義
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

const Marker = React.memo(
  ({
    poi,
    onClick,
    map,
    isSelected,
  }: MarkerProps & { isSelected: boolean }) => {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
      null,
    );

    useEffect(() => {
      if (!map || !window.google?.maps) return; // マップまたはGoogle Mapsが利用できない場合は何もしない

      const iconUrl = markerIcons[poi.area] || markerIcons.DEFAULT; // アイコンURLを取得

      // カスタムアイコンを設定
      const iconElement = document.createElement('div');
      iconElement.style.backgroundImage = `url(${iconUrl})`;
      iconElement.style.backgroundSize = 'contain';
      iconElement.style.width = '32px';
      iconElement.style.height = '32px';

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: poi.location, // マーカーの位置を設定
        map, // マップを設定
        title: poi.name, // マーカーのタイトルを設定
        content: iconElement, // マーカーのコンテンツを設定
        zIndex:
          poi.area === 'CURRENT_LOCATION'
            ? 2000
            : poi.area === 'RECOMMEND'
              ? 1000
              : 1, // zIndexを設定
      });

      marker.addListener('click', () => onClick(poi)); // クリックイベントを設定
      markerRef.current = marker;

      // 'RECOMMEND' または 'CURRENT_LOCATION' の場合に 'blinking' クラスを追加
      if (poi.area === 'RECOMMEND' || poi.area === 'CURRENT_LOCATION') {
        iconElement.classList.add('blinking');
      }

      return () => {
        if (markerRef.current) {
          markerRef.current.map = null; // マーカーをマップから削除
          google.maps.event.clearInstanceListeners(markerRef.current); // イベントリスナーをクリア
        }
      };
    }, [map, poi, onClick]);

    useEffect(() => {
      if (
        markerRef.current &&
        markerRef.current.content instanceof HTMLElement
      ) {
        if (isSelected) {
          markerRef.current.content.classList.add('selected-marker'); // 選択されたマーカーにクラスを追加
        } else {
          markerRef.current.content.classList.remove('selected-marker'); // 選択が解除されたマーカーからクラスを削除
        }
      }
    }, [isSelected]);

    return null; // マーカーはDOMに直接レンダリングされないため、nullを返す
  },
);

Marker.displayName = 'Marker'; // コンポーネントの表示名を設定

export { Marker };
export default Marker;
