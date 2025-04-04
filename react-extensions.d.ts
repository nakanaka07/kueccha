import 'react';

/**
 * Reactのaria属性拡張定義
 *
 * このファイルはWAI-ARIAの属性をReactのTypeScript型システムで
 * より柔軟に使用できるように拡張する定義です。
 *
 * @see https://www.w3.org/TR/wai-aria-1.1/
 */
declare module 'react' {
  interface AriaAttributes {
    /**
     * ユーザーインタラクションの状態を示すARIA属性グループ
     */

    /**
     * aria-expanded属性の拡張定義
     *
     * 要素とその子要素が現在展開されているかどうかを示します。
     * HTML仕様ではaria-expandedは文字列"true"/"false"として扱われますが、
     * Reactでは一般的にbooleanとして扱われます。この拡張により両方の型を
     * サポートし、より柔軟なコンポーネント実装を可能にします。
     *
     * @description 折りたたみ可能なコンテンツの展開状態を示します
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-expanded
     * @example
     * <button aria-expanded={isOpen} onClick={toggle}>メニュー</button>
     */
    'aria-expanded'?: boolean | 'true' | 'false';

    /**
     * aria-selected属性の拡張定義
     *
     * タブやオプション要素の選択状態を示すために使用されます。
     * この属性はタブ、タブパネル、オプション、行などの選択可能な要素に適用されます。
     *
     * @description 要素が選択されているかどうかを示します
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-selected
     * @example
     * <div role="tab" aria-selected={isActive}>タブ1</div>
     */
    'aria-selected'?: boolean | 'true' | 'false';

    /**
     * aria-current属性の拡張定義
     *
     * コンテナや一連の関連要素内で現在のアイテムを表します。
     * ナビゲーションメニューなどで現在の項目を示すのに役立ちます。
     *
     * @description 一連の要素内で現在の項目を示します
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-current
     * @example
     * <a href="/page1" aria-current={currentPage === 'page1' ? 'page' : false}>ページ1</a>
     */
    'aria-current'?: boolean | 'true' | 'false' | 'page' | 'step' | 'location' | 'date' | 'time';

    /**
     * コンテンツの可視性とアクセス状態を示すARIA属性グループ
     */

    /**
     * aria-busy属性の拡張定義
     *
     * 要素やその子要素が更新中であることを示すために使用されます。
     * 特にローディング状態の表示に役立ちます。
     * スクリーンリーダーなどの支援技術に対して、コンテンツが変更中であることを伝えます。
     *
     * @description 要素が更新中であることを示します
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-busy
     * @example
     * <div aria-busy={isLoading}>読み込み中のコンテンツ...</div>
     */
    'aria-busy'?: boolean | 'true' | 'false';

    /**
     * aria-hidden属性の拡張定義
     *
     * 要素が現在アクセシビリティツリーから隠されているかを示します。
     * この属性は視覚的に見えるが、スクリーンリーダーなどから
     * アクセスされるべきでない要素に使用します。
     *
     * @description 要素がアクセシビリティAPIから隠されるべきかを示します
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-hidden
     * @example
     * <div aria-hidden={!isVisible}>非表示コンテンツ</div>
     */
    'aria-hidden'?: boolean | 'true' | 'false';
  }
}
