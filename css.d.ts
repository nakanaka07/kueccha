/**
 * CSSモジュール用型定義
 * 
 * このファイルはCSSファイルをTypeScriptプロジェクト内でモジュールとして
 * インポートするための型定義を提供します。
 * 
 * 使用例:
 * ```
 * import styles from './styles.css';
 * // styles.header, styles.container などのようにアクセス可能
 * ```
 * 
 * @version 1.0.0
 */
declare module '*.css' {
  interface CSSModuleClasses {
    [className: string]: string;
  }
  const classes: CSSModuleClasses;
  export default classes;
}

// SCSSファイル用の型定義
declare module '*.scss' {
  interface SCSSModuleClasses {
    [className: string]: string;
  }
  const classes: SCSSModuleClasses;
  export default classes;
}

// CSS Modulesの拡張型定義
declare module '*.module.css' {
  interface CSSModuleClasses {
    readonly [className: string]: string;
  }
  const classes: CSSModuleClasses;
  export default classes;
}

// SCSS Modulesの拡張型定義
declare module '*.module.scss' {
  interface SCSSModuleClasses {
    readonly [className: string]: string;
  }
  const classes: SCSSModuleClasses;
  export default classes;
}