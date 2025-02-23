// Reactと必要なフックをインポートします。
// useEffect: 副作用を処理するために使用します。
// useRef: DOM要素やインスタンスを参照するために使用します。
import React, { useEffect, useRef } from 'react';
// CSSファイルをインポートします。スタイルを適用するために使用します。
import './Marker.css';
// 定数をインポートします。
// MARKER_ICONS: マーカーのアイコンURLを定義した定数です。
import { MARKER_ICONS } from '../../utils/constants';
// 型定義をインポートします。
// MarkerProps: Markerコンポーネントのプロパティの型を定義します。
import { MarkerProps } from '../../utils/types';

// Markerコンポーネントを定義します。
// poi: ポイントオブインタレストの情報を含むオブジェクトです。
// onClick: マーカーがクリックされたときに呼び出されるコールバック関数です。
// map: Googleマップのインスタンスです。
// isSelected: マーカーが選択されているかどうかを示すブール値です。
// zIndex: マーカーのZインデックスを指定するオプションのプロパティです。
const Marker = React.memo(
  ({ poi, onClick, map, isSelected, zIndex }: MarkerProps & { isSelected: boolean; zIndex?: number }) => {
    // マーカーの参照を保持するためのuseRefフックです。
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

    // マーカーの初期化とクリーンアップを行うuseEffectフックです。
    useEffect(() => {
      // マップまたはGoogleマップのオブジェクトが存在しない場合は何もしません。
      if (!map || !window.google?.maps) return;

      // マーカーのアイコンURLを取得します。
      const iconUrl = MARKER_ICONS[poi.area] || MARKER_ICONS.DEFAULT;

      // アイコン要素を作成します。
      const iconElement = document.createElement('div');
      iconElement.style.backgroundImage = `url(${iconUrl})`;
      iconElement.style.backgroundSize = 'contain';
      iconElement.style.width = '40px';
      iconElement.style.height = '40px';

      // マーカーを作成し、マップに追加します。
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: poi.location,
        map,
        title: poi.name,
        content: iconElement,
        zIndex,
      });

      // マーカーがクリックされたときに呼び出される関数を定義します。
      const handleClick = () => {
        console.log('Marker clicked:', poi); // ログ出力を追加
        onClick(poi); // 親コンポーネントから渡されたonClickコールバックを呼び出します。
      };

      // マーカーにクリックイベントリスナーを追加します。
      marker.addListener('click', handleClick);
      // マーカーの参照を更新します。
      markerRef.current = marker;

      console.log('Marker added:', poi); // ログ出力を追加

      // 特定のエリアに応じてアイコン要素にクラスを追加します。
      if (poi.area === 'RECOMMEND') {
        iconElement.classList.add('marker-recommendation');
        iconElement.classList.add('marker-blinking');
      } else if (poi.area === 'CURRENT_LOCATION') {
        iconElement.classList.add('marker-blinking');
      }

      // クリーンアップ関数を返します。
      return () => {
        if (markerRef.current) {
          // マーカーのイベントリスナーをクリアし、マップから削除します。
          google.maps.event.clearInstanceListeners(markerRef.current);
          markerRef.current.map = null;
          markerRef.current = null;
          console.log('Marker removed:', poi); // ログ出力を追加
        }
      };
    }, [map, poi, onClick, zIndex]); // 依存関係が変更された場合にのみこの副作用を再実行します。

    // マーカーの選択状態を管理するuseEffectフックです。
    useEffect(() => {
      if (markerRef.current && markerRef.current.content instanceof HTMLElement) {
        if (isSelected) {
          // マーカーが選択された場合、選択クラスを追加します。
          markerRef.current.content.classList.add('marker-selected');
          console.log('Marker selected:', poi); // ログ出力を追加
        } else {
          // マーカーが選択解除された場合、選択クラスを削除します。
          markerRef.current.content.classList.remove('marker-selected');
          console.log('Marker deselected:', poi); // ログ出力を追加
        }
      }
    }, [isSelected, poi]); // isSelectedとpoiが変更された場合にのみこの副作用を再実行します。

    // このコンポーネントはDOMに何もレンダリングしません。
    return null;
  },
);

// コンポーネントの表示名を設定します。
Marker.displayName = 'Marker';

// Markerコンポーネントをエクスポートします。
export { Marker };
export default Marker;
