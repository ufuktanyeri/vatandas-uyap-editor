import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  fetch: 'readonly',
  URL: 'readonly',
  Blob: 'readonly',
  Uint8Array: 'readonly',
  TextDecoder: 'readonly',
  ArrayBuffer: 'readonly',
  DOMException: 'readonly',
  AbortController: 'readonly',
  MutationObserver: 'readonly',
  Map: 'readonly',
  Set: 'readonly',
  Promise: 'readonly',
  Date: 'readonly',
  Error: 'readonly',
  btoa: 'readonly',
  String: 'readonly',
  Math: 'readonly',
  parseInt: 'readonly',
  Array: 'readonly',
  Object: 'readonly',
  chrome: 'readonly',
};

const constantsExports = {
  UYAP_BASE_URL: 'readonly',
  DOWNLOAD_ENDPOINT: 'readonly',
  MAGIC_BYTES: 'readonly',
  MIME_TYPES: 'readonly',
  FILE_EXTENSIONS: 'readonly',
  SELECTORS: 'readonly',
  SKIP_FOLDERS: 'readonly',
  DEFAULT_SETTINGS: 'readonly',
  DEFAULT_YARGI_TURU: 'readonly',
  RETRY_CONFIG: 'readonly',
  TIMEOUTS: 'readonly',
  UI_MESSAGES: 'readonly',
  STORAGE_KEYS: 'readonly',
  sanitizeName: 'readonly',
};

const scannerExports = {
  findDosyaId: 'readonly',
  getYargiTuru: 'readonly',
  findKisiAdi: 'readonly',
  getDosyaBilgileri: 'readonly',
  parseTooltip: 'readonly',
  scanFiletree: 'readonly',
  buildTreeFromFlat: 'readonly',
  detectPagination: 'readonly',
  waitForFiletree: 'readonly',
};

const sharedRules = {
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-var': 'warn',
  'prefer-const': 'warn',
  eqeqeq: ['warn', 'always'],
  'no-throw-literal': 'warn',
  'no-console': 'off',
  'no-debugger': 'warn',
  'no-alert': 'error',
  'no-shadow': 'warn',
  'no-nested-ternary': 'warn',
  curly: ['warn', 'multi-line'],
};

const langBase = {
  ecmaVersion: 2022,
  sourceType: 'script',
};

export default [
  js.configs.recommended,

  // constants.js -- defines globals, consumed by all other files
  {
    files: ['content/constants.js'],
    languageOptions: { ...langBase, globals: { ...browserGlobals } },
    rules: {
      ...sharedRules,
      'no-unused-vars': 'off',
      'no-control-regex': 'off',
    },
  },

  // scanner.js -- consumes constants, defines scanner functions
  {
    files: ['content/scanner.js'],
    languageOptions: { ...langBase, globals: { ...browserGlobals, ...constantsExports } },
    rules: {
      ...sharedRules,
      'no-unused-vars': 'off',
    },
  },

  // downloader.js -- consumes constants + scanner
  {
    files: ['content/downloader.js'],
    languageOptions: {
      ...langBase,
      globals: {
        ...browserGlobals,
        ...constantsExports,
        ...scannerExports,
        AppState: 'readonly',
      },
    },
    rules: {
      ...sharedRules,
      'no-unused-vars': 'off',
      'no-shadow': 'warn',
    },
  },

  // state.js -- consumes constants only (UI coupling removed via onReset callback)
  {
    files: ['content/state.js'],
    languageOptions: {
      ...langBase,
      globals: { ...browserGlobals, ...constantsExports },
    },
    rules: {
      ...sharedRules,
      'no-unused-vars': 'off',
    },
  },

  // ui.js -- consumes constants + state
  {
    files: ['content/ui.js'],
    languageOptions: {
      ...langBase,
      globals: { ...browserGlobals, ...constantsExports, AppState: 'readonly' },
    },
    rules: {
      ...sharedRules,
      'no-unused-vars': 'off',
    },
  },

  // main.js -- orchestrator, consumes everything
  {
    files: ['content/main.js'],
    languageOptions: {
      ...langBase,
      globals: {
        ...browserGlobals,
        ...constantsExports,
        ...scannerExports,
        AppState: 'readonly',
        Downloader: 'readonly',
        UI: 'readonly',
      },
    },
    rules: {
      ...sharedRules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // background service worker -- ES module, only chrome API
  {
    files: ['background/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { chrome: 'readonly', console: 'readonly' },
    },
    rules: {
      ...sharedRules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  prettier,

  {
    ignores: ['node_modules/**', 'code-map.html', 'icons/**', '*.md', 'setup-icons.ps1'],
  },
];
