## P1 — Yuksek / Orta

### 1. Stats HTML XSS Escape (v2.1.0)

main.js handleScan() fonksiyonunda (satir 295-306) stats HTML'i olusturulurken

dosya.dosyaId, dosya.dosyaNo ve AppState.kisiAdi degerleri escapeHtml() olmadan

template literal'e ekleniyor. Bu XSS riski olusturuyor.

Yapilacaklar:

1. ui.js icindeki escapeHtml() fonksiyonunu IIFE disina tasi — ya constants.js'e

   tasiyarak global yap, ya da UI.escapeHtml olarak public API'ye ekle

2. main.js handleScan() icindeki statsHtml olusturan blogu guncelle:

   - dosya.dosyaId → escape et

   - dosya.dosyaNo → escape et

   - AppState.kisiAdi → escape et

   - pagination.currentPage / totalPages → sayi, guvenli ama tutarlilik icin escape et

3. main.js handleDownload() icindeki statsHtml'i kontrol et (satir 372-374):

   - result.completed, result.failed, result.total → sayi, guvenli

4. handleScan catch blogu (satir 321): err.message escape et

5. ESLint config'i guncelle (escapeHtml tum dosyalarda erisilebilir olmali)

6. npx eslint calistir, sifir hata dogrula

Dosyalar: content/ui.js (veya content/constants.js), content/main.js, eslint.config.js

### 2. Blob URL Indirme Gecisi (v2.2.0)

downloader.js downloadSingle() icinde (satir 117-124) ArrayBuffer once base64'e

cevriliyor (arrayBufferToBase64), sonra data URL olusturuluyor. Bu bellek

kullanimini %33 artiriyor (10MB PDF → 13MB base64 string). Ayrica bu data URL

chrome.runtime.sendMessage ile service worker'a gonderiliyor — buyuk dosyalarda

message size limitlerine takilabilir.

Yapilacaklar:

1. downloadSingle() icinde base64 yerine Blob + URL.createObjectURL kullan:

   - const blob = new Blob([arrayBuffer], { type: mimeType });

   - const blobUrl = URL.createObjectURL(blob);

2. chrome.runtime.sendMessage ile blobUrl'i gonder (data URL yerine)

3. service-worker.js downloadFile() fonksiyonunu kontrol et —

   chrome.downloads.download() blob URL'leri destekler mi dogrula

   (NOT: Service worker blob URL'lere erisilemeyebilir. Alternatif:

   content script'te chrome.downloads.download cagrilamaz, bu yuzden

   blobUrl'i background'a gonderip orada indirmek gerekebilir.

   Eger blob URL service worker'da calismiyorsa, onCreateObjectURL

   icin farkli strateji gerekir — ornegin dosyayi dogrudan

   content script'te <a> click ile indirmek ve chrome.downloads'u

   sadece dosya adini belirlemek icin kullanmak)

4. Basarili indirmeden sonra URL.revokeObjectURL(blobUrl) ile temizle

5. arrayBufferToBase64() fonksiyonunu kullanilmiyorsa kaldir

6. Fallback path'i (satir 143-177) zaten blob kullaniyor — birlestirebilirsin

7. ESLint + test

Dosyalar: content/downloader.js, background/service-worker.js

Dikkat: Bu degisiklik indirme mekanizmasinin temelini degistiriyor,

kapsamli test gerektirir.

### 3. Eski Flat Rendering Kodu Temizligi (v2.2.0)

ui.js ve main.js icinde tree view eklenmeden onceki eski flat grup rendering

kodu "backward compat" olarak duruyor. Tree view her zaman kullanildigi icin

bu kod olu.

Kaldirilacak kod bloklari:

ui.js:

- renderEvraklar() icindeki "FALLBACK: Eski grup rendering" blogu (satir 244-288)

  Sadece tree view path kalmali (satir 238-242)

- renderEvrakCard() fonksiyonu tamamen (satir 293-311) — sadece fallback kullaniyor

