module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Code style rules
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Best practices
    'no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    'no-console': 'off', // Allow console for logging
    'no-debugger': 'warn',
    'no-alert': 'warn',
    
    // ES6+ rules
    'prefer-const': 'error',
    'no-var': 'error',
    'arrow-spacing': 'error',
    'template-curly-spacing': 'error',
    
    // Function rules
    'func-call-spacing': 'error',
    'space-before-function-paren': ['error', {
      'anonymous': 'never',
      'named': 'never',
      'asyncArrow': 'always'
    }],
    
    // Object/Array rules
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'comma-spacing': 'error',
    
    // Spacing rules
    'space-infix-ops': 'error',
    'keyword-spacing': 'error',
    'space-before-blocks': 'error',
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', { 'max': 2 }],
    
    // Import rules
    'no-duplicate-imports': 'error'
  },
  globals: {
    // Browser globals
    'window': 'readonly',
    'document': 'readonly',
    'navigator': 'readonly',
    'localStorage': 'readonly',
    'sessionStorage': 'readonly',
    'fetch': 'readonly',
    'URL': 'readonly',
    'URLSearchParams': 'readonly',
    'performance': 'readonly',
    'console': 'readonly',
    
    // Project specific globals
    'MovieBannerSlider': 'readonly',
    'Storage': 'readonly',
    'Categories': 'readonly',
    'Api': 'readonly'
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    '*.min.js',
    'firestore.rules'
  ]
};
