/**
 * CSSモジュール用型定義
 */

interface StyleClasses {
  [className: string]: string;
}

declare module '*.css' {
  const classes: StyleClasses;
  export default classes;
}

declare module '*.scss' {
  const classes: StyleClasses;
  export default classes;
}

declare module '*.module.css' {
  const classes: StyleClasses;
  export default classes;
}

declare module '*.module.scss' {
  const classes: StyleClasses;
  export default classes;
}
