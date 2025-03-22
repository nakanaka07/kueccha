/**
 * CSSモジュール用型定義ファイル
 * GitHub Pages静的サイト対応に最適化
 *
 * このファイルはCSS/SCSSモジュールのためのTypeScript型定義を提供します。
 * 各スタイルシートをTypeScriptで型安全に使用できるようにします。
 */

/**
 * スタイルクラス名をキーとし、生成されたユニークなクラス名を値とするマップ
 */
interface StyleClasses {
  readonly [className: string]: string;
}

/**
 * 標準CSSファイル（非モジュール）
 */
declare module '*.css' {
  const classes: StyleClasses;
  export default classes;
}

/**
 * 標準SCSSファイル（非モジュール）
 */
declare module '*.scss' {
  const classes: StyleClasses;
  export default classes;
}

/**
 * CSSモジュールファイル
 * ローカルスコープのクラス名を提供
 */
declare module '*.module.css' {
  const classes: StyleClasses;
  export default classes;
}

/**
 * SCSSモジュールファイル
 * ローカルスコープのクラス名を提供
 */
declare module '*.module.scss' {
  const classes: StyleClasses;
  export default classes;
}

/**
 * 画像ファイル型定義
 * スタイルシート内で参照される画像のパスを型安全に扱う
 */
declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.webp' {
  const value: string;
  export default value;
}
