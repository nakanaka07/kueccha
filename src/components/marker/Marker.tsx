import React, { useEffect, useRef } from 'react'; // Reactと必要なフックをインポート
import type { MarkerProps } from '../../utils/types'; // MarkerProps型をインポート
import { MARKER_COLORS } from '../../utils/constants'; // マーカーの色定数をインポート
import './Marker.css'; // スタイルシートをインポート

// マーカーアイコンのパスを定義
const markerIcons: Record<string, string> = {
  RECOMMEND: '/path/to/recommend-icon.png',
  RYOTSU_AIKAWA: '/path/to/ryotsu-aikawa-icon.png',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '/path/to/kanai-sawada-icon.png',
  AKADOMARI_HAMOCHI_OGI: '/path/to/akadomari-hamochi-icon.png',
  SNACK: '/path/to/snack-icon.png',
  PUBLIC_TOILET: '/path/to/public-toilet-icon.png',
  PARKING: '/path/to/parking-icon.png',
  DEFAULT: '/path/to/default-icon.png',
};

// Markerコンポーネントを定義
const Marker = React.memo(
  ({
    poi,
    onClick,
    map,
    isSelected,
  }: MarkerProps & { isSelected: boolean }) => {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
      null,
    ); // マーカーの参照を保持するためのref

    useEffect(() => {
      if (!map || !window.google?.maps) return; // マップまたはGoogle Maps APIが存在しない場合は何もしない

      const iconUrl = markerIcons[poi.area] || markerIcons.DEFAULT; // アイコンのURLを取得

      const iconElement = document.createElement('div'); // アイコン要素を作成
      iconElement.style.backgroundImage = `url(${iconUrl})`; // 背景画像を設定
      iconElement.style.backgroundSize = 'contain'; // 背景画像のサイズをcontainに設定
      iconElement.style.width = '32px'; // 幅を32pxに設定
      iconElement.style.height = '32px'; // 高さを32pxに設定

      const pin = new google.maps.marker.PinElement({
        glyph: '', // グリフを設定
        background:
          MARKER_COLORS[poi.area as keyof typeof MARKER_COLORS] ||
          MARKER_COLORS.DEFAULT, // 背景色を設定
        borderColor: '#ffffff', // 枠線の色を設定
        scale: 1.0, // スケールを設定
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: poi.location, // 位置を設定
        map, // マップを設定
        title: poi.name, // タイトルを設定
        content: pin.element, // コンテンツを設定
        zIndex: poi.area === 'RECOMMEND' ? 1000 : 1, // z-indexを設定
      });

      marker.addListener('click', () => onClick(poi)); // クリックイベントリスナーを追加
      markerRef.current = marker; // マーカーをrefに設定

      if (poi.area === 'RECOMMEND' && marker.content instanceof HTMLElement) {
        marker.content.classList.add('blinking'); // おすすめエリアの場合は点滅クラスを追加
      }

      return () => {
        if (markerRef.current) {
          markerRef.current.map = null; // マーカーをマップから削除
          google.maps.event.clearInstanceListeners(markerRef.current); // イベントリスナーをクリア
        }
      };
    }, [map, poi, onClick]); // map, poi, onClickが変更されたときに実行

    useEffect(() => {
      if (
        markerRef.current &&
        markerRef.current.content instanceof HTMLElement
      ) {
        if (isSelected) {
          markerRef.current.content.classList.add('selected-marker'); // 選択された場合は選択クラスを追加
        } else {
          markerRef.current.content.classList.remove('selected-marker'); // 選択されていない場合は選択クラスを削除
        }
      }
    }, [isSelected]); // isSelectedが変更されたときに実行

    return null; // コンポーネントは何もレンダリングしない
  },
);

Marker.displayName = 'Marker'; // コンポーネントの表示名を設定

export { Marker }; // Markerコンポーネントをエクスポート
export default Marker; // デフォルトエクスポート
