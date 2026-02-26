# Oturum Transkripti — 26 Şubat 2026

**Proje:** UYAP Evrak İndirici (Chrome Extension, Manifest V3)
**Tarih:** Perşembe, 26 Şubat 2026
**Kapsam:** Kod kalitesi değerlendirmesi, sürdürülebilirlik, D3 kod haritası, yazılım yönetim stratejisi, MCP yapılandırması, GitHub repo kurulumu

---

## Oturum Özeti

Bu oturumda proje 6 faz halinde değerlendirildi ve somut çıktılar üretildi:

1. **Kod Kalitesi Değerlendirmesi** — Tüm kaynak dosyalar satır satır incelendi
2. **D3 İnteraktif Kod Haritası** — Projenin modül/fonksiyon haritası görselleştirildi
3. **Yazılım Yönetim Stratejisi + MCP Yapılandırması** — Scrumban metodolojisi ve araç entegrasyonu
4. **GitHub PAT Token Yapılandırması** — Fine-grained token oluşturma rehberi ve güvenlik önerileri
5. **GitHub Repo Kurulumu** — Remote bağlama, tüm geçmiş push, LICENSE, dev branch
6. **Repo Metadata Kontrolü** — Topics, wiki, homepage eksikleri tespit edildi

---

## Faz 1: Kod Kalitesi Değerlendirmesi

### İncelenen Dosyalar

| Dosya | Satır | Karmaşıklık | Coupling | Sonuç |
|-------|-------|-------------|----------|-------|
| `content/constants.js` | 103 | Düşük | Yok | Temiz, iyi organize |
| `content/scanner.js` | 325 | Orta | Düşük | Recursive parse iyi, global scope dezavantaj |
| `content/downloader.js` | 336 | Yüksek | **Yüksek** | AppState'e doğrudan erişim problematik |
| `content/state.js` | 221 | Orta | **Yüksek** | UI'a doğrudan bağlı, reset() anti-pattern |
| `content/ui.js` | 466 | Yüksek | Orta | innerHTML risk, dual rendering |
| `content/main.js` | 465 | Yüksek | Orta | Orkestratör rolü iyi, fat controller |
| `background/service-worker.js` | 90 | Düşük | Yok | Temiz, minimalist |
| `styles/panel.css` | 639 | — | — | İyi organize, bazı hardcode renkler |

**Toplam:** ~2,006 satır JS, ~639 satır CSS, 0 harici bağımlılık, 0 test

### Genel Puan: 8/10

### Güçlü Yanlar

- Sorumluluk ayrımı iyi (her dosya tek görev)
- IIFE pattern doğru kullanılmış (Downloader, UI)
- Event delegation doğru uygulanmış
- eventRegistry Map ile cleanup altyapısı
- Magic bytes + Content-Type çift katmanlı session kontrolü
- CSS `.uyap-ext-` namespace ile çakışma önleme
- Set ile O(1) deduplikasyon

### Tespit Edilen Riskler

| Seviye | Risk | Dosya | Açıklama |
|--------|------|-------|----------|
| **KRİTİK** | Tight coupling | `state.js` | `reset()` doğrudan `UI.renderEvraklar()` çağırır |
| **KRİTİK** | Tight coupling | `downloader.js` | `downloadAll()` doğrudan `AppState.sessionExpired` okur |
| **ORTA** | innerHTML XSS | `ui.js` | String concat + innerHTML (escapeHtml var ama kırılgan) |
| **ORTA** | Global scope | `constants.js`, `scanner.js` | ~25 global isim, UYAP JS ile çakışma riski |
| **DÜŞÜK** | Bellek | `downloader.js` | base64 data URL 1.33x RAM overhead |
| **DÜŞÜK** | Kod tekrarı | `ui.js` | Eski grup + yeni tree rendering birlikte korunuyor |

### Sürdürülebilirlik Önerileri (Öncelik Sırasıyla)

**P0 — Hemen:**
1. ESLint + Prettier ekle
2. State-UI coupling'i kır (observer/callback pattern)
3. Downloader'ı pure yap (AppState erişimini kaldır)

**P1 — Kısa vade:**
4. Global scope'u temizle (IIFE sarmalama)
5. Eski grup rendering'i kaldır
6. CSS hardcode renkleri değişkenlere taşı
7. base64 yerine blob URL indirme stratejisi

