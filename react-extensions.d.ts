import 'react';

/**
 * Reactのaria属性拡張定義
 *
 * WAI-ARIAの属性をReactのTypeScript型システムで
 * より柔軟に使用できるように拡張する定義です。
 * プロジェクトのアクセシビリティガイドラインに準拠しています。
 *
 * @see https://www.w3.org/TR/wai-aria-1.1/
 * @see ./docs/code_optimization_guidelines.md
 * @see ./docs/google_maps_integration_guidelines.md#8-アクセシビリティとユーザビリティ対応
 */
declare module 'react' {
  // 共通して使用されるARIA属性の型定義
  type AriaBoolean = boolean | 'true' | 'false';

  interface AriaAttributes {
    /**
     * ユーザーインタラクションの状態を示すARIA属性グループ
     * これらの属性は、要素の現在の状態をユーザーと支援技術に伝えます。
     */

    /**
     * aria-expanded: 要素とその子要素の展開状態
     *
     * @description 折りたたみ可能なコンテンツの展開状態を示します
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-expanded
     * @example <button aria-expanded={isOpen} onClick={toggle}>メニュー</button>
     */
    'aria-expanded'?: AriaBoolean;

    /**
     * aria-selected: 選択状態
     *
     * タブやオプション要素の選択状態を示します。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-selected
     * @example <div role="tab" aria-selected={isActive}>タブ1</div>
     */
    'aria-selected'?: AriaBoolean;

    /**
     * aria-current: 現在のアイテム
     *
     * 一連の関連要素内で現在の項目を表します。
     * Google Mapsのナビゲーション要素での使用に特に有用です。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-current
     * @example <a href="/page1" aria-current={currentPage === 'page1' ? 'page' : false}>ページ1</a>
     */
    'aria-current'?: AriaBoolean | 'page' | 'step' | 'location' | 'date' | 'time';

    /**
     * コンテンツの可視性とアクセス状態を示すARIA属性グループ
     */

    /**
     * aria-busy: 更新中の状態
     *
     * 要素や子要素が更新中であることを示します。
     * 特にローディング状態の表示に役立ちます。
     * Google Mapsのタイル読み込みやマーカーデータ取得時に使用します。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-busy
     * @example <div aria-busy={isLoading}>読み込み中のコンテンツ...</div>
     */
    'aria-busy'?: AriaBoolean;

    /**
     * aria-hidden: アクセシビリティツリーからの非表示
     *
     * 視覚的に見えても、支援技術からアクセスされるべきでない要素に使用します。
     * 例：装飾的なマーカーアイコンや、スクリーンリーダーからは無視すべき視覚的要素。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-hidden
     * @example <div aria-hidden={!isVisible}>非表示コンテンツ</div>
     */
    'aria-hidden'?: AriaBoolean;

    /**
     * インタラクティブ要素の状態を示すARIA属性グループ
     */

    /**
     * aria-pressed: 押下状態
     *
     * トグルボタンなど、押された（アクティブ）状態を示します。
     * 地図上のフィルターボタンなどに特に有用です。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-pressed
     * @example <button aria-pressed={isActive} onClick={toggle}>フィルター</button>
     */
    'aria-pressed'?: AriaBoolean | 'mixed';

    /**
     * aria-disabled: 無効状態
     *
     * 要素が現在操作できないことを示します。
     * disabled属性の代わりに使用し、要素を支援技術からは認識可能にしつつ操作を無効化します。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-disabled
     * @example <button aria-disabled={!isEnabled} onClick={isEnabled ? handleClick : undefined}>実行</button>
     */
    'aria-disabled'?: AriaBoolean;

    /**
     * ライブリージョンとアップデート通知のARIA属性グループ
     */

    /**
     * aria-live: ライブリージョン
     *
     * 動的に変更される領域を示し、スクリーンリーダーに変更の通知方法を指示します。
     * マップ上で発生するアラートや通知に特に有用です。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-live
     * @example <div aria-live="polite">残り{count}件の結果があります</div>
     */
    'aria-live'?: 'off' | 'assertive' | 'polite';

    /**
     * aria-atomic: 更新通知方法
     *
     * 要素が変更された場合、全体を1つの単位として通知するか、
     * 変更部分のみを通知するかを指定します。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-atomic
     * @example <div aria-live="polite" aria-atomic="true">{message}</div>
     */
    'aria-atomic'?: AriaBoolean;
  }
}
