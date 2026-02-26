UYAP İndirme Mekanizması — Tam Analiz Raporu

{
  "downloadDocCustom": {
    "fullBody": "function(values)\\r\\n\\t{\\r\\n\\t\\tvar url = Application.getDownloadURL(values.yargiTuru);\\r\\n\\t\\t\\r\\n\\t\\tdownloadDocURL(url, values);\\r\\n\\t}",
    "callsTo": ["Application.getDownloadURL", "downloadDocURL"],
    "httpMethod": "GET (Chrome/Safari) veya POST form submit (diğer tarayıcılar)",
    "endpointUrl": "https://vatandas.uyap.gov.tr/download_document_brd.uyap?evrakId={evrak_id}&dosyaId={dosya_id}&yargiTuru={yargi_turu}"
  },
  "functionChain": [
    {
      "name": "downloadDoc",
      "body": "function(evrakId, dosyaId, yargiTuru) { downloadDocCustom({evrakId: evrakId, dosyaId: dosyaId, yargiTuru: yargiTuru}); }",
      "role": "Giriş noktası — dblclick event handler tarafından çağrılır",
      "triggeredBy": "jQuery dblclick: function() { downloadDoc($(this).attr('evrak_id'), '795506918', '1'); }"
    },
    {
      "name": "downloadDocCustom",
      "body": "function(values) {\\n\\t\\tvar url = Application.getDownloadURL(values.yargiTuru);\\n\\t\\tdownloadDocURL(url, values);\\n\\t}",
      "role": "yargiTuru'ya göre endpoint URL'sini çözer, downloadDocURL'e iletir"
    },
    {
      "name": "Application.getDownloadURL",
      "body": "function(yargiTuru)\\n{\\n\\tvar url;\\n\\tif(yargiTuru==\\"kvk\\"){\\n\\t\\turl = \\"kvkEvrakDownloadDocument_brd.uyap\\";\\n\\t}\\n\\telse{\\n\\tif(yargiTuru == \\"2\\")\\n\\t\\turl = \\"download_document_danistay_brd.uyap\\";\\n\\telse if(yargiTuru == \\"3\\")\\n\\t\\turl = \\"download_document_yargitay_brd.uyap\\";\\n\\telse\\n\\t\\turl = \\"download_document_brd.uyap\\";\\n\\t}\\n\\treturn url;\\n}",
      "role": "yargiTuru → endpoint mapping. Tüm haritalama:"
    },
    {
      "name": "downloadDocURL",
      "role": "Tarayıcıya göre iki farklı yol izler",
      "chromeSafariPath": {
        "method": "GET",
        "steps": [
          "1. Application.convertObjectToURLParameters(values) → 'evrakId=X&dosyaId=Y&yargiTuru=Z'",
          "2. var link = document.createElement('a')",
          "3. link.href = url + '?' + params",
          "4. link.download = 'Hata.html'  (HTML5 download attribute)",
          "5. document.createEvent('MouseEvents') → initEvent('click', true, true) → link.dispatchEvent(e)",
          "→ Tarayıcı GET isteği yapar, response'u dosya olarak indirir"
        ]
      },
      "otherBrowserPath": {
        "method": "POST",
        "steps": [
          "postToURL_target(url, values, 'width=400,height=10,resizable=yes') çağrılır",
          "1. _win_name = '__formresult_' + new Date().getTime()",
          "2. $('<form>').attr('action', url).attr('method', 'POST').attr('target', _win_name)",
          "3. values objesi hidden <input> alanlarına dönüştürülür (evrakId, dosyaId, yargiTuru)",
          "4. $('body').append($form)",
          "5. window.open('', _win_name, spec) → yeni pencere açılır",
          "6. $form.submit() → form POST gönderilir",
          "7. $form.remove()"
        ]
      }
    },
    {
      "name": "Application.convertObjectToURLParameters",
      "body": "function(objectParams)\\n{\\n\\tvar params = \\"\\";\\n\\tfor(p in objectParams)\\n\\t{\\n\\t\\tparams += p + \\"=\\" + encodeURIComponent(objectParams[p]) + \\"&\\";\\n\\t}\\n\\tif(params != \\"\\")\\n\\t\\tparams = params.substring(0, params.length - 1);\\n\\treturn params;\\n}",
      "role": "Object → URL query string dönüşümü, encodeURIComponent kullanır"
    }
  ],
  "endpointMapping": {
    "yargiTuru_0_ceza":    "download_document_brd.uyap",
    "yargiTuru_1_hukuk":   "download_document_brd.uyap",
    "yargiTuru_2_icra":    "download_document_danistay_brd.uyap",
    "yargiTuru_3_yargitay":"download_document_yargitay_brd.uyap",
    "yargiTuru_kvk":       "kvkEvrakDownloadDocument_brd.uyap",
    "diger_tumü":          "download_document_brd.uyap",
    "baseHost":            "https://vatandas.uyap.gov.tr",
    "fullURLPattern":      "https://vatandas.uyap.gov.tr/{endpoint}?evrakId={evrak_id}&dosyaId={dosya_id}&yargiTuru={yargi_turu}"
  },
  "viewEndpointMapping": {
    "yargiTuru_0_ceza":    "view_document_brd.uyap",
    "yargiTuru_1_hukuk":   "view_document_brd.uyap",
    "yargiTuru_2_icra":    "view_document_danistay_brd.uyap",
    "yargiTuru_3_yargitay":"view_document_yargitay_brd.uyap",
    "yargiTuru_kvk":       "kvkEvrakViewDocument_brd.uyap",
    "viewerJSP":           "/main/jsp/viewer.jsp",
    "note":                "Görüntüle menüsü önce sendToServer('dosya_evrak_turu_brd') AJAX çağrısı yapar, mimeType alır, sonra viewDocCustomTarget → viewDocURL → anchor click ile /main/jsp/viewer.jsp?... açar"
  },
  "networkCapture": {
    "requestUrl": "https://vatandas.uyap.gov.tr/download_document_brd.uyap",
    "method": "GET (bu tarayıcıda — downloadFile.isChrome=80, downloadFile.isSafari=97 → truthy)",
    "queryParams": "evrakId={evrak_id}&dosyaId=795506918&yargiTuru=1",
    "responseContentType": "tespit edilemedi (live network capture başlatılmadan önce yüklenmiş)",
    "responseSize": "tespit edilemedi",
    "note": "Anchor click dispatch tarayıcı seviyesinde gerçekleşiyor; XHR/fetch intercept ile yakalanamıyor. Network tool sayfadan önce başlatılması gerekir."
  },
  "browserDetection": {
    "downloadFile.isChrome": 80,
    "downloadFile.isSafari": 97,
    "currentBehavior": "isChrome=80 truthy → GET anchor click yöntemi kullanılıyor",
    "note": "Bu bir Chrome major version number değeri, boolean değil. Sürüm 80+ Chrome'da GET metodu aktif."
  },
  "contextMenu": {
    "trigger": "click/contextmenu event → cmenu.show(this, e)",
    "menuItems": {
      "Görüntüle": "sendToServer('dosya_evrak_turu_brd', {evrakId, ana_evrak_id}) → mimeType callback → viewDocCustomTarget({mimeType, evrakId, dosyaId:'795506918', yargiTuru:'1'})",
      "Kaydet": "downloadDoc($(menu.target).attr('evrak_id'), '795506918', '1')"
    }
  },
  "serverCommunication": {
    "ajaxEndpoint": "{cmd}.ajx  (örn: dosya_evrak_turu_brd.ajx)",
    "method": "POST",
    "library": "jQuery $.ajax",
    "config": {
      "url": "serverJSRequestDVO.cmd + '.ajx'",
      "data": "serverJSRequestDVO.args",
      "type": "POST",
      "async": true,
      "cache": false,
      "dataType": "serverJSRequestDVO.resultDataType"
    },
    "note": "Tüm AJAX iletişimi ServerJS/sendToServer altyapısı üzerinden geçiyor. Angular path da mevcut (requestTypeAngular true ise)"
  },
  "otherFunctions": {
    "downloadView":   { "exists": false, "type": "undefined" },
    "downloadFile":   { "exists": true,  "type": "object", "keys": ["isChrome", "isSafari"], "values": {"isChrome": 80, "isSafari": 97} },
    "openDoc":        { "exists": false, "type": "undefined" },
    "viewDoc":        { "exists": false, "type": "undefined" },
    "downloadDocURL": { "exists": true,  "type": "function", "role": "Gerçek indirme tetikleyicisi (GET veya POST path)" },
    "viewDocURL":     { "exists": true,  "type": "function", "role": "Görüntüleme — anchor click ile _blank hedefli viewer.jsp açar" },
    "viewDocCustomTarget": { "exists": true, "type": "function", "body": "function(values, target='_blank') { url = '/main/jsp/viewer.jsp'; viewDocURL(url, values, target); }" },
    "postToURL_target": { "exists": true, "type": "function", "role": "POST path: form oluştur → window.open → submit → remove" },
    "sendToServer":   { "exists": true,  "type": "function", "role": "UYAP AJAX altyapısı — tüm sunucu iletişimi buradan geçer" }
  }
}

