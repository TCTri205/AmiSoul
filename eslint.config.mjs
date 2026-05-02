// @ts-check
import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import path from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...compat.extends('eslint-config-airbnb-base'),
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-unused-vars': 'off', // Use TS version
      'import/prefer-default-export': 'off',
      'class-methods-use-this': 'off',
      'import/extensions': 'off',
      'import/no-unresolved': 'off',
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            'test/**/*.ts',
            '**/*.spec.ts',
            '**/*.e2e-spec.ts',
          ],
        },
      ],
      '@typescript-eslint/no-floating-promises': 'warn',
      'no-void': ['error', { allowAsStatement: true }],
    },
  },
);
