/**
 * Marker.tsx
 *
 * このファイルはGoogleマップ上にマーカーを表示するためのコンポーネントを定義します。
 * GoogleマップAPIのAdvancedMarkerElementを使用して、カスタマイズ可能なマーカーを実装しています。
 * マーカーはPOI（Point of Interest）の位置に表示され、選択状態や特定エリアに応じた視覚的効果を提供します。
 */

// Reactと必要なフックをインポートします。
import React, { useEffect, useRef } from 'react';
// マーカーのスタイルを定義したCSSファイルをインポートします。
import styles from './Marker.module.css';
// 異なるタイプのマーカーに使用するアイコンURLを定義した定数をインポートします。
import { MARKER_ICONS } from '../../utils/constants';
// マーカーコンポーネントのプロパティの型定義をインポートします。
import { MarkerProps } from '../../utils/types';

/**
 * Markerコンポーネント
 *
 * このコンポーネントはGoogleマップ上にマーカーを表示し、ユーザーのインタラクションを処理します。
 * パフォーマンスを向上させるためにReact.memoでラップされており、不要な再レンダリングを防ぎます。
 *
 * @param poi - マーカーとして表示するポイントオブインタレストの情報（位置、名前、エリア等）
 * @param onClick - マーカーがクリックされた時に実行されるコールバック関数
 * @param map - マーカーを配置するGoogleマップのインスタンス
 * @param isSelected - マーカーが現在選択されているかどうかを示すブール値
 * @param zIndex - マーカーの表示レイヤーを制御するZ-index値（オプション）
 */
const Marker = React.memo(
  ({ poi, onClick, map, isSelected, zIndex }: MarkerProps & { isSelected: boolean; zIndex?: number }) => {
    // マーカーのインスタンスを参照するためのrefオブジェクトです。
    // 初期値はnullで、マーカーが作成されると実際のインスタンスが格納されます。
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

    /**
     * マーカーの初期化と破棄を管理するuseEffectフック
     *
     * このフックは以下の役割を持ちます：
     * 1. マーカーの作成と地図への追加
     * 2. アイコンのスタイル設定
     * 3. クリックイベントの設定
     * 4. エリアタイプに応じた特別なスタイルの適用
     * 5. コンポーネントのアンマウント時のクリーンアップ
     *
     * 依存配列が変更されると（例：マップが変わる、POIデータが変わる）、
     * マーカーを再作成して最新の状態を反映します。
     */
    useEffect(() => {
      // マップまたはGoogle Maps APIが利用できない場合は何もしません（早期リターン）
      if (!map || !window.google?.maps) return;

      // POIのエリアタイプに基づいて適切なアイコンURLを取得します
      // 指定されたエリアタイプのアイコンがない場合はデフォルトアイコンを使用します
      const iconUrl = MARKER_ICONS[poi.area] || MARKER_ICONS.DEFAULT;

      // マーカーとして表示するカスタムHTML要素を作成します
      const iconElement = document.createElement('div');
      // アイコン画像を背景として設定します
      iconElement.style.backgroundImage = `url(${iconUrl})`;
      // 画像がコンテナに収まるように背景サイズを調整します
      iconElement.style.backgroundSize = 'contain';
      // アイコンの幅を設定します
      iconElement.style.width = '36px';
      // アイコンの高さを設定します
      iconElement.style.height = '36px';
      // アクセシビリティ対応：タブ移動可能にし、キーボードフォーカスを受け取れるようにします
      iconElement.setAttribute('tabindex', '0');
      iconElement.classList.add(styles.markerContent);

      // Google Maps AdvancedMarkerElementを使用してマーカーを作成します
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: poi.location, // マーカーを表示する地理座標
        map, // マーカーを表示するマップインスタンス
        title: poi.name, // マウスホバー時に表示されるツールチップテキスト
        content: iconElement, // マーカーとして表示するカスタム要素
        zIndex, // マーカー同士が重なった際の表示優先度
      });

      // マーカーがクリックされた時のイベントハンドラを定義します
      const handleClick = () => {
        // 親コンポーネントから渡されたコールバック関数を呼び出し、クリックされたPOIを通知します
        onClick(poi);
      };

      // マーカーにクリックイベントのリスナーを追加します
      // clickイベントからgmp-clickイベントに変更
      marker.addListener('gmp-click', handleClick);

      // iconElementに直接gmp-clickイベントリスナーを追加
      iconElement.addEventListener('gmp-click', () => {
        handleClick();
      });

      // キーボードアクセシビリティ：Enterキー押下時のイベントを追加
      iconElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      });

      // 作成したマーカーインスタンスをrefに保存して、後で参照できるようにします
      markerRef.current = marker;

      // POIのエリアタイプに基づいて、特別なスタイルやアニメーションを適用します
      if (poi.area === 'RECOMMEND') {
        // 推奨エリアのマーカーには特別な外観と点滅アニメーションを適用します
        iconElement.classList.add(styles.markerRecommendation);
        iconElement.classList.add(styles.markerBlinking);
      } else if (poi.area === 'CURRENT_LOCATION') {
        // 現在位置のマーカーには点滅アニメーションのみを適用します
        iconElement.classList.add(styles.markerBlinking);
      }

      // コンポーネントがアンマウントされる時や依存関係が変更された時の
      // クリーンアップ関数を返します
      return () => {
        if (markerRef.current) {
          // マーカーに関連するすべてのイベントリスナーを削除します
          google.maps.event.clearInstanceListeners(markerRef.current);
          // マーカーをマップから削除します
          markerRef.current.map = null;
          // マーカーの参照をクリアします
          markerRef.current = null;
        }
      };
    }, [map, poi, onClick, zIndex]); // これらの値が変更された場合にマーカーを再作成します

    /**
     * マーカーの選択状態を管理するuseEffectフック
     *
     * このフックはisSelectedプロパティの変更を監視し、
     * マーカーが選択されているかどうかに応じてスタイルを適用または削除します。
     *
     * 依存配列にはisSelectedとpoiが含まれており、
     * これらが変更された時にマーカーの視覚的な選択状態を更新します。
     */
    useEffect(() => {
      // マーカーが存在し、そのコンテンツがHTML要素である場合にのみ処理を行います
      if (markerRef.current && markerRef.current.content instanceof HTMLElement) {
        if (isSelected) {
          // マーカーが選択されている場合、選択状態を示すCSSクラスを追加します
          markerRef.current.content.classList.add(styles.markerSelected);
          // アクセシビリティ：選択状態をARIA属性でも表現
          markerRef.current.content.setAttribute('aria-selected', 'true');
        } else {
          // マーカーが選択されていない場合、選択状態を示すCSSクラスを削除します
          markerRef.current.content.classList.remove(styles.markerSelected);
          // アクセシビリティ：選択解除状態をARIA属性で表現
          markerRef.current.content.setAttribute('aria-selected', 'false');
        }
      }
    }, [isSelected, poi]); // 選択状態またはPOI自体が変更された場合に実行します

    // このコンポーネントは直接何もレンダリングしません
    // 代わりに、Google Maps APIを通じてマップ上にマーカーを表示します
    return null;
  },
);

// Reactデバッグツール上でコンポーネントを識別しやすくするために表示名を設定します
Marker.displayName = 'Marker';

// Markerコンポーネントを名前付きエクスポートとデフォルトエクスポートの両方でエクスポートします
export { Marker };
export default Marker;
