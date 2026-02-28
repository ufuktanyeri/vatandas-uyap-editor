# TODO — UYAP Evrak İndirici v2.2.0+

Son güncelleme: 2026-02-27

---

## Kritik / Bug

### BUG-1: scanFiletree() hata dönüş tipi uyumsuzluğu
- **Dosya:** `content/scanner.js` satır 167-169
- **Sorun:** Filetree bulunamazsa `return []` dönüyor. Ama `main.js` satır 297-298'de `scanResult.flatList` ve `scanResult.tree` olarak destructure ediliyor. Filetree yoksa `scanResult.flatList` **undefined** olur → extension crash.
- **Çözüm:** `return []` → `return { tree: [], flatList: [] }`
- **Etki:** 1 satır değişiklik
- **Test:** `scanner.test.js`'e filetree-not-found senaryosu ekle

---

## P1 — Yüksek Öncelik (v2.2.0)

### T-1: Eski Flat Rendering Kodu Temizliği (~120 satır ölü kod)
- **Neden:** Tree view her zaman kullanılıyor, eski flat grup rendering kodu ölü.
- **Kaldırılacaklar:**
  - `ui.js` → `renderEvraklar()` içindeki FALLBACK bloğu (satır 244-288)
  - `ui.js` → `renderEvrakCard()` fonksiyonu tamamen (satır 293-311)
  - `ui.js` → `updateSelectionUI()` içindeki `$$('.uyap-ext-group__checkbox')` bloğu (satır 325-331)
  - `main.js` → `handleBodyChange` FALLBACK grup checkbox bloğu (satır 205-216)
  - `main.js` → `handleBodyClick` FALLBACK grup header bloğu (satır 234-252)
  - `state.js` → `klasorEvraklariniSec()` metodu (satır 103-109)
  - `state.js` → `klasorEvraklariniKaldir()` metodu (satır 111-117)
  - `state.js` → `getGroupedEvraklar()` metodu (satır 69-84) — yukarıdakiler kalkınca kullanıcısı kalmıyor
  - `panel.css` → `.uyap-ext-group__*` stilleri (satır 300-345)
  - `panel.css` → `.uyap-ext-card` ve `.uyap-ext-card__content` ve `.uyap-ext-card__name` (satır 347-370)
    - **DİKKAT:** `.uyap-ext-card__checkbox` ve `.uyap-ext-card__meta` tree view'de kullanılıyor — kaldırma!
- **Sonrası:** ESLint config'den kullanılmayan global kontrol et, `npx eslint .` + `npm test`
- **Dosyalar:** ui.js, main.js, state.js, panel.css, eslint.config.js

### T-2: Scanner findDosyaId() — window.dosyaId kullan, innerHTML kaldır
- **Neden:** UYAP `window.dosyaId` global değişken olarak tanımlıyor (DOM analizinde doğrulandı). Mevcut kod `document.body.innerHTML` serialization yapıyor (ağır, gereksiz).
- **Yapılacaklar:**
  1. Öncelik 1 ekle: `if (window.dosyaId) return String(window.dosyaId);`
  2. Öncelik 2: Inline script tarama — `document.querySelectorAll('script:not([src])')` → textContent'te dosyaId ara
  3. Öncelik 3 (mevcut): jQuery event handler parse (fallback)
  4. `document.body.innerHTML` regex'i tamamen kaldır
- **Ek:** `findDosyaId()` ve `getYargiTuru()` içindeki duplicate jQuery._data parsing kodunu ortak helper'a çıkar:
  ```
  function parseJQueryDblclickHandler(regex) { ... }
  ```
- **Test:** `scanner.test.js`'e window.dosyaId senaryosu ekle
- **Dosyalar:** scanner.js, tests/scanner.test.js

### T-3: Blob URL İndirme Geçişi (bellek %33 tasarruf)
- **Neden:** `downloadSingle()` ArrayBuffer → base64 → data URL dönüşümü yapıyor. 10MB PDF = 13MB base64 string. Ayrıca `chrome.runtime.sendMessage` ile data URL gönderiliyor — büyük dosyalarda message size limitine takılabilir.
- **Yapılacaklar:**
  1. `downloadSingle()`: base64 yerine `Blob` + `URL.createObjectURL(blob)` kullan
  2. Blob URL'i `chrome.runtime.sendMessage('DOWNLOAD_FILE')` ile background'a gönder
  3. **Araştır:** `chrome.downloads.download()` content script origin blob URL'leri kabul ediyor mu? Service worker farklı origin'de — blob URL erişilemeyebilir
  4. Eğer blob URL çalışmıyorsa: content script'te `<a>.click()` ile indir (mevcut fallback zaten bunu yapıyor), `chrome.downloads` sadece dosya adı için kullan
  5. `URL.revokeObjectURL(blobUrl)` ile temizle
  6. `arrayBufferToBase64()` kullanılmıyorsa kaldır
  7. Mevcut fallback path (satır 153-177) zaten blob kullanıyor — birleştir
- **Risk:** İndirme mekanizmasının temelini değiştiriyor, kapsamlı manuel test gerektirir
- **Dosyalar:** downloader.js, service-worker.js

