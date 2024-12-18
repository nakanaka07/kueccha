module.exports = {
  parser: "@typescript-eslint/parser", // TypeScriptをパースするために@typescript-eslint/parserを使用
  parserOptions: {
    ecmaVersion: "latest",  // 最新のECMAScriptバージョンを使用
    sourceType: "module",  // ES Modulesを使用
    ecmaFeatures: {
      jsx: true, // JSX構文を許可
    },
    project: "./tsconfig.json", // tsconfig.jsonを参照して型チェックなどを実行
  },
  plugins: ["react", "@typescript-eslint"], // 使用するESLintプラグイン
  extends: [ // 継承するESLint設定
    "eslint:recommended", // ESLintの推奨設定
    "plugin:react/recommended", // eslint-plugin-reactの推奨設定
    "plugin:@typescript-eslint/recommended", // @typescript-eslint/eslint-pluginの推奨設定
  ],
  rules: { // ESLintルールをカスタマイズ
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off", // production環境ではconsoleの使用を警告、それ以外では許可
    "react/jsx-uses-react": "off", // react/jsx-uses-reactルールを無効化。React 17以降では不要
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }], // 未使用変数をエラーとする。ただし、_で始まる引数は無視
  },
  env: { // 実行環境を指定
    browser: true, // ブラウザ環境
    es2021: true, // ES2021環境
    node: true, // Node.js環境
  },
  settings: { // ESLint設定
    react: {
      version: "detect", // reactのバージョンを自動検出
    },
  },
  ignorePatterns: ["dist", "build", "node_modules", ".next"], // ESLintの対象から除外するファイル/ディレクトリ
};
