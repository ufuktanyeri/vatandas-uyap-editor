# Chrome Claude Eklentisi Prompt'u — UYAP Doğrulama v2

Aşağıdaki prompt'u Chrome Claude eklentisi ile `https://vatandas.uyap.gov.tr` üzerinde bir dosya görüntüleme modalı açıkken çalıştır.

---

## Prompt

```
Bu sayfada açık olan UYAP Vatandaş Portalı dosya görüntüleme ekranını analiz et. Aşağıdaki soruları JSON formatında yanıtla:

### 1. Filetree DOM Yapısı
- document.querySelector('#browser.filetree') elementinin tagName ve childElementCount değeri nedir?
- İlk 3 li > span elementinin attribute'larını listele (class, evrak_id, title, data-original-title, ce)
- Bir span.folder elementinin tam attribute listesi nedir?

### 2. Tooltip Format Doğrulama
- Bir span.file elementinin data-original-title attribute'undaki HTML içeriğini olduğu gibi kopyala (ilk 3 dosya için)
- title attribute'u boş mu yoksa dolu mu?
- Bootstrap tooltip initialized mı? ($('.file').data('bs.tooltip')) dön

### 3. Yargı Türü Select
- document.querySelector('#yargiTuru') elementi var mı?
- Varsa options listesini (value + text) döndür
- Mevcut seçili değer (selectedIndex, value) nedir?
- Bu select başka bir dosya açıldığında değişiyor mu?

### 4. DosyaId Kaynağı
- Sayfadaki tüm inline script'leri tara: document.querySelectorAll('script:not([src])') — kaç adet var?
- Bu script'lerden hangisinde "dosyaId" geçiyor? O script'in textContent'inin ilk 500 karakterini paylaş
- dosyaId değeri nedir?

### 5. Pagination
- document.querySelector('#dosya_evrak_bilgileri_result') elementinin textContent'i nedir?
- "Toplam X sayfadan Y. sayfa" formatında bir metin var mı?
- Sayfalama butonları (sonraki/önceki sayfa) var mı? Varsa selector'larını paylaş

### 6. Modal Yapısı
- #dosya_goruntule_modal elementinin class listesi nedir?
- Modal açıkken hangi class'lar ekleniyor? (in, show, fade, modal-open?)
- Modal backdrop elementi var mı ve selector'ı nedir?
- Modal kapandığında filetree DOM'dan kaldırılıyor mu yoksa gizleniyor mu?

### 7. Download Fonksiyonları
- window.downloadDoc fonksiyonu tanımlı mı? Tanımlıysa toString() çıktısını paylaş
- window.downloadDocCustom fonksiyonu tanımlı mı?
- Application.getDownloadURL fonksiyonu tanımlı mı?
- Bir span.file elementine çift tıklanınca ne oluyor? Network tab'da görünen request URL'ini paylaş

### 8. Rate Limiting / WAF
- Bir evrak indirirken response header'larını kontrol et — aşağıdaki header'lar var mı?
  - X-RateLimit-*
  - Retry-After
  - X-WAF-*
  - CF-* (Cloudflare)
- Response Content-Type nedir?
- Response Content-Disposition header'ı var mı?

### 9. Kullanıcı Bilgileri
- document.querySelector('.username.username-hide-on-mobile') elementinin textContent'i nedir?
- document.getElementById('ad') elementinin textContent'i nedir?
- Başka kullanıcı bilgisi gösteren element var mı?

### 10. Dosya Değişim Davranışı
- Şu anda açık dosyanın Dosya No'su ve dosyaId'si nedir?
- Modal kapatılıp farklı bir dosya açılırsa:
  - Filetree tamamen yeniden mi yükleniyor yoksa güncelleniyor mu?
  - #yargiTuru select değeri değişiyor mu?
  - dosyaId inline script'te güncelleniyor mu?

Sonucu aşağıdaki JSON formatında döndür:

{
  "filetree": { "tagName": "", "childCount": 0, "sampleSpans": [], "folderAttrs": [] },
  "tooltips": { "samples": [], "titleEmpty": true, "bootstrapInitialized": true },
  "yargiTuru": { "exists": true, "options": [], "selectedValue": "", "selectedIndex": 0 },
  "dosyaId": { "inlineScriptCount": 0, "scriptSnippet": "", "value": "" },
  "pagination": { "resultText": "", "hasPagination": false, "navButtons": [] },
  "modal": { "classList": [], "openClasses": [], "backdrop": "", "filetreeRemoved": false },
  "downloadFunctions": { "downloadDoc": "", "downloadDocCustom": false, "getDownloadURL": false, "dblclickUrl": "" },
  "rateLimiting": { "headers": {}, "contentType": "", "contentDisposition": "" },
  "userInfo": { "username": "", "ad": "", "otherElements": [] },
  "dosyaDegisim": { "dosyaNo": "", "dosyaId": "", "filetreeReloads": null, "yargiTuruChanges": null, "dosyaIdUpdates": null }
}
```

---

## Neden Bu Bilgiler Gerekli

| Alan | Amaç |
|------|------|
| Filetree DOM | Scanner.js selector'larının doğruluğunu doğrulamak |
| Tooltip | parseTooltip() format varsayımlarını doğrulamak |
| Yargı Türü | getYargiTuru() öncelik zincirini doğrulamak |
| DosyaId | findDosyaId() innerHTML→inline script geçişi için kaynak doğrulama |
| Pagination | detectPagination() regex'inin doğruluğu + navigasyon butonları |
| Modal | observeModal() class detection mantığı |
| Download | Endpoint routing + rate limiting bilgisi |
| Dosya Değişim | Multi-dosya context tracking davranış doğrulama |
