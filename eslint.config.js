import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest
      },
      parser: await import('@typescript-eslint/parser')
    },
    rules: {
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off',
      'no-undef': 'off'
    },
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.js'
    ]
  }
]; 