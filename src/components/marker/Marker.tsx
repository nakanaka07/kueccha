/**
 * @fileoverview Googleマップ上にカスタマイズ可能なPOIマーカーを表示するコンポーネント
 *
 * @module Marker
 *
 * @description
 * このコンポーネントは、Googleマップ上に様々なポイント（POI: Point of Interest）を
 * 視覚的に表示するためのカスタムマーカーを実装します。地図上の位置を示すだけでなく、
 * マーカーの選択状態やエリアタイプに応じて異なる視覚効果を適用します。
 *
 * GoogleマップのAdvancedMarkerElement APIを活用し、高度なカスタマイズと
 * パフォーマンスの最適化を実現しています。また、キーボード操作を含むアクセシビリティにも
 * 対応しており、様々なユーザーにとって使いやすいインターフェースを提供します。
 *
 * @usage
 * このコンポーネントは以下のような状況で使用します：
 * - 地図上に様々な種類のPOI（観光スポット、店舗、施設など）を表示する場合
 * - 現在地や推奨スポットなど、特別な場所を視覚的に強調したい場合
 * - ユーザーが地図上の場所を選択できる対話的なインターフェースが必要な場合
 * - 異なるカテゴリの場所を視覚的に区別して表示したい場合
 *
 * @features
 * - 異なるエリアタイプごとに異なるアイコン表示
 * - 選択状態の視覚的なフィードバック
 * - 特定エリア（推奨エリア、現在地など）に対するアニメーション効果
 * - キーボードナビゲーションとスクリーンリーダー対応
 * - React.memoによるレンダリングパフォーマンスの最適化
 * - マーカーの表示レイヤー制御（zIndex）
 *
 * @props
 * poi - マーカーとして表示するPOIの情報（位置座標、名前、エリアタイプなど）を含むオブジェクト
 * onClick - マーカーがクリックされた際に実行されるコールバック関数（選択されたPOIを引数として受け取る）
 * map - マーカーを配置するGoogleマップのインスタンス
 * isSelected - マーカーが現在選択されているかどうかを示すブール値
 * zIndex - （オプション）マーカーの表示レイヤーを制御する数値（値が大きいほど前面に表示）
 *
 * @example
 * // 基本的な使用例
 * <Marker
 *   poi={poiData}
 *   map={googleMapRef.current}
 *   onClick={handleMarkerClick}
 *   isSelected={selectedPoi?.id === poiData.id}
 * />
 *
 * @example
 * // 特別なエリアタイプと表示優先度を指定した例
 * <Marker
 *   poi={{
 *     id: 'spot-123',
 *     name: '東京タワー',
 *     location: { lat: 35.6586, lng: 139.7454 },
 *     area: 'RECOMMEND'
 *   }}
 *   map={googleMapRef.current}
 *   onClick={handleMarkerClick}
 *   isSelected={false}
 *   zIndex={100} // 他のマーカーよりも前面に表示
 * />
 *
 * @bestPractices
 * - 多数のマーカーを表示する場合は、表示範囲内のマーカーのみをレンダリングするよう最適化を検討する
 * - マーカーの選択状態は親コンポーネントで一元管理し、isSelectedプロパティで伝達する
 * - アプリケーションの用途に合わせてMARKER_ICONSを拡張・カスタマイズする
 * - 複雑なマーカーの見た目が必要な場合は、SVGやHTMLを活用したカスタムコンテンツを検討する
 *
 * @relatedComponents
 * - MapContainer - Googleマップを表示し、マーカーを含む各種要素を配置するコンテナ
 * - InfoWindow - マーカークリック時に表示される追加情報ウィンドウ
 * - MarkerClusterer - 多数のマーカーを表示する際のクラスタリング処理
 * - AreaFilter - エリアタイプに基づいてマーカーをフィルタリングする機能
 *
 * @dependencies
 * - Google Maps JavaScript API v3（特にAdvancedMarker機能）
 * - MARKER_ICONS定数（アイコンURLを定義）
 * - CSSモジュール（マーカーのスタイリング）
 */

/**
 * Marker.tsx
 *
 * このファイルはGoogleマップ上にマーカーを表示するためのコンポーネントを定義します。
 * GoogleマップAPIのAdvancedMarkerElementを使用して、カスタマイズ可能なマーカーを実装しています。
 * マーカーはPOI（Point of Interest）の位置に表示され、選択状態や特定エリアに応じた視覚的効果を提供します。
 */

