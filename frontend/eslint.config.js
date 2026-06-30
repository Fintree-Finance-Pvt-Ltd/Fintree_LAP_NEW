import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        clearTimeout: 'readonly',
        console: 'readonly',
        crypto: 'readonly',
        document: 'readonly',
        FormData: 'readonly',
        setTimeout: 'readonly',
        URL: 'readonly',
        window: 'readonly',
        localStorage: 'readonly'
      }
    },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  }
];
