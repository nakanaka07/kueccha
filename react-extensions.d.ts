import 'react';

/**
 * Reactのaria属性拡張定義
 *
 * WAI-ARIAの属性をReactのTypeScript型システムで
 * より柔軟に使用できるように拡張する定義です。
 *
 * @see https://www.w3.org/TR/wai-aria-1.1/
 */
declare module 'react' {
  // 共通して使用されるARIA属性の型定義
  type AriaBoolean = boolean | 'true' | 'false';

  interface AriaAttributes {
    // 現在のプロジェクトで実際に使用される主要なARIA属性のみを定義

    /**
     * aria-expanded: 要素とその子要素の展開状態
     */
    'aria-expanded'?: AriaBoolean;

    /**
     * aria-selected: 選択状態
     */
    'aria-selected'?: AriaBoolean;

    /**
     * aria-current: 現在のアイテム
     */
    'aria-current'?: AriaBoolean | 'page' | 'step' | 'location' | 'date' | 'time';

    /**
     * aria-busy: 更新中の状態
     */
    'aria-busy'?: AriaBoolean;

    /**
     * aria-hidden: アクセシビリティツリーからの非表示
     */
    'aria-hidden'?: AriaBoolean;

    /**
     * aria-pressed: 押下状態
     */
    'aria-pressed'?: AriaBoolean | 'mixed';

    /**
     * aria-disabled: 無効状態
     */
    'aria-disabled'?: AriaBoolean;

    /**
     * aria-live: ライブリージョン
     */
    'aria-live'?: 'off' | 'assertive' | 'polite';

    /**
     * aria-atomic: 更新通知方法
     */
    'aria-atomic'?: AriaBoolean;
  }
}
