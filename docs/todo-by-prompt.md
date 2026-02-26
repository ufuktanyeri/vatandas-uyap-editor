## P1 — Yüksek / Orta

### ~~1. Stats HTML XSS Escape (v2.1.0)~~ ✅ TAMAMLANDI

> Commit: `148d3ce` — fix(security): protect handleScan HTML output with escapeHtml
> escapeHtml() constants.js'e taşındı, tüm stats HTML çıktıları escape edildi.

### 2. Blob URL İndirme Geçişi (v2.2.0)

downloader.js downloadSingle() icinde (satir 117-124) ArrayBuffer once base64'e

cevriliyor (arrayBufferToBase64), sonra data URL olusturuluyor. Bu bellek

kullanimini %33 artiriyor (10MB PDF → 13MB base64 string). Ayrica bu data URL

chrome.runtime.sendMessage ile service worker'a gonderiliyor — buyuk dosyalarda

message size limitlerine takilabilir.

Yapilacaklar:

1. downloadSingle() icinde base64 yerine Blob + URL.createObjectURL kullan:

   - const blob = new Blob([arrayBuffer], { type: mimeType });

   - const blobUrl = URL.createObjectURL(blob);

2. chrome.runtime.sendMessage ile blobUrl'i gonder (data URL yerine)

3. service-worker.js downloadFile() fonksiyonunu kontrol et —

   chrome.downloads.download() blob URL'leri destekler mi dogrula

   (NOT: Service worker blob URL'lere erisilemeyebilir. Alternatif:

   content script'te chrome.downloads.download cagrilamaz, bu yuzden

   blobUrl'i background'a gonderip orada indirmek gerekebilir.

   Eger blob URL service worker'da calismiyorsa, onCreateObjectURL

   icin farkli strateji gerekir — ornegin dosyayi dogrudan

   content script'te <a> click ile indirmek ve chrome.downloads'u

   sadece dosya adini belirlemek icin kullanmak)

4. Basarili indirmeden sonra URL.revokeObjectURL(blobUrl) ile temizle

5. arrayBufferToBase64() fonksiyonunu kullanilmiyorsa kaldir

6. Fallback path'i (satir 143-177) zaten blob kullaniyor — birlestirebilirsin

7. ESLint + test

Dosyalar: content/downloader.js, background/service-worker.js

Dikkat: Bu degisiklik indirme mekanizmasinin temelini degistiriyor,

kapsamli test gerektirir.

### 3. Eski Flat Rendering Kodu Temizliği (v2.2.0)

ui.js ve main.js icinde tree view eklenmeden onceki eski flat grup rendering

kodu "backward compat" olarak duruyor. Tree view her zaman kullanildigi icin

bu kod olu.

Kaldirilacak kod bloklari:

ui.js:

- renderEvraklar() icindeki "FALLBACK: Eski grup rendering" blogu (satir 244-288)

  Sadece tree view path kalmali (satir 238-242)

- renderEvrakCard() fonksiyonu tamamen (satir 293-311) — sadece fallback kullaniyor

- updateSelectionUI() icindeki $$('.uyap-ext-group__checkbox') blogu (satir 325-331)

  Tree view checkbox senkronizasyonu zaten renderTreeView icinde yapiliyor

main.js bindEvents() icinde:

- handleBodyChange'deki "FALLBACK: Eski grup checkbox mantigi" blogu (satir 203-214)

- handleBodyClick'teki "FALLBACK: Eski grup header mantigi" blogu (satir 232-249)

state.js:

- klasorEvraklariniSec() metodu (satir 91-97) — sadece eski fallback kullaniyor

- klasorEvraklariniKaldir() metodu (satir 99-105) — sadece eski fallback kullaniyor

- getGroupedEvraklar() metodu (satir 57-72) — sadece eski fallback ve

  updateSelectionUI kullaniyor. updateSelectionUI'dan da kaldirilinca gerekli degil

panel.css:

- EVRAK GROUP blogu (satir 299-344) — .uyap-ext-group__* tum stiller

- EVRAK CARD blogu (satir 346-377) — .uyap-ext-card (tree view'de

  .uyap-ext-card__checkbox ve .uyap-ext-card__meta kullaniliyor,

  DIKKAT: bunlari kaldirma, sadece .uyap-ext-card ve .uyap-ext-card__content

  ve .uyap-ext-card__name kaldirilabilir)

