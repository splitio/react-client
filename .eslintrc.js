module.exports = {
  'env': {
    'browser': true,
    'es6': true,
    'node': true
  },
  'extends': [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended'
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 2015,
    'sourceType': 'module'
  },
  'plugins': [
    'react',
    '@typescript-eslint',
    'eslint-plugin-tsdoc',
    'import'
  ],
  'rules': {
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'quotes': ['warn', 'single', 'avoid-escape'],
    'linebreak-style': ['error', 'unix'],
    'camelcase': ['error', { 'properties': 'never' }],
    'no-use-before-define': ['error', 'nofunc'],
    'eol-last': ['error', 'always'],
    'keyword-spacing': 'error',
    'no-trailing-spaces': 'error',
    'space-before-function-paren': ['error', { 'named': 'never' }],
    'react/display-name': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'prefer-const': ['error', {
      'destructuring': 'all'
    }]
  },
  'settings': {
    'react': {
      'version': '16.3.0' // minimum supported version of React
    }
  },
  'overrides': [{
    'files': ['src/**/*.ts', 'src/**/*.tsx'],
    'excludedFiles': ['src/**/__tests__/**'],
    'extends': [
      'plugin:compat/recommended'
    ],
    'settings': {
      'polyfills': [
        'Promise' // required as a polyfill by the user
      ]
    },
    'rules': {
      'no-restricted-syntax': ['error', 'ForOfStatement', 'ForInStatement'],
      'compat/compat': ['error', 'defaults, ie 11'],
      'no-throw-literal': 'error',
      'import/no-self-import': 'error',
      'import/no-default-export': 'error',
    }
  }, {
    // Enable TSDoc rules for TypeScript files, allowing the use of JSDoc in JS files.
    'files': ['**/*.ts', '**/*.tsx'],
    'rules': {
      'tsdoc/syntax': 'warn'
    }
  }]
}
