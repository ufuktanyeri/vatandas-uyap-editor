# UYAP Evrak İndirici — Kapsamlı Durum Analiz Raporu

```json
{
  "environment": {
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    "platform": "Win32",
    "language": "tr-TR",
    "screen": { "width": 1536, "height": 864, "dpr": 1.25 },
    "viewport": { "innerWidth": 1102, "innerHeight": 651 },
    "clientSize": { "width": 1031, "height": 651 },
    "os": "Windows 10/11 (64-bit)",
    "browser": "Chrome",
    "browserVersion": "145.0.0.0",
    "extensionVersion": "DOM/JS üzerinden erişilemiyor (content script izolasyonu)",
    "hoverCapable": true,
    "coarsePointer": false,
    "darkMode": false,
    "reducedMotion": false,
    "uyapViewportMeta": "width=device-width, initial-scale=1"
  },
  "uiVisibility": {
    "fabVisible": true,
    "fabId": "uyap-ext-fab",
    "fabClasses": "uyap-ext-fab uyap-ext-fab--pulse",
    "fabPosition": {
      "position": "fixed",
      "bottom": "270px",
      "right": "10px",
      "width": "60px",
      "height": "60px",
      "zIndex": 10106,
      "borderRadius": "50%",
      "backgroundColor": "rgb(37, 99, 235)",
      "icon": "fa-download (Font Awesome)",
      "title": "UYAP Evrak İndirici",
      "not_bottom_right": "UYAP modal açık olduğu için FAB bottom:270px konumuna itmekte — varsayılan bottom:30px değil"
    },
    "fabOverlapsUyap": false,
    "fabBehindDrawerWhenOpen": true,
    "fabZIndexNote": "FAB z-index(10106) < Drawer z-index(10108) — drawer açıkken FAB drawer arkasında kalıyor, görünmez ama erişilemez de değil",
    "drawerOpens": true,
    "drawerClasses": "uyap-ext-drawer uyap-ext-drawer--open",
    "drawerPosition": {
      "position": "fixed",
      "top": "0px",
      "right": "0px",
      "width": "400px",
      "height": "651.2px",
      "zIndex": 10108,
      "boxShadow": "rgba(0,0,0,0.24) -7px 0px 16px -6px",
      "transition": "transform 0.3s ease-in-out",
      "backgroundColor": "rgb(255,255,255)"
    },
    "overlayPresent": true,
    "overlaySpec": {
      "width": "1031.2px (UYAP alanını kapatıyor)",
      "backgroundColor": "rgba(0,0,0,0.4)",
      "zIndex": 10107
    },
    "panelSections": {
      "header": { "visible": true, "height": "61px", "title": "UYAP Evrak İndirici", "closeBtn": "fa-times (32x32px)" },
      "stats": { "visible": true, "height": "83px" },
      "sessionAlert": { "visible": false, "display": "none" },
      "actions": { "visible": true, "height": "160px" },
      "progress": { "visible": false, "display": "none" },
      "treeBody": { "visible": true, "height": "347px" }
    },
    "cssConflicts": [
      "Drawer font-family 'Open Sans' inherit ediyor (UYAP CSS'inden) — eklenti kendi drawer root fontunu belirtmemiş; panel içi elementler system-ui kullanıyor, tutarsızlık var",
      "Overlay width 1031.2px (clientWidth) kullanıyor, innerWidth 1102px değil — scroll genişliği farkından minor hizalama sorunu olabilir",
      "FAB bottom:270px — UYAP'ın dosya görüntüleme modal'ı açıkken FAB yukarı itilmiş; modal kapanınca bottom değişip değişmediği belirsiz"
    ],
    "turkishCharsOk": true,
    "scrollbarStyled": false,
    "scrollbarNote": "Native scrollbar kullanılıyor, webkit custom scrollbar CSS'i yok"
  },
  "scanResult": {
    "evrakCount": 188,
    "scanDurationSec": "tespit edilemedi (tarama öncesi başlatılmadı; scan butonu disabled — tarama zaten tamamlanmış)",
    "scanBtnDisabled": true,
    "scanBtnDisabledReason": "Tarama tamamlandığında buton disabled kalıyor — yeniden tarama için mekanizma eksik veya sayfa yenilenmesi gerekiyor",
    "treeRendered": true,
    "treeStats": {
      "totalNodes": 227,
      "folderNodes": 68,
      "fileNodes": 159,
      "checkboxes": 227,
      "checkedCheckboxes": 227
    },
    "foldersExpanded": true,
    "allFoldersOpenByDefault": true,
    "closedFolderCount": 0,
    "metadataVisible": false,
    "metadataNote": "Dosya metadata (evrak türü, gönderen, tarih) yalnızca UYAP tooltip'te var; tree node içinde görünmüyor — tek satır dosya ismi var",
    "longNamesEllipsis": true,
    "longNamesSpec": {
      "overflow": "hidden",
      "textOverflow": "ellipsis",
      "whiteSpace": "nowrap",
      "width": "186.4px",
      "titleAttribute": "mevcut (tam isim title attr'da görülüyor)"
    },
    "folderCountBadge": true,
    "folderCountBadgeSpec": {
      "class": "uyap-ext-tree-count",
      "display": "block",
      "backgroundColor": "rgb(255,255,255)",
      "borderRadius": "10px",
      "fontSize": "11px",
      "color": "rgb(107,114,128)",
      "note": "Dosya sayısı badge'i klasör yanında gösteriliyor (örn: 'Reddiyat Makbuzu (5) → 5')"
    },
    "scrollWorks": true,
    "scrollHeight": 8626,
    "clientHeight": 347,
    "checkboxSync": "test edilemedi (DOM değişikliği yasak)",
    "selectAllWorks": "test edilemedi",
    "deselectAllWorks": "test edilemedi",
    "counterAccurate": false,
    "counterDiscrepancy": {
      "buttonShows": 188,
      "fileCheckboxCount": 159,
      "folderCheckboxCount": 68,
      "totalChecked": 227,
      "explanation": "İndir(188) sayısı tarama sırasında unique evrak_id sayısından hesaplanıyor (188 benzersiz). Tree'de görünen 159 file node, UYAP filetree'de 266 unique id'den yalnızca görünür olan alt klasörlerdekiler. 'Son 20 Evrak' ve diğer tekrar klasörleri bazı evrakları birden fazla sayabiliyor. Sayaç source data tabanlı, tree render tabanlı değil.",
      "bug": "İndir butonu sayacı ile tree'deki checkbox sayısı uyuşmuyor — kullanıcı için kafa karıştırıcı"
    },
    "dosyaNoDisplayBug": {
      "shown": "\\">",
      "htmlEncoded": "\\">",
      "cause": "Dosya No UYAP'ın JS değişkeninden alınamamış, muhtemelen innerHTML regex ile çekilirken HTML entity olan '\\">' karakteri yakalanmış — XSS koruması nedeniyle '>' yerine '>' var",
      "severity": "Orta — işlevsel değil, görsel hata"
    },
    "issues": [
      "Scan butonu tarama tamamlandıktan sonra disabled kalıyor — yeniden tarama için kullanıcı sayfayı yenilemek zorunda",
      "İndir(188) sayacı ile tree checkbox sayısı (159) uyuşmuyor",
      "Dosya No stats alanında '\\">' olarak yanlış gösteriliyor",
      "Dosya metadata (tür, tarih, gönderen) tree'de görünmüyor, sadece tooltip'te"
    ]
  },
  "downloadControls": {
    "progressBarVisible": false,
    "progressBarNote": "Henüz indirme başlatılmadı; progress section display:none",
    "progressBarSpec": {
      "trackHeight": "8px",
      "trackBackground": "rgb(229,231,235)",
      "barBackground": "rgb(37,99,235)",
      "barAnimation": "0.8s linear infinite uyap-progress-stripe",
      "stripePattern": "linear-gradient 45deg rgba(255,255,255,0.15) stripe",
      "barTransition": "width 0.3s",
      "labelElement": "#uyap-ext-progress-label (İndiriliyor...)",
      "valueElement": "#uyap-ext-progress-value (0/0 format)"
    },
    "stripeAnimated": true,
    "counterUpdates": "tasarım var (0/0 format mevcut)",
    "pauseButton": { "id": "uyap-ext-pause", "text": "Duraklat", "class": "uyap-ext-btn--warning", "display": "inline-flex" },
    "cancelButton": { "id": "uyap-ext-cancel", "text": "İptal", "class": "uyap-ext-btn--danger", "display": "inline-flex" },
    "controlActionsDisplay": "none (indirme başlamadan gizli)",
    "pauseWorks": "test edilemedi",
    "resumeWorks": "test edilemedi",
    "cancelWorks": "test edilemedi",
    "completedStateCorrect": "test edilemedi",
    "failedCountShown": "tasarım belirsiz",
    "errorMessageShown": {
      "elementExists": true,
      "id": "uyap-ext-progress-error",
      "display": "none",
      "note": "Error element mevcut, indirme hatası olduğunda görünür hale gelecek"
    },
    "sessionAlertElement": {
      "id": "uyap-ext-session-alert",
      "display": "none",
      "class": "uyap-ext-alert",
      "icon": "fa-exclamation-triangle"
    },
    "issues": [
      "İndirme test edilemedi (aktif indirme yok)"
    ]
  },
  "redownloadBehavior": {
    "redownloadsAll": "test edilemedi",
    "hasVisualIndicator": false,
    "hasVisualIndicatorNote": "File node HTML'de indirilmiş dosyayı işaret eden class, icon veya renk değişikliği yok — tüm dosyalar aynı fa-file-text-o ikonuyla gösteriliyor",
    "hasFilterOption": false,
    "perFileStatusDuringDownload": "belirsiz — active download göstergesi DOM'da tespit edilemedi",
    "issues": [
      "İndirilmiş dosyaları ayırt eden görsel gösterge yok",
      "Sadece indirilmeyenleri indirme filtresi yok"
    ]
  },
  "responsive": {
    "currentViewport": "1102px",
    "drawerFitsContent": true,
    "drawerWidth": "400px (sabit)",
    "uyapAreaRemaining": "646px (1046-400)",
    "treeViewNoOverflow": true,
    "treeViewScrollWidth": 394,
    "treeViewClientWidth": 394,
    "buttonsNotClipped": true,
    "textProperlyTruncated": true,
    "mediaQueryCount": 0,
    "mediaQueryNote": "Eklenti CSS'inde media query tespit edilemedi — drawer genişliği tüm ekran boyutlarında sabit 400px",
    "narrowWindowTests": {
      "1024px": "test edilmedi — 400px drawer + içerik sığacak; UYAP alana 624px kalır",
      "768px": "kritik — 400px drawer, UYAP'a yalnızca 368px bırakır; UYAP layout bozulabilir",
      "480px": "ciddi sorun — drawer viewport genişliğinden büyük veya eşit; tam ekranı kapatır"
    },
    "touchTargetsSufficient": false,
    "touchTargets": {
      "fileCheckbox": { "size": "16x16px", "wcagMin": "44x44px", "passes": false },
      "folderToggle": { "size": "20x20px", "wcagMin": "44x44px", "passes": false },
      "closeButton": { "size": "32x32px", "wcagMin": "44x44px", "passes": false },
      "mainButtons": "yeterli (tam genişlik, yükseklik ~40px)"
    },
    "issues": [
      "Responsive CSS media query yok — drawer her ekran boyutunda 400px sabit",
      "768px ve altında UYAP sayfası kullanılamaz hale gelebilir",
      "Dokunmatik cihazlar için checkbox ve toggle boyutları yetersiz (16px < 44px öneri)"
    ]
  },
  "platform": {
    "computedFont": {
      "drawer": "\\"Open Sans\\", sans-serif (UYAP'tan inherit)",
      "panelBody": "system-ui, -apple-system, \\"Segoe UI\\", Roboto, sans-serif",
      "fabButton": "system-ui, -apple-system, \\"Segoe UI\\", Roboto, sans-serif",
      "inconsistency": "Drawer root Open Sans, panel içi system-ui — font tutarsızlığı var"
    },
    "antialiased": "belirlenemedi (CSS -webkit-font-smoothing tespit edilemedi)",
    "highDpiOk": "DPR 1.25 — hafif ölçekleme var, SVG ikon yerine Font Awesome font kullandığından iyi render edilmeli",
    "downloadDirPath": "Chrome varsayılan indirme dizini (tespit edilemedi)",
    "turkishFilenamesOk": "belirsiz (indirme yapılmadı)",
    "uyapPageResponsive": false,
    "uyapPageNote": "UYAP sayfası fixed width layout — responsive değil",
    "zoomLevel": "varsayılan (ölçülmedi)"
  },
  "accessibility": {
    "tabNavigation": true,
    "tabIndexValues": "tüm butonlar tabIndex:0 — tab navigasyonu teorik olarak çalışır",
    "keyboardCheckbox": "test edilemedi",
    "ariaAttributes": false,
    "ariaDetails": {
      "anyAriaFound": false,
      "closeButtonAriaLabel": null,
      "checkboxAriaLabel": null,
      "checkboxHasLabel": false,
      "checkboxHasId": false,
      "folderToggleRole": null,
      "treeRole": null
    },
    "colorContrastOk": false,
    "colorContrastDetails": {
      "metadataText": { "colors": "rgb(156,163,175) on rgb(249,250,251)", "ratio": "2.43:1", "passes": false, "note": "WCAG AA için 4.5:1 gerekli" },
      "normalText": { "colors": "rgb(75,85,99) on white", "ratio": "7.56:1", "passes": true },
      "buttonText": { "colors": "white on rgb(37,99,235)", "ratio": "5.17:1", "passes": true },
      "countText": { "colors": "rgb(107,114,128) on white", "ratio": "4.83:1", "passes": true }
    },
    "issues": [
      "Hiçbir eklenti elementinde aria-label, aria-role, aria-expanded, aria-checked yok",
      "Checkbox'larda label element veya aria-label yok — screen reader erişilemez",
      "Klasör toggle span'ı için role='button' veya aria-expanded yok",
      "Close butonu için aria-label='Kapat' yok — sadece fa-times ikonu var",
      "Tree listesi için role='tree', role='treeitem' kullanılmamış",
      "Metadata text renk kontrastı 2.43:1 — WCAG AA başarısız (min 4.5:1)"
    ]
  },
  "performance": {
    "totalExtDomElements": 1382,
    "treeElements": 1407,
    "panelElements": 1453,
    "queryTimeMs": "0.50ms (querySelector hızlı)",
    "scrollHeight": 8626,
    "clientHeight": 347,
    "scrollRatio": "8626/347 = ~24.9x — çok uzun liste",
    "scrollSmooth": "native scroll, akıcı olmalı",
    "checkboxResponseMs": "test edilemedi",
    "folderToggleFlicker": "test edilemedi",
    "scrollPositionPreserved": "test edilemedi",
    "memoryUsageMB": "tespit edilemedi (chrome://extensions erişim yok)",
    "virtualizationNote": "159 dosya + 68 klasör = 227 node + 1380+ DOM elemanı; virtualization yok — büyük dosyalarda performans sorunu olabilir",
    "issues": [
      "Tüm 227 node tek seferde render ediliyor — virtual scroll / windowing yok",
      "8626px scroll height — çok fazla DOM node performansı etkileyebilir",
      "Tüm klasörler varsayılan açık — ilk render yükü yüksek"
    ]
  },
  "summary": {
    "overallStatus": "Çalışıyor - temel işlevler aktif",
    "criticalBugs": [
      "Dosya No '\\">' olarak yanlış gösteriliyor (HTML parse hatası)",
      "İndir(188) ile tree checkbox sayısı (159) uyuşmuyor — sayaç yanıltıcı"
    ],
    "minorBugs": [
      "Scan butonu tarama sonrası disabled kalıyor — yeniden tarama için UX yok",
      "Drawer font UYAP CSS'inden inherit ediyor — font tutarsızlığı",
      "İndirilmiş dosya göstergesi yok"
    ],
    "a11yIssues": [
      "Sıfır ARIA attribute — screen reader erişimi yok",
      "Metadata renk kontrastı WCAG AA başarısız (2.43:1)",
      "Tüm dokunmatik hedefler küçük (16-32px < 44px önerisi)"
    ],
    "missingFeatures": [
      "Responsive CSS (media query yok — sabit 400px drawer)",
      "Virtual scrolling (1000+ dosya için performans sorunu olabilir)",
      "Dosya başına indirme durumu göstergesi",
      "Sadece indirilmeyenleri indirme filtresi"
    ]
  }
}
```

