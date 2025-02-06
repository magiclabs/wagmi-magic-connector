import tsLint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    ignores: ['dist/**'],
    plugins: {
      '@typescript-eslint': tsLint,
      'unused-imports': unusedImports,
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parser: tsParser,
      ecmaVersion: 12,
      sourceType: 'module',

      parserOptions: {
        project: './tsconfig.json',
      },
    },

    rules: {
      ...tsLint.configs.recommended.rules,
      ...prettier.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
];
