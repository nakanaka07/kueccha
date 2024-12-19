module.exports = {
  root: true, // 親ディレクトリの設定ファイルを無視する
  extends: ["react-app/compat", "prettier"], 
  parser: "@typescript-eslint/parser",
  overrides: [
    {
      files: ["src/**/*"],
      rules: {
        // 必要に応じてルールを追加
      }
    }
  ]
};
