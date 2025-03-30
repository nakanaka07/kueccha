import 'react';

declare module 'react' {
  interface AriaAttributes {
    /**
     * aria-expanded属性の拡張定義
     *
     * HTML仕様ではaria-expandedは文字列"true"/"false"として扱われますが、
     * Reactでは一般的にbooleanとして扱われます。この拡張により両方の型を
     * サポートし、より柔軟なコンポーネント実装を可能にします。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-expanded
     */
    'aria-expanded'?: boolean | 'true' | 'false';

    /**
     * aria-selected属性の拡張定義
     *
     * タブやオプション要素の選択状態を示すために使用されます。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-selected
     */
    'aria-selected'?: boolean | 'true' | 'false';

    /**
     * aria-busy属性の拡張定義
     *
     * 要素やその子要素が更新中であることを示すために使用されます。
     * 特にローディング状態の表示に役立ちます。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-busy
     */
    'aria-busy'?: boolean | 'true' | 'false';

    /**
     * aria-hidden属性の拡張定義
     *
     * 要素が現在アクセシビリティツリーから隠されているかを示します。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-hidden
     */
    'aria-hidden'?: boolean | 'true' | 'false';

    /**
     * aria-current属性の拡張定義
     *
     * コンテナや一連の関連要素内で現在のアイテムを表します。
     * ナビゲーションメニューなどで現在の項目を示すのに役立ちます。
     *
     * @see https://www.w3.org/TR/wai-aria-1.1/#aria-current
     */
    'aria-current'?: boolean | 'true' | 'false' | 'page' | 'step' | 'location' | 'date' | 'time';
  }
}
