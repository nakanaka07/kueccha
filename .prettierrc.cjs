// Prettierの設定ファイルをエクスポート
module.exports = {
  // アロー関数の引数に常に括弧を使用する設定
  arrowParens: 'always', // 例: (x) => x

  // オブジェクトリテラルの括弧内にスペースを入れる設定
  bracketSpacing: true, // 例: { foo: bar }

  // 改行コードをLFに統一する設定
  endOfLine: 'lf', // Unix系OSで一般的なLFを使用

  // 1行の最大文字数を設定
  printWidth: 80, // 80文字を超えると改行

  // ステートメントの末尾にセミコロンを追加する設定
  semi: true, // 例: const x = 1;

  // シングルクォートを使用する設定
  singleQuote: true, // 例: 'string'

  // インデントのスペース数を設定
  tabWidth: 2, // 2スペースでインデント

  // 末尾のカンマを常に追加する設定
  trailingComma: 'all', // 例: { foo: bar, }

  // スペースでインデントする設定
  useTabs: false, // タブではなくスペースを使用
};