**P2 — Orta vade:**
8. Birim test altyapısı
9. JSDoc type annotations
10. Error boundary (top-level try-catch)
11. CHANGELOG.md başlat

---

## Faz 2: D3 İnteraktif Kod Haritası

**Çıktı:** `code-map.html` (412 satır, standalone HTML)

### Özellikler

- D3.js v7 CDN'den yükleniyor
- Tarayıcıda tek başına açılabilir (bağımsız)
- ~70 düğüm: Tüm dosya, fonksiyon ve metotlar
- Collapsible node'lar (tıkla → aç/kapat)
- Hover tooltip ile detaylı açıklama
- Sağlık renk kodları:
  - **Yeşil:** Temiz modül/fonksiyon
  - **Sarı:** Orta karmaşıklık / dikkat gerektiren
  - **Kırmızı:** Sorunlu coupling / yüksek risk
  - **Mor:** Klasör / grup düğümleri
  - **Mavi:** Fonksiyon / metot

### Kapsanan Modüller

- `manifest.json` (3 alt düğüm)
- `content/constants.js` (10 alt düğüm)
- `content/scanner.js` (9 alt düğüm)
- `content/downloader.js` (13 alt düğüm)
- `content/state.js` (14 alt düğüm)
- `content/ui.js` (15 alt düğüm)
- `content/main.js` (12 alt düğüm)
- `background/service-worker.js` (5 alt düğüm)
- `styles/panel.css` (12 alt düğüm)

---

## Faz 3: Yazılım Yönetim Stratejisi

**Çıktı:** `.cursor/rules/software-management.mdc` (Cursor rule, always active)

### Seçilen Metodoloji: Scrumban

| Pratik | Kaynak | Uygulama |
|--------|--------|----------|
| WIP limiti (maks 2) | Kanban | Odağı korur |
| Sürekli akış | Kanban | Sprint gereksiz |
| 2 haftalık retrospektif | Scrum | Düzenli değerlendirme |
| Definition of Done | Scrum | Kalite eşiği |
| User story formatı | Scrum | Yapılandırılmış gereksinimler |

### Tanımlanan Süreçler

- **Branching:** Git Flow Lite (main → dev → feat/fix/refactor dalları)
- **Commit:** Conventional Commits formatı (`tip(kapsam): açıklama`)
- **Sürüm:** Semantic Versioning (MAJOR.MINOR.PATCH)
- **Kod inceleme:** 7 maddelik kontrol listesi
- **Teknik borç:** `// TECH-DEBT:` etiketi

### Yol Haritası

| Sürüm | Tema | İçerik |
|-------|------|--------|
| v2.1.0 | Kalite ve Kararlılık | ESLint, coupling kırma, CSS değişkenleri |
| v2.2.0 | Performans | blob URL, eski rendering kaldırma, global scope |
| v2.3.0 | Test ve Dokümantasyon | Birim testler, JSDoc, CHANGELOG |
| v3.0.0 | Gelişmiş Özellikler | Pagination, kuyruk, klasör yapısı |

---

## Faz 4: MCP Server Yapılandırması

**Çıktı:** `.cursor/mcp.json`

### Yapılandırılan Sunucular

| Sunucu | Paket | Amaç |
|--------|-------|------|
| Task Master AI | `task-master-ai` | Görev yönetimi, PRD'den iş kırımı, önceliklendirme |
| GitHub MCP | `@modelcontextprotocol/server-github` | Issue/PR yönetimi, depo işlemleri |

### Aktivasyon Gereksinimleri

- [ ] `ANTHROPIC_API_KEY` değerini gerçek key ile değiştir
- [ ] `GITHUB_PERSONAL_ACCESS_TOKEN` değerini gerçek PAT ile değiştir
- [ ] Cursor'u yeniden başlat

---

## Oturumda Oluşturulan Dosyalar

| Dosya | Tür | Boyut |
|-------|-----|-------|
| `code-map.html` | D3 interaktif görselleştirme | 412 satır |
| `.cursor/rules/software-management.mdc` | Cursor rule (always active) | 154 satır |
| `.cursor/mcp.json` | MCP server yapılandırması | 18 satır |
| `.gitignore` | Git ignore kuralları | 11 satır |

---

## Faz 5: GitHub PAT Token Yapılandırması

### Fine-Grained Token Yetki Önerisi

Token 28 permission türünden sadece 3'ü ile oluşturuldu (minimum yetki prensibi):

