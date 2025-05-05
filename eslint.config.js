import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
// React特有のlintプラグインを追加
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      // 型チェック対応のlintルールに置き換え初期
      ...tseslint.configs.recommendedTypeChecked,
      // より厳格なルールを追加（オプション）安定期
      // ...tseslint.configs.strictTypeChecked,
      // スタイリスティックなルールを追加（オプション）チーム合意がある場合
      // ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        // TypeScriptプロジェクト設定を追加
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      // React特有のプラグインを追加
      'react-x': reactX,
      'react-dom': reactDom,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // React特有のルールを追加
      ...reactX.configs['recommended-typescript'].rules,
      ...reactDom.configs.recommended.rules,
    },
  },
)