### T-4: IIFE Global Scope Temizliği (~27 global → window.X export)
- **Neden:** constants.js 18 global, scanner.js 9 global tanımlıyor. UYAP'ın kendi globalleriyle çakışma riski.
- **Yapılacaklar:**
  1. `constants.js` → IIFE ile sarma, `Object.assign(window, { ... })` ile export
  2. `scanner.js` → Aynı pattern
  3. Downloader, AppState, UI, main.js zaten kapsüllü — değişiklik yok
  4. `escapeHtml`'i window export'a ekle
  5. ESLint config'de değişiklik gerekmez (global tanımlar aynı kalır)
- **Not:** T-1 (flat rendering temizliği) önce yapılmalı, sonra IIFE sarma
- **Test:** Mevcut 70 test'in geçtiğini doğrula (vm.runInThisContext ile yükleme etkilenebilir)
- **Dosyalar:** constants.js, scanner.js, tests/setup.js

---

## P2 — Orta Öncelik (v2.2.0-v2.3.0)

### T-5: SW Promise Wrapper Temizliği
- **Neden:** `getSettings()` ve `setSettings()` gereksiz callback-based Promise wrapper kullanıyor. MV3'te `chrome.storage.local.get/set` native Promise döndürüyor.
- **Çözüm:**
  ```js
  async function getSettings() {
    const result = await chrome.storage.local.get('uyap-settings');
    return result['uyap-settings'] || null;
  }
  async function setSettings(settings) {
    await chrome.storage.local.set({ 'uyap-settings': settings });
    return { success: true };
  }
  ```
- **Etki:** 12 satır → 6 satır
- **Dosya:** service-worker.js

### T-6: DOCX vs UDF Ayrımı
- **Neden:** `detectFileType()` ZIP magic bytes gördüğünde her zaman UDF diyor. DOCX de ZIP container.
- **Yapılacaklar:**
  1. ZIP tespit edildikten sonra ilk 2KB'ta `[Content_Types].xml` ara → DOCX
  2. `constants.js`'e `MIME_TYPES.DOCX` ve `FILE_EXTENSIONS.DOCX` ekle
  3. UYAP tooltip'teki "Tipi" alanı ("DOSYA", "GDN") ipucu olarak kullanılabilir
- **Risk:** ZIP header offset değişkenlik gösterebilir, %100 güvenilir değil
- **Dosyalar:** constants.js, downloader.js

### T-7: JSDoc Type Annotations
- **Neden:** Hiçbir type tanımı yok. IDE autocomplete ve dokümantasyon eksik.
- **Öncelik sırası:**
  1. `constants.js` — @typedef'ler (DownloadEndpoints, Selectors, vb.)
  2. `scanner.js` — @typedef EvrakItem, TreeNode, ScanResult, DosyaBilgileri
  3. `downloader.js` — @typedef DownloadResult, ProgressEvent
  4. `state.js` — @typedef AppStateType
  5. `ui.js` ve `main.js` — @param/@returns
- **Dosyalar:** Tüm content/*.js

---

## P3 — Düşük Öncelik (v2.3.0)

### T-8: CHANGELOG.md
- **Neden:** Proje değişiklik geçmişi yok.
- **Format:** Keep a Changelog
- **İçerik:** v2.0.0 ve v2.1.0 retrospektif, sonrası canlı
- **Dosya:** CHANGELOG.md (yeni)

### T-9: Downloader IIFE İç Fonksiyon Testleri
- **Neden:** `detectFileType()`, `isHtmlResponse()`, `arrayBufferToBase64()` IIFE içinde private — test edilemiyor.
- **Seçenekler:**
  a) T-3 (Blob URL geçişi) sonrası bazı fonksiyonlar gereksiz kalabilir
  b) IIFE'den seçili fonksiyonları `Downloader.` altında expose et
  c) Test için ayrı export mekanizması

### T-10: Çok Sayfalı Dosya Tarama
- **Neden:** UYAP DOM analizinde `ul.pagination.bootpag` ile sayfalama butonları (Önceki/Sonraki) keşfedildi. Şu an sadece aktif sayfa taranıyor.
- **Yapılacaklar:** Sayfa navigasyonunu otomatize et, tüm sayfaları tara ve birleştir
- **Risk:** Her sayfa geçişi AJAX tetikler, rate limiting

### T-11: Rate Limiting Header Doğrulama
- **Neden:** UYAP DOM analizinde rate limiting header'ları doğrulanamadı (yeni request tetiklenmedi). WAF davranışı hala varsayıma dayalı.
- **Yapılacak:** Chrome DevTools ile manuel test — X-RateLimit, Retry-After, X-WAF, CF header'larını kontrol et

---

## Bağımlılık Sırası

```
BUG-1 (bağımsız, hemen yapılabilir)
  ↓
T-1 (flat rendering temizliği)
  ↓
T-2 (findDosyaId + jQuery helper) ← bağımsız, T-1 ile paralel olabilir
  ↓
T-4 (IIFE sarma) ← T-1 sonrası, ölü kod kaldırılmış olmalı
  ↓
T-3 (Blob URL) ← bağımsız ama en riskli, kapsamlı test gerekir
  ↓
T-5, T-6, T-7 (bağımsız, herhangi bir sırada)
  ↓
T-8, T-9, T-10, T-11 (düşük öncelik)
```