| Permission | Yetki | Gerekçe |
|---|---|---|
| **Contents** | Read and write | Repo dosyaları, branch, commit |
| **Issues** | Read and write | Backlog yönetimi, bug tracking |
| **Pull requests** | Read and write | PR oluşturma, inceleme, merge |
| Metadata | Read-only | Otomatik verilir (zorunlu) |
| Diğer 24 permission | **Seçilmedi** | Gereksiz, saldırı yüzeyini genişletir |

**Expire date:** 90 gün önerisi verildi (sınırsız token önerilmez).

### Tespit: `aylasenturk` Credential Sorunu

Git credential manager'da başka bir hesap (`aylasenturk`) kayıtlı bulundu. Push işlemleri PAT token ile URL'e gömülerek yapıldı. Kalıcı çözüm: Windows Credential Manager'dan eski GitHub credential'ini silme.

---

## Faz 6: GitHub Repo Kurulumu

**Hedef repo:** https://github.com/ufuktanyeri/vatandas-uyap-editor

### Yapılan İşlemler

| İşlem | Durum |
|---|---|
| `safe.directory` eklendi (dubious ownership hatası çözüldü) | Tamamlandı |
| 5 yeni dosya commit edildi (code-map, strateji, gitignore, transkript, tree view) | Tamamlandı |
| Remote `vatandas-uyap-addon-modern-ui` → `vatandas-uyap-editor` değiştirildi | Tamamlandı |
| 7 commit'lik tüm geçmiş force push edildi | Tamamlandı |
| MIT LICENSE dosyası eklendi ve push edildi | Tamamlandı |
| `dev` branch oluşturuldu ve push edildi | Tamamlandı |
| Remote URL'den PAT token temizlendi (güvenlik) | Tamamlandı |

### Tespit Edilen Eksikler (Manuel Gerekli)

PAT token'da `Administration` yetkisi olmadığı için aşağıdaki işlemler GitHub web arayüzünden yapılmalı:

- [ ] **Topics ekle:** `chrome-extension`, `uyap`, `javascript`, `manifest-v3`, `document-downloader`, `vanilla-js`, `browser-extension`
- [ ] **Wiki kapat:** Settings > Features > Wikis
- [ ] **Homepage ayarla:** `https://vatandas.uyap.gov.tr`

### Son Git Durumu

```
Branches: main (varsayılan), dev (aktif geliştirme)
Remote: https://github.com/ufuktanyeri/vatandas-uyap-editor.git
Commits: 7 (tümü push edildi)
Son commit: docs: MIT lisansi ekle
```

---

## Faz 7: ESLint + Prettier Yapılandırması

### Oluşturulan Dosyalar

| Dosya | Açıklama |
|---|---|
| `package.json` | v2.0.0, `type: "module"`, lint/format npm scriptleri, devDependencies |
| `eslint.config.js` | ESLint v10 flat config, dosya bazlı global tanımları |
| `.prettierrc` | Single quote, trailing comma ES5, printWidth 100, auto endOfLine |
| `.prettierignore` | node_modules, icons, code-map.html |

### Yüklenen Bağımlılıklar

| Paket | Sürüm | Amaç |
|---|---|---|
| `eslint` | ^10.0.2 | Statik analiz |
| `@eslint/js` | ^10.0.1 | ESLint önerilen kurallar |
| `eslint-config-prettier` | ^10.1.8 | Prettier ile çakışan ESLint kurallarını devre dışı bırak |
| `prettier` | ^3.8.1 | Kod formatlama |

### ESLint Config Mimarisi

Content script'lerin global scope paylaşımı nedeniyle dosya bazlı yapılandırma uygulandı:

| Dosya | Görünen Globaller |
|---|---|
| `constants.js` | Yalnızca browser API'ları |
| `scanner.js` | Browser + constants export'ları |
| `downloader.js` | Browser + constants + scanner + AppState |
| `state.js` | Browser + constants + UI |
| `ui.js` | Browser + constants + AppState |
| `main.js` | Browser + tüm modül export'ları |
| `service-worker.js` | Yalnızca chrome API (ES module) |

### Aktif Kurallar