// Reactと必要なフックをインポートします。
import React, { useEffect, useRef, useCallback } from 'react';
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
    // AdvancedMarkerElementはDOMに直接関わるため、Reactのライフサイクル外で管理する必要があります。
    // このrefを使用することで、コンポーネントの再レンダリング間でマーカーインスタンスを保持できます。
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

    // マーカー作成処理を最適化
    const createMarkerElement = useCallback((iconUrl: string) => {
      const element = document.createElement('div');
      element.style.backgroundImage = `url(${iconUrl})`;
      element.style.backgroundSize = 'contain';
      element.style.width = '36px';
      element.style.height = '36px';
      element.setAttribute('tabindex', '0');
      element.classList.add(styles.markerContent);
      return element;
    }, []);

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
      // マップまたはGoogle Maps APIが利用できない場合は何もしません
      if (!map || !window.google?.maps) return;

      try {
        // マーカーの再作成を避けて既存のマーカーを更新する
        if (markerRef.current) {
          // 既存マーカーの位置のみ更新
          markerRef.current.position = poi.location;
          return;
        }

        const iconUrl = MARKER_ICONS[poi.area] || MARKER_ICONS.DEFAULT;
        const iconElement = createMarkerElement(iconUrl);

        // マーカーの作成
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: poi.location,
          map,
          title: poi.name,
          content: iconElement,
          zIndex,
        });

        markerRef.current = marker;

        // POIのエリアタイプに基づくスタイル適用
        if (poi.area === 'RECOMMEND') {
          iconElement.classList.add(styles.markerRecommendation);
          iconElement.classList.add(styles.markerBlinking);
        } else if (poi.area === 'CURRENT_LOCATION') {
          iconElement.classList.add(styles.markerBlinking);
          iconElement.setAttribute('aria-label', '現在地');
        }

        // クリーンアップ関数
        return () => {
          if (markerRef.current) {
            google.maps.event.clearInstanceListeners(markerRef.current);
            markerRef.current.map = null;
            markerRef.current = null;
          }
        };
      } catch (error) {
        console.error('マーカー作成中にエラーが発生しました:', error);
      }
    }, [map, poi.location, poi.area, zIndex, createMarkerElement]);

    // イベントリスナーを別のuseEffectで管理
    useEffect(() => {
      if (!markerRef.current || !window.google?.maps) return;

      try {
        // クリックハンドラを定義（クロージャ内でpoiを参照するが依存配列には含めない）
        const handleClick = () => onClick(poi);

        // クリアな参照を持つキーボードイベントハンドラ
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        };

        // 既存のリスナーをクリア
        google.maps.event.clearInstanceListeners(markerRef.current);

        // クリックイベントの追加
        markerRef.current.addListener('gmp-click', handleClick);

        // キーボードアクセシビリティ
        const element = markerRef.current.content;
        if (element instanceof HTMLElement) {
          element.removeEventListener('keydown', handleKeyDown);
          element.addEventListener('keydown', handleKeyDown);
        }

        return () => {
          if (markerRef.current) {
            google.maps.event.clearInstanceListeners(markerRef.current);

            if (markerRef.current.content instanceof HTMLElement) {
              markerRef.current.content.removeEventListener('keydown', handleKeyDown);
            }
          }
        };
      } catch (error) {
        console.error('マーカーイベント設定中にエラーが発生しました:', error);
      }
    }, [onClick]); // poiを依存配列から削除し、onClickのみに依存

    /**
     * マーカーの選択状態を管理するuseEffectフック
     */
    useEffect(() => {
      // マーカー参照がない場合は何もしない
      if (!markerRef.current || !(markerRef.current.content instanceof HTMLElement)) {
        return;
      }

      const content = markerRef.current.content as HTMLElement;

      if (isSelected) {
        content.classList.add(styles.markerSelected);
        content.setAttribute('aria-selected', 'true');
      } else {
        content.classList.remove(styles.markerSelected);
        content.setAttribute('aria-selected', 'false');
      }
    }, [isSelected]); // poiを依存配列から削除し、isSelectedだけに依存

    // このコンポーネントは直接何もレンダリングしません
    // 代わりに、Google Maps APIを通じてマップ上にマーカーを表示します
    // Reactのレンダリングサイクルとは別にマーカーのライフサイクルを管理しています
    return null;
  },
);

// Reactデバッグツール上でコンポーネントを識別しやすくするために表示名を設定します
// これにより、開発時のコンポーネント階層の可視化が容易になります
Marker.displayName = 'Marker';

// Markerコンポーネントを名前付きエクスポートとデフォルトエクスポートの両方でエクスポートします
// これにより、インポート側で好みの方法を選択できます
export { Marker };
export default Marker;
