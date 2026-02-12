# UYAP Evrak İndirici v2.0

UYAP Vatandaş Portalı üzerinde seçilen dosyalardaki evrakları güvenli şekilde toplu indirmenizi sağlayan Chrome uzantısı.

## Özellikler

- **Akıllı Tarama**: Filetree'yi otomatik parse eder, duplikasyonları Set ile filtreler
- **Gelişmiş İndirme**: fetch() + magic bytes ile dosya tipi tespiti (PDF/UDF/TIFF)
- **Session Kontrolü**: Content-Type + HTML snippet çift kontrol ile oturum süresi algılama
- **Retry**: Başarısız indirmelerde exponential backoff ile otomatik yeniden deneme
- **Pause/Resume/Cancel**: İndirme sürecini kontrol edebilme
- **WAF Koruması**: Konfigüre edilebilir gecikme ile rate limit koruması
- **Basit Mod**: UYAP'ın kendi `downloadDoc()` fonksiyonunu kullanma seçeneği
- **Klasör Bazlı Seçim**: Evrakları klasörler halinde görüntüleme ve toplu seçim

## Kurulum

1. `chrome://extensions/` adresine gidin
2. "Geliştirici modu" açın
3. "Paketlenmemiş yükle" ile `uyap-evrak-indirici` klasörünü seçin

## Kullanım

1. UYAP Vatandaş Portalı'nda bir dosya açın
2. Sağ altta beliren mavi FAB butonuna tıklayın
3. "Dosyaları Tara" ile evrakları listeleyin
4. İstediğiniz evrakları seçip "İndir" butonuna tıklayın

## İndirme Modları

- **Gelişmiş Mod** (varsayılan): fetch() ile indirir, magic bytes ile dosya tipini algılar, retry yapar
- **Basit Mod**: UYAP'ın kendi indirme fonksiyonunu (`window.downloadDoc()`) kullanır

## Teknik Detaylar

- **Manifest V3** Chrome Extension
- **Build tool yok** - doğrudan Chrome'a yüklenebilir
- **Same-origin** fetch ile UYAP session cookie'leri otomatik gönderilir
- **DOM-only** yaklaşım - `window.dosya_bilgileri` erişimi gerekmez

## Dosya Yapısı

```
uyap-evrak-indirici/
├── manifest.json
├── background/
│   └── service-worker.js
├── content/
│   ├── constants.js      # Sabitler, magic bytes, selectors
│   ├── scanner.js         # Filetree tarama, dedup, tooltip parse
│   ├── downloader.js      # İndirme motoru, retry, session detect
│   ├── state.js           # Uygulama durumu
│   ├── ui.js              # FAB + drawer UI bileşenleri
│   └── main.js            # Orkestrator
├── styles/
│   └── panel.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Lisans

Özel kullanım - tüm hakları saklıdır.
