module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:react/recommended',
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'google',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'require-jsdoc': 'off',
    'no-console': 1, // Means warning
    'prettier/prettier': 2, // Means error
    'linebreak-style': 'off'
  }
};
