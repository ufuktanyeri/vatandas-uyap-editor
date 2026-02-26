# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UYAP Evrak İndirici - Chrome Extension (Manifest V3) for bulk downloading documents from UYAP Vatandas Portali (Turkish Citizen Judicial Portal). Vanilla JavaScript, no build tools, no framework.

## Development

**No build step required.** Load directly in Chrome:

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. "Load unpacked" -> select `uyap-evrak-indirici/` folder
4. After code changes, click reload icon on the extension card
5. Refresh the UYAP page to pick up changes

**Target URL:** `https://vatandas.uyap.gov.tr/*`

## Architecture

### Data Flow (one-directional)

```
UYAP DOM -> Scanner -> AppState -> UI -> User
                                    |
                              Downloader -> Background Service Worker -> Chrome Downloads API
```

### Content Scripts (injected in order)

1. **constants.js** - Config, selectors, magic bytes, timeouts, UI messages
2. **scanner.js** - Parses UYAP filetree DOM recursively, deduplicates via Set, returns `{ tree, flatList }`
3. **downloader.js** - Fetch-based download engine with magic bytes file type detection, retry/backoff, pause/resume/cancel
4. **state.js** - `AppState` plain object with methods (no framework). Uses Set for selections and expanded folders
5. **ui.js** - IIFE module. FAB button + drawer panel. Recursive tree view rendering via string concatenation + innerHTML
6. **main.js** - Orchestrator IIFE. Event delegation, MutationObserver for UYAP modal, lifecycle management

### Background Service Worker

`background/service-worker.js` - Handles chrome.runtime messages:
- `GET_SETTINGS` / `SET_SETTINGS` - chrome.storage.local
- `DOWNLOAD_FILE` - chrome.downloads.download() with `saveAs: false` for automatic download

### Module Patterns

- **IIFE pattern** for `UI`, `Downloader`, and main initialization (private scope + public API)
- **Plain object** for `AppState` (direct property access + methods)
- **Plain functions** for `scanner.js` and `constants.js` (global scope, no encapsulation needed)

### Communication

Content script -> Background: `chrome.runtime.sendMessage({ type, payload })`
Background -> Content script: `sendResponse()` (async, returns `true`)

## Key Technical Details

### Download Mechanism

Primary: `fetch()` with credentials -> ArrayBuffer -> magic bytes detection (PDF/UDF/TIFF/PNG/JPEG) -> base64 data URL -> `chrome.runtime.sendMessage('DOWNLOAD_FILE')` -> `chrome.downloads.download()`

Fallback: blob URL + `<a>.click()` (triggers browser save dialog)

### Download Endpoints (yargiTuru-based routing)

`getDownloadEndpoint(yargiTuru)` mirrors UYAP's `Application.getDownloadURL`:
- Default (Hukuk/Ceza/etc): `download_document_brd.uyap`
- İcra (yargiTuru=2): `download_document_danistay_brd.uyap`
- Yargıtay (yargiTuru=3): `download_document_yargitay_brd.uyap`
- KVK (yargiTuru=kvk): `kvkEvrakDownloadDocument_brd.uyap`

### Session Detection

Two-layer check: (1) Content-Type header for text/html, (2) magic bytes check for HTML doctype in response body.

### UYAP DOM Selectors (in constants.js)

- `#browser.filetree` - Document tree (`UL#browser.filetree.treeview-gray.treeview`)
- `#dosya_goruntule_modal` - File viewer modal (Bootstrap 3.3.5, uses `.in` class)
- `span.file[evrak_id]` - File elements (attributes: evrak_id, ce, data-original-title)
- `span.folder` - Folder elements

### Scanner Deduplication

Same evrak_id appears in multiple DOM locations (observed: 299 spans, 67 folders, 5103 total DOM elements). Uses `Set` for O(1) dedup. Skips "Dosyaya Eklenen Son 20 Evrak" folder (duplicate source, matched via `.includes('Son 20 Evrak')`).

### Tree View

Scanner returns nested tree + flat list. UI renders recursively with folder expand/collapse state tracked in `AppState.expandedFolders` (Set of fullPath strings). Folder checkboxes select/deselect all children recursively.

## CSS Conventions

- **Namespace:** All classes prefixed with `.uyap-ext-` to avoid UYAP page conflicts
- **BEM-inspired:** Block `uyap-ext-panel`, Element `uyap-ext-panel__header`, Modifier `uyap-ext-btn--primary`
- **CSS Variables:** `--uyap-color-*`, `--uyap-z-*` in `:root`
- **Scoped reset:** `box-sizing: border-box` on `.uyap-ext-panel *`

## Important Constraints

- **Never modify UYAP DOM** - jQuery events are bound to original elements; DOM changes break UYAP functionality
- **Same-origin only** - fetch() works because extension runs in UYAP's origin context
- **No external dependencies** - No npm, no CDN imports. Uses UYAP's own FontAwesome icons
- **Memory management** - Must clean up MutationObservers, event listeners (via eventRegistry Map), and blob URLs on unload
- **WAF protection** - Configurable delay (default 300ms) between consecutive downloads to avoid rate limiting

## UYAP Runtime Environment (verified Feb 2026)

- jQuery 1.11.2, jQuery UI 1.11.2, jQuery Migrate 1.2.1, Bootstrap 3.3.5
- Font Awesome (version undetermined, loaded from UYAP CDN)
- Modal uses Bootstrap 3 `.in` class (not `.show`)
- Tooltip content wrapped in `<div>` tags (not `<br>`)
- `downloadDoc(evrakId, dosyaId, yargiTuru)` → `downloadDocCustom` → `Application.getDownloadURL` → endpoint routing
- Chrome path: GET via anchor click dispatch; Other browsers: POST via form submit
- File span attributes: `evrak_id`, `ce`, `data-original-title`, `data-placement`, `data-html`
- jQuery events on file spans: focusin, focusout, mouseover, mouseout, dblclick, contextmenu, click
