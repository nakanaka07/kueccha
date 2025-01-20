import React, { useEffect, useRef } from 'react'; // Reactとフックをインポート
import type { MarkerProps } from '../../utils/types'; // MarkerProps型をインポート
import { MARKER_COLORS } from '../../utils/constants'; // マーカーの色定数をインポート
import './Marker.css'; // スタイルをインポート

const markerIcons: Record<string, string> = {
  RECOMMEND: '/path/to/recommend-icon.png',
  RYOTSU_AIKAWA: '/path/to/ryotsu-aikawa-icon.png',
  KANAI_SAWADA_NIIBO_HATANO_MANO: '/path/to/kanai-sawada-icon.png',
  AKADOMARI_HAMOCHI_OGI: '/path/to/akadomari-hamochi-icon.png',
  SNACK: '/path/to/snack-icon.png',
  PUBLIC_TOILET: '/path/to/public-toilet-icon.png',
  PARKING: '/path/to/parking-icon.png',
  DEFAULT: '/path/to/default-icon.png',
}; // マーカーアイコンのパスを定義

const Marker = React.memo(({ poi, onClick, map }: MarkerProps) => {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  ); // マーカーの参照を作成

  useEffect(() => {
    if (!map || !window.google?.maps) return; // マップまたはGoogle Mapsが存在しない場合は何もしない

    const iconUrl = markerIcons[poi.area] || markerIcons.DEFAULT; // アイコンのURLを取得

    const iconElement = document.createElement('div'); // アイコン要素を作成
    iconElement.style.backgroundImage = `url(${iconUrl})`; // 背景画像を設定
    iconElement.style.backgroundSize = 'contain'; // 背景サイズを設定
    iconElement.style.width = '32px'; // 幅を設定
    iconElement.style.height = '32px'; // 高さを設定

    const pin = new google.maps.marker.PinElement({
      glyph: '',
      background:
        MARKER_COLORS[poi.area as keyof typeof MARKER_COLORS] ||
        MARKER_COLORS.DEFAULT,
      borderColor: '#ffffff',
      scale: 1.0,
    }); // ピン要素を作成

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: poi.location,
      map,
      title: poi.name,
      content: pin.element,
      zIndex: poi.area === 'RECOMMEND' ? 1000 : 1,
    }); // マーカー要素を作成

    marker.addListener('click', () => onClick(poi)); // マーカークリック時のリスナーを追加
    markerRef.current = marker; // マーカーの参照を設定

    if (poi.area === 'RECOMMEND' && marker.content instanceof HTMLElement) {
      marker.content.classList.add('blinking'); // 推奨エリアの場合は点滅アニメーションを追加
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null; // マーカーをマップから削除
        google.maps.event.clearInstanceListeners(markerRef.current); // イベントリスナーをクリア
      }
    };
  }, [map, poi, onClick]); // マップ、POI、クリックハンドラが変更されたときに実行

  useEffect(() => {
    if (
      poi.area === 'RECOMMEND' &&
      markerRef.current &&
      markerRef.current.content instanceof HTMLElement
    ) {
      markerRef.current.content.classList.add('blinking'); // 推奨エリアの場合は点滅アニメーションを追加
    }
  }, [poi]); // POIが変更されたときに実行

  return null; // マーカーコンポーネントは何もレンダリングしない
});

Marker.displayName = 'Marker'; // コンポーネントの表示名を設定

export { Marker };
export default Marker;
