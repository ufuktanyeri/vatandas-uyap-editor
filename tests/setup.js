/**
 * Vitest setup — loads content scripts into jsdom global scope.
 *
 * Content scripts use plain globals (no module system).
 * We read each file and evaluate it via vm.runInThisContext so that
 * functions like sanitizeName, parseTooltip, AppState etc. become
 * available on globalThis for tests.
 *
 * Load order mirrors manifest.json content_scripts order.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import vm from 'vm';

const CONTENT_DIR = resolve(import.meta.dirname, '..', 'content');

const LOAD_ORDER = [
  'constants.js',
  'scanner.js',
  'state.js',
  'downloader.js',
];

for (const file of LOAD_ORDER) {
  const code = readFileSync(resolve(CONTENT_DIR, file), 'utf-8');
  vm.runInThisContext(code, { filename: file });
}