- updateSelectionUI() icindeki $$('.uyap-ext-group__checkbox') blogu (satir 325-331)

  Tree view checkbox senkronizasyonu zaten renderTreeView icinde yapiliyor

main.js bindEvents() icinde:

- handleBodyChange'deki "FALLBACK: Eski grup checkbox mantigi" blogu (satir 203-214)

- handleBodyClick'teki "FALLBACK: Eski grup header mantigi" blogu (satir 232-249)

state.js:

- klasorEvraklariniSec() metodu (satir 91-97) — sadece eski fallback kullaniyor

- klasorEvraklariniKaldir() metodu (satir 99-105) — sadece eski fallback kullaniyor

- getGroupedEvraklar() metodu (satir 57-72) — sadece eski fallback ve

  updateSelectionUI kullaniyor. updateSelectionUI'dan da kaldirilinca gerekli degil

panel.css:

- EVRAK GROUP blogu (satir 299-344) — .uyap-ext-group__* tum stiller

- EVRAK CARD blogu (satir 346-377) — .uyap-ext-card (tree view'de

  .uyap-ext-card__checkbox ve .uyap-ext-card__meta kullaniliyor,

  DIKKAT: bunlari kaldirma, sadece .uyap-ext-card ve .uyap-ext-card__content

  ve .uyap-ext-card__name kaldirilabilir)

Sonra ESLint config'den artik kullanilmayan globalleri kontrol et.

npx eslint calistir, sifir hata dogrula.

Dosyalar: content/ui.js, content/main.js, content/state.js, styles/panel.css,

eslint.config.js

### 4. IIFE ile Global Scope Temizligi (v2.2.0)

constants.js 16 top-level const + 2 function, scanner.js 7 top-level function

tanimliyor — toplam ~25 global degisken/fonksiyon. UYAP'in kendi globalleriyle

cakisma riski var.

Yapilacaklar:

Secenek A (Basit — onerilen):

1. constants.js'i bir IIFE icine al, sonunda window'a explicit export yap:

   (() => {

     const UYAP_BASE_URL = ...;

     // ... tum sabitler ...

     Object.assign(window, {

       UYAP_BASE_URL, DOWNLOAD_ENDPOINTS, getDownloadEndpoint,

       MAGIC_BYTES, MIME_TYPES, FILE_EXTENSIONS, SELECTORS,

       SKIP_FOLDERS, DEFAULT_SETTINGS, DEFAULT_YARGI_TURU,

       YARGI_TURLERI, RETRY_CONFIG, TIMEOUTS, UI_MESSAGES,

       STORAGE_KEYS, sanitizeName

     });

   })();

2. scanner.js'i ayni sekilde IIFE icine al:

   (() => {

     function findDosyaId() { ... }

     // ... tum fonksiyonlar ...

     Object.assign(window, {

       findDosyaId, getYargiTuru, findKisiAdi, getDosyaBilgileri,

       parseTooltip, scanFiletree, buildTreeFromFlat,

       detectPagination, waitForFiletree

     });

   })();

3. Downloader, AppState, UI zaten IIFE/const ile kapsullu — degisiklik yok

4. main.js zaten IIFE — degisiklik yok

5. ESLint config'de degisiklik yok (window.X ile atama eslint'i etkilemez,

   cunku global olarak zaten tanimli)

6. npx eslint calistir, sifir hata dogrula

Secenek B (Gelismis — namespace):

- Tum sabitler UYAP_EXT.constants.X altinda

- Tum scanner fonksiyonlari UYAP_EXT.scanner.X altinda

- Diger dosyalarda tum referanslari guncelle

- Daha temiz ama cok daha fazla degisiklik

Dosyalar: content/constants.js, content/scanner.js, eslint.config.js

### 5. Birim Test Altyapisi (v2.3.0)

Projenin hicbir testi yok. Oncelikle pure fonksiyonlar icin birim testler

