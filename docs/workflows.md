Secilen Metodoloji: Scrumban -- Scrum + Kanban hibrit:

| Pratik                       | Kaynak | Bu Projede                             |
| ---------------------------- | ------ | -------------------------------------- |
| WIP limiti (maks 2 is)       | Kanban | Odagi korur, context switching azaltir |
| Surekli akis (sprint yok)    | Kanban | Tek gelistirici icin sprint gereksiz   |
| 2 haftalik retrospektif      | Scrum  | Duzenli degerlenirme saglr             |
| Definition of Done checklist | Scrum  | Kalite esigi belirler                  |
| User story formati           | Scrum  | Gereksinimleri yapilandirir            |

Strateji ayrica sunlari icerir:

- Git Flow Lite branching stratejisi (main / dev / feat-fix-refactor dallari)

- Conventional Commits formati (feat(scanner): ..., fix(downloader): ...)

- Semantic Versioning surm yonetimi

- Kod inceleme kontrol listesi (7 madde)

- Teknik borc takibi (// TECH-DEBT: etiketi)

- Yol haritasi (v2.1.0 → v2.2.0 → v2.3.0 → v3.0.0)

## Analiz

UYAP'in gercek endpoint mapping'i:

```
Application.getDownloadURL = function(yargiTuru) {
  if (yargiTuru == "kvk") return "kvkEvrakDownloadDocument_brd.uyap";
  if (yargiTuru == "2")   return "download_document_danistay_brd.uyap";  // İcra
  if (yargiTuru == "3")   return "download_document_yargitay_brd.uyap";  // Yargıtay
  return "download_document_brd.uyap";                                    // Default
}
```

todo:

- [v2.1.0] 

- [v2.1.0] downloader.js downloadAll() icindeki AppState erisimini parametreye cevir

- [v2.1.0] panel.css tree view hardcode renklerini CSS degiskenlerine tasi

- [v2.2.0] downloader.js base64 data URL yerine blob URL indirme stratejisine gec

- [v2.2.0] ui.js eski flat grup rendering kodunu kaldir

- [v2.2.0] constants.js + scanner.js IIFE ile global scope temizle

- [v2.3.0] Birim test altyapisi kur

- [v2.3.0] JSDoc type annotations ekle

- [v2.3.0] CHANGELOG.md baslat