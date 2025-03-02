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
    // AdvancedMarkerElementはDOMに直接関わるため、Reactのライフサイクル外で管理する必要があります。
    // このrefを使用することで、コンポーネントの再レンダリング間でマーカーインスタンスを保持できます。
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
      // これにより、APIが未ロードやマップが未初期化の状態での実行エラーを防止します
      if (!map || !window.google?.maps) return;

      // 現在地マーカーの場合は特別なタイトルを設定
      const markerTitle = poi.id === 'current-location' ? 'クリックして現在地マーカーを非表示にする' : poi.name;

      // POIのエリアタイプに基づいて適切なアイコンURLを取得します
      // エリアタイプに応じて視覚的に区別するため、異なるアイコン画像を使用します
      // 指定されたエリアタイプのアイコンがない場合はデフォルトアイコンを使用します
      const iconUrl = MARKER_ICONS[poi.area] || MARKER_ICONS.DEFAULT;

      // マーカーとして表示するカスタムHTML要素を作成します
      // AdvancedMarkerElementはHTML要素をマーカーとして扱えるため、より柔軟なカスタマイズが可能です
      const iconElement = document.createElement('div');
      // アイコン画像を背景として設定します（CSSのbackground-imageプロパティを使用）
      iconElement.style.backgroundImage = `url(${iconUrl})`;
      // 画像がコンテナに収まるように背景サイズを調整します（歪みを防止）
      iconElement.style.backgroundSize = 'contain';
      // アイコンの幅を設定します（サイズ一貫性のため固定値を使用）
      iconElement.style.width = '36px';
      // アイコンの高さを設定します（アスペクト比を維持）
      iconElement.style.height = '36px';
      // アクセシビリティ対応：タブ移動可能にし、キーボードフォーカスを受け取れるようにします
      // これによりキーボードユーザーもマーカーを操作できるようになります
      iconElement.setAttribute('tabindex', '0');
      // CSSモジュールからスタイルを適用し、マーカーの基本的な外観を設定します
      iconElement.classList.add(styles.markerContent);

      // Google Maps AdvancedMarkerElementを使用してマーカーを作成します
      // これは従来のMarkerよりも高度なカスタマイズと最適化が可能なAPIです
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: poi.location, // マーカーを表示する地理座標（緯度・経度）
        map, // マーカーを表示するマップインスタンス
        title: markerTitle, // 条件分岐したタイトルを設定
        content: iconElement, // マーカーとして表示するカスタム要素（上で作成したHTML要素）
        zIndex, // マーカー同士が重なった際の表示優先度（値が大きいほど前面に表示）
      });

      // マーカーがクリックされた時のイベントハンドラを定義します
      // このハンドラは親コンポーネントから渡されたコールバック関数を呼び出し、POI情報を通知します
      const handleClick = () => {
        // 親コンポーネントから渡されたコールバック関数を呼び出し、クリックされたPOIを通知します
        // これにより親コンポーネントで選択状態の更新などの処理が可能になります
        onClick(poi);
      };

      // マーカーにクリックイベントのリスナーを追加します
      marker.addListener('gmp-click', handleClick);

      // キーボードアクセシビリティ：Enterキーまたはスペースキー押下時のイベントを追加
      // これによりキーボードユーザーもマーカーを選択できるようになります
      iconElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); // デフォルトの挙動（スクロールなど）を防止
          handleClick();
        }
      });

      // 作成したマーカーインスタンスをrefに保存して、後で参照できるようにします
      // これにより他のuseEffectやイベントハンドラからマーカーにアクセス可能になります
      markerRef.current = marker;

      // POIのエリアタイプに基づいて、特別なスタイルやアニメーションを適用します
      // 特定のマーカータイプを視覚的に強調するための処理です
      if (poi.area === 'RECOMMEND') {
        // 推奨エリアのマーカーには特別な外観と点滅アニメーションを適用します
        // ユーザーの注目を集めるためのスタイルです
        iconElement.classList.add(styles.markerRecommendation);
        iconElement.classList.add(styles.markerBlinking);
      } else if (poi.area === 'CURRENT_LOCATION') {
        // 現在位置のマーカーには点滅アニメーションのみを適用します
        // ユーザーの現在地を目立たせるための視覚効果です
        iconElement.classList.add(styles.markerBlinking);
      }

      // コンポーネントがアンマウントされる時や依存関係が変更された時の
      // クリーンアップ関数を返します。これはメモリリークを防ぐために重要です。
      return () => {
        if (markerRef.current) {
          // マーカーに関連するすべてのイベントリスナーを削除します
          // これによりイベントリスナーのメモリリークを防ぎます
          google.maps.event.clearInstanceListeners(markerRef.current);
          // マーカーをマップから削除します（地図上から非表示にする）
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
     * 実際のDOMの直接操作を行うため、このような副作用はuseEffect内で処理することが適切です。
     *
     * 依存配列にはisSelectedとpoiが含まれており、
     * これらが変更された時にマーカーの視覚的な選択状態を更新します。
     */
    useEffect(() => {
      // マーカーが存在し、そのコンテンツがHTML要素である場合にのみ処理を行います
      // これにより、マーカーが初期化される前にスタイル変更を試みるエラーを防ぎます
      if (markerRef.current && markerRef.current.content instanceof HTMLElement) {
        if (isSelected) {
          // マーカーが選択されている場合、選択状態を示すCSSクラスを追加します
          // これにより、選択されたマーカーを視覚的に強調表示します
          markerRef.current.content.classList.add(styles.markerSelected);
          // アクセシビリティ：選択状態をARIA属性でも表現
          // スクリーンリーダーユーザーに選択状態を通知するために重要です
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