kurulmali.

Yapilacaklar:

1. Test framework sec ve kur:

   npm install --save-dev vitest

   (Vitest: hizli, ESM destekli, minimal yapilandirma)

2. package.json'a test script ekle:

   "test": "vitest run",

   "test:watch": "vitest"

3. vitest.config.js olustur (minimal):

   export default { test: { globals: true } }

4. Oncelikli test dosyalari (pure fonksiyonlar — DOM bagimliligi yok):

   tests/constants.test.js:

   - sanitizeName(): ozel karakterler, uzunluk limiti, bosluklar, kontrol

     karakterleri

   - getDownloadEndpoint(): her yargiTuru icin dogru endpoint

   tests/scanner.test.js:

   - parseTooltip(): <div> format, <br> format, bos input, eksik deger,

     key:value parsing, Turkce karakterler

   - buildTreeFromFlat(): bos liste, tek dosya, nested klasorler,

     ayni isimde dosyalar

   tests/downloader.test.js:

   - detectFileType(): PDF, PNG, JPEG, ZIP/UDF, TIFF_LE, TIFF_BE,

     bilinmeyen format, bos/kisa buffer

   - isHtmlResponse(): HTML doctype, html tag, normal icerik

   - arrayBufferToBase64(): bos buffer, kucuk buffer, buyuk buffer

