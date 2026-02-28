# UYAP Evrak İndirici v2.1

UYAP Vatandaş Portalı üzerinde seçilen dosyalardaki evrakları güvenli şekilde toplu indirmenizi sağlayan Chrome uzantısı.

## Özellikler

- **Ağaç Görünümü**: Filetree'yi klasör hiyerarşisiyle görüntüleme, expand/collapse, klasör bazlı toplu seçim
- **Akıllı Tarama**: DOM'u otomatik parse eder, duplikasyonları Set ile filtreler (352 span → 206 benzersiz evrak)
- **Gelişmiş İndirme**: fetch() + magic bytes ile dosya tipi tespiti (PDF/UDF/TIFF/DOCX)
- **Session Kontrolü**: Content-Type + HTML snippet çift kontrol ile oturum süresi algılama
- **Retry**: Başarısız indirmelerde exponential backoff ile otomatik yeniden deneme
- **Pause/Resume/Cancel**: İndirme sürecini kontrol edebilme
- **WAF Koruması**: Konfigüre edilebilir gecikme ile rate limit koruması
- **Basit Mod**: UYAP'ın kendi `downloadDoc()` fonksiyonunu kullanma seçeneği
- **Multi-Dosya Takibi**: Aynı oturumda birden fazla dosya arası geçişte indirme geçmişi ve istatistik

## Kurulum

1. `chrome://extensions/` adresine gidin
2. "Geliştirici modu" açın
3. "Paketlenmemiş yükle" ile `uyap-evrak-indirici` klasörünü seçin

## Kullanım

1. UYAP Vatandaş Portalı'nda bir dosya açın
2. Sağ altta beliren mavi FAB butonuna tıklayın
3. "Dosyaları Tara" ile evrakları listeleyin
4. Ağaç görünümünde klasörleri açıp kapatarak istediğiniz evrakları seçin
5. "İndir" butonuna tıklayın

## İndirme Modları

- **Gelişmiş Mod** (varsayılan): fetch() ile indirir, magic bytes ile dosya tipini algılar, retry yapar
- **Basit Mod**: UYAP'ın kendi indirme fonksiyonunu (`window.downloadDoc()`) kullanır

## Geliştirme

Build adımı yoktur, doğrudan Chrome'a yüklenir. Kod değişikliklerinden sonra uzantıyı reload edip UYAP sayfasını yenileyin.

```bash
npm install          # Geliştirme bağımlılıklarını kur
npm test             # Testleri çalıştır (Vitest)
npm run lint         # ESLint kontrolü
npm run format:check # Prettier kontrolü
```

## Teknik Detaylar

- **Manifest V3** Chrome Extension
- **Build tool yok** — doğrudan Chrome'a yüklenebilir
- **Vanilla JS** — framework yok, IIFE pattern ile modüler yapı
- **Same-origin** fetch ile UYAP session cookie'leri otomatik gönderilir
- **DOM-only** yaklaşım — UYAP DOM'unu değiştirmeden okuma

## Dosya Yapısı

```
uyap-evrak-indirici/
├── manifest.json
├── package.json
├── background/
│   └── service-worker.js      # Chrome Downloads & Storage API
├── content/
│   ├── constants.js            # Sabitler, magic bytes, selectors, yardımcı fonksiyonlar
│   ├── scanner.js              # Filetree tarama, dedup, tooltip parse
│   ├── downloader.js           # İndirme motoru, retry, session detect
│   ├── state.js                # Uygulama durumu, multi-dosya context
│   ├── ui.js                   # FAB + drawer UI, ağaç görünümü
│   └── main.js                 # Orkestrator, event delegation
├── styles/
│   └── panel.css
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── tests/
│   ├── setup.js                # Test ortamı kurulumu
│   ├── constants.test.js
│   ├── scanner.test.js
│   └── state.test.js
├── eslint.config.js
├── vitest.config.js
├── .prettierrc
└── .prettierignore
```

## Lisans

[MIT](LICENSE)