| Kural | Seviye | Açıklama |
|---|---|---|
| `no-undef` | error | Tanımsız değişken kullanımı engelle |
| `no-eval` | error | eval() kullanımı engelle |
| `no-implied-eval` | error | setTimeout("string") engelle |
| `no-new-func` | error | new Function() engelle |
| `no-alert` | error | alert() kullanımı engelle |
| `no-var` | warn | var yerine let/const öner |
| `prefer-const` | warn | Değişmeyen değişkenlerde const öner |
| `eqeqeq` | warn | === kullanımını öner |
| `no-shadow` | warn | Üst scope değişkenini gölgeleme uyarısı |
| `no-redeclare` | error | Aynı isimde yeniden tanımlama engelle |
| `curly` | warn | Çok satırlı bloklarda süslü parantez zorunlu |

### Düzeltilen Uyarılar (3)

| Dosya | Sorun | Çözüm |
|---|---|---|
| `service-worker.js:24` | `sender` unused parameter | `_sender` olarak yeniden adlandırıldı |
| `downloader.js:122` | `response` iç scope'ta shadow | `downloadResponse` olarak yeniden adlandırıldı |
| `scanner.js:225` | `let currentPath` asla reassign edilmiyor | `const currentPath` olarak değiştirildi |

### Son Durum

```
npx eslint .  →  0 errors, 0 warnings
Commit: feat(infra): ESLint + Prettier yapilandirmasi ekle, lint uyarilari duzelt
Push: main → origin (başarılı)
```

### npm Scriptleri

```bash
npm run lint          # Hataları göster
npm run lint:fix      # Otomatik düzelt
npm run format        # Prettier ile formatla
npm run format:check  # Format kontrolü
```

---

## Oturumda Oluşturulan Dosyalar

| Dosya | Tür | Boyut |
|-------|-----|-------|
| `code-map.html` | D3 interaktif görselleştirme | 412 satır |
| `.cursor/rules/software-management.mdc` | Cursor rule (always active) | 154 satır |
| `.cursor/mcp.json` | MCP server yapılandırması | 18 satır |
| `.gitignore` | Git ignore kuralları | 14 satır |
| `LICENSE` | MIT lisansı | 21 satır |
| `package.json` | NPM yapılandırması | 35 satır |
| `eslint.config.js` | ESLint flat config | 155 satır |
| `.prettierrc` | Prettier kuralları | 9 satır |
| `.prettierignore` | Prettier ignore | 4 satır |
| `session-transcript-2026-02-26.md` | Bu transkript | — |

---

## Açık Aksiyonlar

### Tamamlanan Aksiyonlar
- [x] Git repo initialize, remote bağla, kod push et
- [x] LICENSE (MIT) ekle
- [x] `dev` branch oluştur (branching stratejisi)
- [x] GitHub PAT token yapılandır (Contents, Issues, Pull requests — 90 gün expire)
- [x] `.gitignore` ile hassas dosyaları koru (mcp.json, settings.local.json, node_modules)
- [x] ESLint + Prettier yapılandırması ekle (0 error, 0 warning)
- [x] 3 lint uyarısını düzelt (unused param, shadow, prefer-const)

### Altyapı — Manuel Gerekli
- [ ] GitHub repo topics ekle (web arayüzünden)
- [ ] GitHub wiki kapat (web arayüzünden)
- [ ] GitHub homepage ayarla (web arayüzünden)
- [ ] MCP Task Master AI için ANTHROPIC_API_KEY yapılandır
- [ ] Cursor'u yeniden başlat (MCP server aktivasyonu)
- [ ] Windows Credential Manager'da `aylasenturk` credential'ini temizle

### v2.1.0 — Kalite ve Kararlılık
- [ ] `state.js` → `reset()` içindeki UI çağrılarını kaldır, `main.js`'de callback ile bağla
- [ ] `downloader.js` → `downloadAll()` içindeki AppState erişimini parametreye çevir
- [ ] `panel.css` → Tree view hardcode renklerini CSS değişkenlerine taşı

### v2.2.0 — Performans
- [ ] `downloader.js` → base64 data URL yerine blob URL stratejisine geç
- [ ] `ui.js` → Eski flat grup rendering kodunu kaldır (satır 232-288)
- [ ] `constants.js` + `scanner.js` → IIFE ile global scope'u temizle

### v2.3.0 — Test ve Dokümantasyon
- [ ] Birim test altyapısı kur (scanner, downloader pure fonksiyonları)
- [ ] JSDoc type annotations ekle
- [ ] CHANGELOG.md başlat