5. NOT: Bu fonksiyonlar simdi global scope'ta tanimli ve browser API'lere

   bagimliliklari yok (parseTooltip, sanitizeName, detectFileType vs.).

   Test dosyasinda fonksiyonlari import edebilmek icin ya:

   a) Test dosyasinda eval ile kaynak dosyayi yukle, ya da

   b) IIFE + export yapildiktan sonra (gorev #4) conditional module

      export ekle:

      if (typeof module !== 'undefined') module.exports = { ... }

Dosyalar: package.json, vitest.config.js (yeni), tests/*.test.js (yeni)

---

## P2 — Orta

### 6. CSS Tree View Hardcode Renkler (v2.1.0)

panel.css tree view bolumunde (satir 379-509) 11 hardcoded hex renk var.

:root'ta ayni degerler CSS degiskeni olarak zaten tanimli.

Degistirilecek satirlar (panel.css):

Satir 391: background: #f9fafb → background: var(--uyap-color-bg-gray-50)

Satir 394: border-bottom: 1px solid #e5e7eb → border-bottom: 1px solid var(--uyap-color-border-gray)

Satir 398: background: #f3f4f6 → background: var(--uyap-color-bg-gray-100)

Satir 408: color: #6b7280 → color: var(--uyap-color-text-secondary)

Satir 425: color: #6b7280 → color: var(--uyap-color-text-secondary)

Satir 429: color: #f59e0b → color: var(--uyap-color-folder)

  (NOT: :root'ta --uyap-color-folder: #eab308. Renk farki var:

  #f59e0b vs #eab308. Karar: #f59e0b'yi degisken degerine eslestir

  veya yeni degisken olustur: --uyap-color-folder-tree: #f59e0b)

Satir 437: color: #374151 → color: var(--uyap-color-text-primary)

  (NOT: :root'ta --uyap-color-text-primary: #1f2937. Renk farki var.

  #374151 daha acik. Karar: mevcut degiskeni kullan veya yeni olustur)

Satir 447: color: #6b7280 → color: var(--uyap-color-text-secondary)

Satir 466: border-bottom: 1px solid #e5e7eb → border-bottom: 1px solid var(--uyap-color-border-gray)

Satir 471: background: #f9fafb → background: var(--uyap-color-bg-gray-50)

Satir 489: color: #374151 → (ayni karar: text-primary veya yeni degisken)

Satir 502: color: #9ca3af → color: var(--uyap-color-text-tertiary)

Satir 506: background: #f3f4f6 → background: var(--uyap-color-bg-gray-100)

Uyumsuz renkler icin yeni degiskenler gerekebilir:

  --uyap-color-text-body: #374151  (panel title, tree name, file name)

  --uyap-color-stats-text: #4b5563

Dosyalar: styles/panel.css

### 7. CSS Diger Hardcode Renkler (v2.1.0)

panel.css tree view disi bolumlerde de hardcoded hex renkler var.

Degistirilecek satirlar:

Scrollbar (satir 74-75):

  #cbd5e1 → yeni degisken: --uyap-color-scrollbar: #cbd5e1

  #94a3b8 → yeni degisken: --uyap-color-scrollbar-hover: #94a3b8

Title (satir 196):

  color: #111827 → yeni degisken: --uyap-color-text-heading: #111827

Stats (satir 229):

  color: #4b5563 → yeni degisken: --uyap-color-stats-text: #4b5563

Stats strong (satir 234):

  color: #111827 → var(--uyap-color-text-heading)

Alert message (satir 600):

  color: #b91c1c → var(--uyap-color-error-hover)

Butonlar (satir 279-289):

  Butonlar !important ile hardcode renk kullaniyor (UYAP override icin).

  Bu satirlari CSS degiskenlerine cevirmek mumkun ama !important ile

  birlikte var() kullanilabilir:

  background-color: var(--uyap-color-primary) !important;

  Ayni degerler zaten :root'ta tanimli. Sadece hex → var() degisimi yeterli.

Dosyalar: styles/panel.css

### 8. Scanner innerHTML DOM API Gecisi (v2.2.0)

scanner.js findDosyaId() (satir 21) ve getDosyaBilgileri() (satir 108)

document.body.innerHTML ile tum DOM'u string'e cevirip regex ile ariyor.

5103 DOM elementli sayfada bu yavas olabilir.

Yapilacaklar:

findDosyaId():

- Yaklasim 1 (innerHTML regex) yerine:

  a) Inline script tag'larini tara:

     document.querySelectorAll('script:not([src])') ile tum inline

     script'leri bul, textContent icinde dosyaId ara

  b) Veya jQuery event handler parse'i (Yaklasim 2) oncelikli yap,

     basarisiz olursa inline script'lere bak

  c) JSON'dan goruldugu uzere: "dosyaId = 795506918" inline script'te

     tanimli. Regex: /dosyaId\s*=\s*['"]?(\d+)['"]?/

getDosyaBilgileri() icindeki dosyaNo aramasi (satir 108):

  document.body.innerHTML.match(/Dosya\s+No\s*:?\s*([^\s<]+)/i)

  Yerine:

  - #dosya_evrak_bilgileri_result div'inin textContent'inde ara

  - Veya sayfa iceriginde belirli bir container'da ara

  - JSON'dan: dosyaNo null geldi, bu deger her zaman mevcut olmayabilir

NOT: innerHTML regex yaklasimi "en guvenilir" olarak belirtilmis.

Degisiklik yaparken fallback olarak inline script tarama ekle,

innerHTML'i son care olarak birak.

Dosyalar: content/scanner.js

### 9. JSDoc Type Annotations (v2.3.0)

Projenin hicbir type annotation'i yok. IDE destek ve dokumantasyon icin

JSDoc ekle.

Oncelikli dosyalar ve eklenecek tipler:

content/constants.js:

- @typedef DownloadEndpoints, MagicBytes, MimeTypes, FileExtensions, Selectors, etc.

- @param/@returns for sanitizeName, getDownloadEndpoint

content/scanner.js:

- @typedef EvrakItem { evrakId, name, relativePath, evrakTuru, evrakTarihi }

- @typedef TreeNode { type, name, fullPath, children?, evrakId?, metadata? }

- @typedef ScanResult { tree: TreeNode[], flatList: EvrakItem[] }

- @typedef DosyaBilgileri { dosyaId, dosyaNo, yargiTuru }

- @param/@returns for all functions

content/downloader.js:

- @typedef DownloadResult { success, error?, sessionExpired?, fileName?, mimeType?, fileSize?, downloadId? }

- @typedef ProgressEvent { evrakId, status, error?, current, total }

- @param/@returns for downloadAll, downloadSingle, etc.

content/state.js:

- @typedef AppStateType with all properties

- @param/@returns for all methods

content/ui.js:

- @param/@returns for public API methods

content/main.js:

- @param/@returns for handler functions

Dosyalar: Tum content/*.js dosyalari

---

## P3 — Dusuk

### 10. SW Promise Wrapper Temizligi (v2.2.0)

background/service-worker.js getSettings() (satir 43-48) ve

setSettings() (satir 51-56) chrome.storage.local API'yi callback-based

Promise wrapper ile kullanıyor. MV3'te chrome.storage.local.get()

ve .set() zaten Promise donduruyor.

Degistirilecek:

getSettings():

  async function getSettings() {

    const result = await chrome.storage.local.get('uyap-settings');

    return result['uyap-settings'] || null;

  }

setSettings():

  async function setSettings(settings) {

    await chrome.storage.local.set({ 'uyap-settings': settings });

    return { success: true };

  }

Dosyalar: background/service-worker.js

### 11. DOCX vs UDF Ayirimi (v2.2.0)

downloader.js detectFileType() ZIP magic bytes (PK..) gordugunde her zaman

UDF olarak isaretliyor. Ancak DOCX de ZIP container. UYAP'tan gelen

dosyalarin cogu UDF olsa da, DOCX ekleri yanlis uzanti alabilir.

Yapilacaklar:

1. ZIP icerigini kontrol et: ilk birkaç KB'ta "[Content_Types].xml"

   string'i varsa DOCX, yoksa UDF

2. Yeni MIME ve extension ekle: MIME_TYPES.DOCX, FILE_EXTENSIONS.DOCX

3. detectFileType() icinde ZIP tespit edildikten sonra:

   const zipContent = new TextDecoder().decode(bytes.slice(0, 2000));

   if (zipContent.includes('[Content_Types].xml')) DOCX else UDF

NOT: Bu yaklasim %100 guvenilir degil (ZIP header sonrasi content

offset degisebilir). Ama cogu DOCX icin calisir. Alternatif:

ZIP local file header'daki dosya adini parse et.

Dosyalar: content/constants.js, content/downloader.js

### 12. CHANGELOG.md (v2.3.0)

Proje icin CHANGELOG.md baslat. Keep a Changelog formati kullan.

Mevcut degisiklikleri retrospektif olarak ekle.

Icerik:

# Changelog

## [2.1.0] - 2026-02-26

### Fixed

- parseTooltip() <div> tag destegi eklendi (onceki: sadece <br>)

- Metadata key eslestirme: 'Türü' ve 'Evrakın Onaylandığı Tarih'

- downloadSingle() dosya.yargiTuru parametresi kullanilmaya baslandi

- yargiTuru bazli dinamik endpoint routing (Icra/Yargitay/KVK)

- URL parametreleri encodeURIComponent ile encode ediliyor

### Added

- PNG/JPEG magic bytes dosya tipi algilama

- YARGI_TURLERI referans tablosu (8 secenek)

- DOWNLOAD_ENDPOINTS objesi + getDownloadEndpoint() fonksiyonu

### Changed

- state.js reset() UI coupling kaldirildi → onReset callback

- downloader.js AppState + scanner coupling kaldirildi

- downloader.js downloadAll() donus degeri ile istatistik raporlama

## [2.0.0] - 2026-02-26

### Added

- Ilk release: Chrome Extension MV3

- Recursive filetree tarama + tree view UI

- fetch() bazli indirme + magic bytes dosya tipi tespiti

- Pause/Resume/Cancel destegi

- WAF koruması (300ms delay)

- Session expired cift kontrol (Content-Type + magic bytes)

Dosyalar: CHANGELOG.md (yeni)