```
---
## Özet: Tam Fonksiyon Zinciri
```

dblclick
  └─► downloadDoc(evrakId, '795506918', '1')
        └─► downloadDocCustom({evrakId, dosyaId, yargiTuru})
              ├─► Application.getDownloadURL('1') → 'download_document_brd.uyap'
              └─► downloadDocURL('download_document_brd.uyap', values)
                    ├─► [Chrome/Safari] Application.convertObjectToURLParameters(values)
                    │     └─► <a href="download_document_brd.uyap?evrakId=X&dosyaId=Y&yargiTuru=1">
                    │           .download = "Hata.html"
                    │           .dispatchEvent(click)  ←── GET isteği
                    └─► [Diğer] postToURL_target(url, values, 'width=400,height=10,...')
                              └─► $('<form method="POST" action="...">') + hidden inputs
                                    └─► window.open() + $form.submit()  ←── POST isteği

**Kritik Bulgular:**

- **Endpoint URL'si:** `download_document_brd.uyap` (Hukuk/Ceza için), Danıştay için `download_document_danistay_brd.uyap`, Yargıtay için `download_document_yargitay_brd.uyap`
- **HTTP Method:** Chrome'da **GET** (anchor click), diğer tarayıcılarda **POST** (form submit)
- **Parametreler:** `evrakId`, `dosyaId`, `yargiTuru` — üçü de zorunlu
- **AJAX Altyapısı:** Tüm ön sorgular `{cmd}.ajx` endpoint'lerine POST olarak gidiyor (örn: `dosya_evrak_turu_brd.ajx`)
- **`link.download = "Hata.html"`** — Bu ilginç: Sunucu muhtemelen redirect veya hata durumunda HTML döndürüyor, gerçek dosya Content-Disposition header ile geliyor