Sonra ESLint config'den artik kullanilmayan globalleri kontrol et.

npx eslint calistir, sifir hata dogrula.

Dosyalar: content/ui.js, content/main.js, content/state.js, styles/panel.css,

eslint.config.js

### 4. IIFE ile Global Scope Temizliği (v2.2.0)

constants.js 16 top-level const + 2 function, scanner.js 7 top-level function

tanimliyor — toplam ~25 global degisken/fonksiyon. UYAP'in kendi globalleriyle

cakisma riski var.

Yapilacaklar:

Secenek A (Basit — onerilen):

1. constants.js'i bir IIFE icine al, sonunda window'a explicit export yap:

   (() => {

     const UYAP_BASE_URL = ...;

     // ... tum sabitler ...

     Object.assign(window, {

       UYAP_BASE_URL, DOWNLOAD_ENDPOINTS, getDownloadEndpoint,

       MAGIC_BYTES, MIME_TYPES, FILE_EXTENSIONS, SELECTORS,

       SKIP_FOLDERS, DEFAULT_SETTINGS, DEFAULT_YARGI_TURU,

       YARGI_TURLERI, RETRY_CONFIG, TIMEOUTS, UI_MESSAGES,

       STORAGE_KEYS, sanitizeName

     });

   })();

2. scanner.js'i ayni sekilde IIFE icine al:

   (() => {

     function findDosyaId() { ... }

     // ... tum fonksiyonlar ...

     Object.assign(window, {

       findDosyaId, getYargiTuru, findKisiAdi, getDosyaBilgileri,

       parseTooltip, scanFiletree, buildTreeFromFlat,

       detectPagination, waitForFiletree

     });

   })();

3. Downloader, AppState, UI zaten IIFE/const ile kapsullu — degisiklik yok

4. main.js zaten IIFE — degisiklik yok

5. ESLint config'de degisiklik yok (window.X ile atama eslint'i etkilemez,

   cunku global olarak zaten tanimli)

6. npx eslint calistir, sifir hata dogrula

Secenek B (Gelismis — namespace):

- Tum sabitler UYAP_EXT.constants.X altinda

- Tum scanner fonksiyonlari UYAP_EXT.scanner.X altinda

- Diger dosyalarda tum referanslari guncelle

- Daha temiz ama cok daha fazla degisiklik

Dosyalar: content/constants.js, content/scanner.js, eslint.config.js

### ~~5. Birim Test Altyapısı (v2.3.0)~~ ✅ TAMAMLANDI

