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
  }
}