import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'web',
    'ignore',
    // src/components is shadcn's generated library; only components/custom is ours to lint.
    'src/components/ui/**',
    'src/components/flex/**',
    'src/components/*.tsx',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      semi: 'off',
      '@/semi': ['error', 'always'],
    },
  },
  {
    // Doc content files intentionally pair a `*Content` component with a
    // plain `*Article` metadata object so the registry can compose them.
    files: ['src/content/docs/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
