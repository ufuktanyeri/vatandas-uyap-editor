Sen bir Chrome extension geliştiricisisin. Bu sayfa UYAP Vatandaş Portalı'nın dosya görüntüleme ekranı. Aşağıdaki teknik bilgileri topla ve yapılandırılmış şekilde raporla. HİÇBİR DOM elemanını değiştirme, sadece oku.

## 1. Sayfa Genel Bilgileri

- document.title

- window.location.href (tam URL)

- Meta taglar (charset, viewport, CSP header varsa)

## 2. JavaScript Kütüphaneleri

Konsolda çalıştır ve sonuçları raporla:

- jQuery sürümü: typeof jQuery !== 'undefined' ? jQuery.fn.jquery : 'yok'

- Angular: typeof angular !== 'undefined' ? angular.version.full : 'yok'

- Bootstrap: typeof bootstrap !== 'undefined' ? bootstrap.Alert.VERSION : 'yok'

- React: typeof React !== 'undefined' ? React.version : 'yok'

## 3. Font Awesome

- FA yüklü mü? document.querySelector('link[href*="font-awesome"]') veya document.querySelector('.fa')

- FA sürümü: <link> tag'ındaki href'ten çıkar

## 4. UYAP DOM Selektörleri (DOĞRULAMA)

Her biri için: var mı, kaç tane, ilk elemanın tagName + className + attributes bilgisi

- document.querySelector('#browser.filetree')

- document.querySelector('#dosya_goruntule_modal')

- document.querySelectorAll('span.file[evrak_id]') → toplam sayı + ilk 3'ünün evrak_id değerleri

- document.querySelectorAll('span.folder') → toplam sayı + ilk 3'ünün textContent

- document.querySelector('#yargiTuru')

- document.querySelector('.username.username-hide-on-mobile')

- document.querySelector('#dosya_evrak_bilgileri_result')

## 5. Filetree Yapısı

- #browser.filetree altındaki ilk seviye <ul> → <li> sayısı

- İlk 3 <li> elemanının HTML yapısı (sadece ilk 200 karakter)

- Derinlik: en derin nested <ul> kaç seviye?

- "Son 20 Evrak" klasörü var mı?

## 6. Modal Analizi

- #dosya_goruntule_modal var mı?

- CSS display ve visibility değeri (getComputedStyle)

- 'show' veya 'in' class'ı var mı?

- Modal içindeki child element sayısı

- Modal açıkken offsetWidth ve offsetHeight

## 7. Evrak Span Detayları

Herhangi bir span.file[evrak_id] elemanını seç ve raporla:

- Tüm HTML attributes listesi (evrak_id, data-original-title, class, vs.)

- data-original-title tooltip içeriği (ham metin)

- Parent <li> ve onun parent <ul> yapısı

- jQuery event handler var mı? jQuery._data(element, 'events') → hangi eventler bağlı?

## 8. downloadDoc Fonksiyonu

- typeof window.downloadDoc → 'function' mı?

- Eğer function ise: window.downloadDoc.toString() → ilk 500 karakter

- Fonksiyon parametreleri neler? (evrakId, dosyaId, yargiTuru?)

## 9. Dosya Bilgileri

- dosyaId sayfada nasıl saklanıyor? document.body.innerHTML.match(/dosyaId\s*=\s*['"]?(\d+)['"]?/) sonucu

- #yargiTuru select'in mevcut value'su

- Dosya No bilgisi var mı? document.body.innerHTML.match(/Dosya\s+No\s*:?\s*([^\s<]+)/i)

## 10. Ağ ve Güvenlik

- document.cookie uzunluğu (karakter sayısı, içeriği değil)

- CSP meta tag var mı?

- Sayfada kaç tane <script> tag'ı var?

- Sayfada kaç tane <link rel="stylesheet"> var?

## 11. Performans

- document.querySelectorAll('*').length → toplam DOM eleman sayısı

- document.querySelectorAll('span.file[evrak_id]').length → toplam evrak span

- document.querySelectorAll('span.folder').length → toplam klasör span

## 12. İndirme Endpoint Doğrulama

- Sayfada "download_document_brd.uyap" stringi geçiyor mu?

- Başka download endpoint'leri var mı? (innerHTML'de "download" veya ".uyap" arama)

## ÇIKTI FORMATI

Tüm bulguları aşağıdaki JSON yapısında raporla:

{

  "page": { "title": "", "url": "", "meta": {} },

  "libraries": { "jquery": "", "angular": "", "bootstrap": "", "fontAwesome": "" },

  "selectors": {

    "filetree": { "exists": bool, "childCount": 0 },

    "modal": { "exists": bool, "visible": bool, "classes": "" },

    "fileSpans": { "count": 0, "sampleIds": [] },

    "folderSpans": { "count": 0, "sampleNames": [] },

    "yargiTuru": { "exists": bool, "value": "" },

    "username": { "exists": bool, "text": "" }

  },

  "evrakDetail": { "attributes": {}, "tooltip": "", "jqueryEvents": [] },

  "downloadDoc": { "exists": bool, "signature": "" },

  "dosyaBilgileri": { "dosyaId": "", "yargiTuru": "", "dosyaNo": "" },

  "security": { "cookieLength": 0, "scriptCount": 0, "stylesheetCount": 0 },

  "performance": { "totalDomElements": 0, "fileSpanCount": 0, "folderSpanCount": 0 },

  "endpoints": { "downloadBrd": bool, "otherEndpoints": [] }

}