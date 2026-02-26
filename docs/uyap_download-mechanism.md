UYAP sayfasındaki indirme mekanizmasını analiz et. HİÇBİR DOM elemanını değiştirme, sadece oku ve raporla.

## 1. downloadDocCustom Fonksiyon Gövdesi

Konsolda çalıştır ve tam çıktıyı ver:
window.downloadDocCustom.toString()

## 2. İlgili Fonksiyon Zinciri

downloadDocCustom'ın çağırdığı tüm fonksiyonları takip et:

- downloadDocCustom içinde çağrılan fonksiyon adlarını bul
- Her birinin toString() çıktısını al
- Zincirin sonundaki HTTP isteğini (fetch/XMLHttpRequest/$.ajax/$.post/form submit/window.open) bul

## 3. İndirme Endpoint URL'si

- Gerçek indirme URL'si nedir? (download_document_brd.uyap mı başka bir şey mi?)
- URL nasıl oluşturuluyor? (string concatenation, template, config objesi?)
- HTTP method nedir? (GET/POST?)

## 4. Network Tab Doğrulama

Bir evrak üzerine çift tıkla ve Network tab'ında oluşan isteği yakala:

- Request URL (tam)
- Request Method
- Request Headers (özellikle Content-Type, Cookie header uzunluğu)
- Response Headers (Content-Type, Content-Disposition)
- Response boyutu

## 5. Diğer İndirme Fonksiyonları

Konsolda ara:

- typeof window.downloadView → varsa toString()
- typeof window.downloadFile → varsa toString()
- typeof window.openDoc → varsa toString()
- typeof window.viewDoc → varsa toString()

## ÇIKTI FORMATI

{
  "downloadDocCustom": {
    "fullBody": "(toString çıktısı)",
    "callsTo": ["fonksiyon adları"],
    "httpMethod": "GET veya POST",
    "endpointUrl": "tam URL pattern"
  },
  "functionChain": [
    { "name": "fonksiyon_adi", "body": "toString ilk 500 karakter" }
  ],
  "networkCapture": {
    "requestUrl": "",
    "method": "",
    "responseContentType": "",
    "responseSize": 0
  },
  "otherFunctions": {
    "downloadView": "exists/type/toString",
    "downloadFile": "exists/type/toString",
    "openDoc": "exists/type/toString",
    "viewDoc": "exists/type/toString"
  }
}