> Commit: `814b6d4` — test: add Vitest unit test infrastructure with 70 tests
> Vitest + jsdom kuruldu. 70 test (constants: 31, scanner: 17, state: 22).
> vm.runInThisContext ile global-scope content script'ler test ortamına yükleniyor.
> NOT: Downloader IIFE internal fonksiyonları (detectFileType, isHtmlResponse, arrayBufferToBase64)
> henüz test edilmiyor — IIFE dışına erişilemez. IIFE refactoring (#4) sonrası eklenebilir.

---

## P2 — Orta

### ~~6. CSS Tree View Hardcode Renkler (v2.1.0)~~ ✅ TAMAMLANDI

> Önceki oturumlarda tamamlandı. Tüm tree view hardcoded hex renkleri CSS değişkenlerine taşındı.

### ~~7. CSS Diğer Hardcode Renkler (v2.1.0)~~ ✅ TAMAMLANDI

> Önceki oturumlarda tamamlandı. Scrollbar, title, stats, alert, buton renkleri CSS değişkenlerine taşındı.

### 8. Scanner innerHTML DOM API Geçişi (v2.2.0)

scanner.js findDosyaId() (satir 21) document.body.innerHTML ile tum DOM'u

string'e cevirip regex ile ariyor. 5103 DOM elementli sayfada bu yavas olabilir.

**Kısmen tamamlandı:** getDosyaBilgileri() textContent yaklaşımına geçirildi (commit e28fc56).
findDosyaId() hâlâ innerHTML kullanıyor.

Yapilacaklar:

findDosyaId():

- Yaklasim 1 (innerHTML regex) yerine:

  a) Inline script tag'larini tara:

     document.querySelectorAll('script:not([src])') ile tum inline

     script'leri bul, textContent icinde dosyaId ara

  b) Veya jQuery event handler parse'i (Yaklasim 2) oncelikli yap,

     basarisiz olursa inline script'lere bak

  c) JSON'dan goruldugu uzere: "dosyaId = 795506918" inline script'te

     tanimli. Regex: /dosyaId\s*=\s*['"]?(\d+)['"]?/

Dosyalar: content/scanner.js

### 9. JSDoc Type Annotations (v2.3.0)

Projenin hicbir type annotation'i yok. IDE destek ve dokumantasyon icin

JSDoc ekle.

Oncelikli dosyalar ve eklenecek tipler:

content/constants.js:

- @typedef DownloadEndpoints, MagicBytes, MimeTypes, FileExtensions, Selectors, etc.

- @param/@returns for sanitizeName, getDownloadEndpoint

content/scanner.js:

- @typedef EvrakItem { evrakId, name, relativePath, evrakTuru, evrakTarihi }

- @typedef TreeNode { type, name, fullPath, children?, evrakId?, metadata? }

- @typedef ScanResult { tree: TreeNode[], flatList: EvrakItem[] }

- @typedef DosyaBilgileri { dosyaId, dosyaNo, yargiTuru }

- @param/@returns for all functions

content/downloader.js:

- @typedef DownloadResult { success, error?, sessionExpired?, fileName?, mimeType?, fileSize?, downloadId? }

- @typedef ProgressEvent { evrakId, status, error?, current, total }

- @param/@returns for downloadAll, downloadSingle, etc.

content/state.js:

- @typedef AppStateType with all properties

- @param/@returns for all methods

content/ui.js:

- @param/@returns for public API methods

content/main.js:

- @param/@returns for handler functions

Dosyalar: Tum content/*.js dosyalari

---

## P3 — Düşük

### 10. SW Promise Wrapper Temizliği (v2.2.0)

background/service-worker.js getSettings() ve setSettings() chrome.storage.local

API'yi callback-based Promise wrapper ile kullanıyor. MV3'te zaten Promise döndürüyor.

Dosyalar: background/service-worker.js

### 11. DOCX vs UDF Ayırımı (v2.2.0)

downloader.js detectFileType() ZIP magic bytes (PK..) gördüğünde her zaman

UDF olarak işaretliyor. DOCX de ZIP container.

Dosyalar: content/constants.js, content/downloader.js

### 12. CHANGELOG.md (v2.3.0)

Proje için CHANGELOG.md başlat. Keep a Changelog formatı kullan.

Dosyalar: CHANGELOG.md (yeni)

---

## Durum Özeti

| # | Görev | Durum | Commit |
|---|-------|-------|--------|
| 1 | Stats HTML XSS Escape | ✅ Tamamlandı | `148d3ce` |
| 2 | Blob URL İndirme Geçişi | ⏳ Bekliyor | — |
| 3 | Eski Flat Rendering Temizliği | ⏳ Bekliyor | — |
| 4 | IIFE Global Scope Temizliği | ⏳ Bekliyor | — |
| 5 | Birim Test Altyapısı | ✅ Tamamlandı | `814b6d4` |
| 6 | CSS Tree View Hardcode | ✅ Tamamlandı | önceki oturum |
| 7 | CSS Diğer Hardcode | ✅ Tamamlandı | önceki oturum |
| 8 | Scanner innerHTML Geçişi | 🔶 Kısmen | `e28fc56` (getDosyaBilgileri) |
| 9 | JSDoc Type Annotations | ⏳ Bekliyor | — |
| 10 | SW Promise Wrapper | ⏳ Bekliyor | — |
| 11 | DOCX vs UDF Ayırımı | ⏳ Bekliyor | — |
| 12 | CHANGELOG.md | ⏳ Bekliyor | — |

**Tamamlanan:** 5/12 (+ 1 kısmen)
**Bekleyen:** 6/12

### Önerilen Sonraki Adım Sırası
1. #3 Eski Flat Rendering Temizliği — ölü kod kaldırma, code bloat azaltma
2. #4 IIFE Global Scope Temizliği — UYAP çakışma riskini ortadan kaldırır
3. #2 Blob URL İndirme Geçişi — bellek optimizasyonu
4. #8 Scanner innerHTML (findDosyaId) — performans
5. #10 SW Promise Wrapper — küçük temizlik
6. #11 DOCX vs UDF — dosya tipi doğruluğu
7. #9 JSDoc — geliştirici deneyimi
8. #12 CHANGELOG — dokümantasyon