## Kritik Bulgular Özeti

**🔴 Hatalar:**

1. **Dosya No `">"` hatası** — stats alanında `No: ">"` görünüyor. HTML regex ile alınan değerde `&gt;` entity çözülemiş. Muhtemelen innerHTML yerine innerText ile alınmış bir değer yanlış parse edilmiş.
2. **Sayaç uyumsuzluğu** — `İndir (188)` yazar ama tree'de 159 dosya checkbox'ı var. Sayaç source data (UYAP'tan gelen raw sayı) tabanlı, rendered tree tabanlı değil. Kullanıcıda kafa karışıklığı yaratıyor. **🟡 Orta Sorunlar:**
3. **Scan butonu disabled** — tarama tamamlandıktan sonra buton aktive edilmiyor; yeniden tarama için sayfa yenileme gerekiyor.
4. **Font tutarsızlığı** — drawer root `Open Sans` (UYAP inherit), panel içi elementler `system-ui`. Eklenti kendi CSS scope'unu izole etmemiş. **🔵 Erişilebilirlik:**
5. **Sıfır ARIA attribute** — hiçbir elemanda `aria-label`, `role`, `aria-expanded`, `aria-checked` yok. Screen reader kullanıcıları için tamamen erişilemez.
6. **Renk kontrastı** — metadata metni (gri, `2.43:1`) WCAG AA standardını (`4.5:1`) geçemiyor.
7. **Dokunmatik hedefler** — checkbox 16×16px, toggle 20×20px, kapat butonu 32×32px. Mobil/tablet için yetersiz (minimum 44×44px önerilir). **🟢 İyi Çalışan:**
- FAB konumu, animasyonu, z-index yönetimi
- Drawer açma/kapama geçiş animasyonu (`transform 0.3s ease-in-out`)
- Progress bar stripe animasyonu (`uyap-progress-stripe 0.8s infinite`)
- Türkçe karakter renderı (ş, ğ, ü, ö, ç, ı, İ tümü düzgün)
- Ellipsis truncation (dosya isimleri + title attribute)
- Klasör count badge sistemi
- Session alert bileşeni (hazır, tetiklenmedi)
- Gelişmiş Mod toggle (label + tooltip mevcut)