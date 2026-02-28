---

# UYAP Evrak Görüntüleme ve İndirme Mekanizması Teknik Analizi

Bu doküman, UYAP Vatandaş Portal üzerindeki evrak yönetim sisteminin; DOM yapısını, JavaScript fonksiyonlarını, olay (event) dinleyicilerini ve ağ (network) isteklerini kapsayan detaylı teknik analizidir.

---

## 1. Tetikleme Mekanizmaları ve Event Yönetimi

Kullanıcı etkileşimleri ve bunların arka planda tetiklediği fonksiyonlar şunlardır:

### A. Sağ Tık Menüsü (Context Menu)

Evrak dosyasına sağ tıklandığında özel bir menü açılır.

* **Yöneten Fonksiyon:** `evrakSolClickMenu(deger='solMenuAktif')`

* **Kütüphane:** jQuery ContextMenu

* **Kod Yapısı:**
  
  ```javascript
  function evrakSolClickMenu(deger='solMenuAktif') {
    $('.file').contextMenu('1', 809317530, _cmenu, {theme:'vista'})
  }
  ```

* **Menü İçeriği (`_cmenu`):**
  
  ```javascript
  _cmenu = [
    { "Görüntüle": {} },
    "context-menu-separator",
    { "Kaydet": {} }
  ]
  ```

* **Tetiklenme:** Menü öğesine tıklandığında `o.onclick.call(cmenu.target, this, cmenu, e)` çağrılır.

### B. Çift Tıklama (Double Click)

* **Davranış:** Görünür bir aksiyon yokmuş gibi dursa da indirme işlemini tetikler.

* **Handler:**
  
  ```javascript
  function() {
    // Doğrudan indirme fonksiyonunu çağırır
    downloadDoc($(this).attr('evrak_id'), '809317530', '1');
  }
  ```

### C. Tek Tıklama (Left Click)

* **Davranış:** Evrak metadata bilgilerini içeren bir popup açar.

* **Handler:**
  
  ```javascript
  function(e) {
    cmenu.onizle(yargiTuru, dosyaid, this, e);
    return false;
  }
  ```

* **Detay:** İçerik render edilmiş HTML/PDF değil, sadece metadata bilgisidir. `onizleiframe` elementi kullanılır.

---

## 2. DOM Yapısı ve Element Analizi

Sistemin görsel arayüzü ve veriyi tuttuğu HTML yapısı:

### Evrak Ağacı (`#browser`)

Evraklar hiyerarşik bir liste (treeview) içinde sunulur.

```html
<ul id="browser" class="filetree treeview-gray treeview">
  <!-- Klasör Yapısı -->
  <li class="expandable">
    <div class="hitarea"></div>
    <span class="folder">Klasör Adı</span>
    <ul>
      <!-- Evrak Elementi -->
      <li data-sid="Evrak Adı">
        <span class="file" 
              evrak_id="9876916705" 
              ce="V"
              data-placement="auto"
              data-html="true"
              data-original-title="[Metadata JSON/HTML]">
          Müdahale Talep Dilekçesi 10/01/2024
        </span>
      </li>
    </ul>
  </li>
</ul>
```

### Kritik DOM Elementleri ve Attribute'lar

1. **`span.file`**: Her bir evrakı temsil eden ana element.
2. **`evrak_id`**: Evrakın benzersiz kimliği (Örn: `9876916705`).
3. **`ce`**: Dosya durumu (Örn: `"V"` = Viewable/Görüntülenebilir).
4. **`data-original-title`**: Evrak metadatasını tutar.
5. **`#evrakViewContent`**: Bu ID fiziksel olarak yok, bunun yerine `dosya_evrak_bilgileri_tab` ve `dosya_evrak_bilgileri_result` alanları kullanılıyor.

---

## 3. JavaScript Fonksiyonları ve Parametreler

Sistemde kullanılan ana fonksiyonlar ve global değişkenler:

### Global Değişkenler

* `dosyaId`: (Örn: `809317530`) Dosya/Dava bazında sabittir.
* `yargiTuru`: (Örn: `1`) Mahkeme türünü belirtir.

### Görüntüleme Fonksiyonları

* `viewDocSelf(evrakId, dosyaId)`: Aynı pencerede açar.
* `viewDocTarget(evrakId, dosyaId)`: **(Aktif Kullanılan)** Yeni sekmede açar.
* `viewDocCustomSelf(...)` ve `viewDocCustomTarget(...)`: Parametre objesi alan özelleştirilmiş versiyonlar.

### İndirme Fonksiyonları

* `downloadDoc(evrakId, dosyaId, yargiTuru)`: Standart indirme.
* `downloadDocCustom({evrakId, dosyaId, yargiTuru})`: Parametre objesi ile indirme.

---

## 4. URL ve İstek Yapısı (Network)

Evrak erişimi için kullanılan endpoint'ler:

### Görüntüleme URL'si

Dosyalar UDF formatında saklanır ancak bu URL üzerinden PDF olarak sunulur.

```
https://vatandas.uyap.gov.tr/main/jsp/view_document_brd.uyap?
  mimeType=Pdf
  &evrakId=9876916705
  &dosyaId=809317530
  &yargiTuru=1
```

### İndirme URL'si

```
https://vatandas.uyap.gov.tr/main/jsp/download_document.uyap?
  evrakId=9876916705
  &dosyaId=809317530
  &yargiTuru=1
```

---

## 5. Evrak Metadata Yapısı

Her evrakın `data-original-title` attribute'u içinde HTML formatında şu bilgiler bulunur:

* Birim Evrak No
* Evrakın Onaylandığı Tarih
* Gönderen Yer/Kişi
* Gönderen Dosya No (Orijinal dosya adı burada yazar)
* Sisteme Gönderildiği Tarih
* Açıklama
* Türü ve Tipi

---

## 6. Extension (Eklenti) İçin Mimari Önerisi

Chrome eklentisi geliştirilirken izlenmesi gereken yol haritası ve kod mantığı:

### A. Veri Toplama (Scanning)

Sayfadaki evrakları ve klasör yapısını taramak için:

```javascript
// 1. Evrak ağacını tara
const evraklar = document.querySelectorAll('#browser .file');

evraklar.forEach(evrak => {
  const evrakId = evrak.getAttribute('evrak_id');
  const dosyaId = window.dosyaId; // Globalden al
  const yargiTuru = window.yargiTuru; // Globalden al

  // Klasör yolunu bulmak için parent analizi
  let folderPath = [];
  let parent = evrak.closest('li');
  while (parent && parent.id !== 'browser') {
     // Parent li'lerin span textlerini topla
     // ...
  }
});
```

### B. Kaydetme Yöntemleri

1. **ZIP Paketi (Önerilen):** `JSZip` kütüphanesi ile dosyalar bellekte klasörlenip tek seferde indirilir. İzin gerektirmez, temizdir.
2. **File System Access API:** Kullanıcıdan klasör izni alarak dosyaları tek tek diske yazar. Çok sayıda dosya için kullanıcıyı yorabilir.
3. **Hibrit:** Dosya sayısı az ise API, çok ise ZIP.

### C. Önerilen Klasör Yapısı

İndirilen dosyalar şu hiyerarşi ile saklanmalıdır:

```
[Dosya_No]_[Mahkeme_Adi]/
├── [Tarih]-[Evrak_Turu]/
│   └── [Orijinal_Dosya_Adi].pdf
├── Müdahale_Talep_Dilekçesi/
│   └── Müdahale.pdf
└── metadata.json (Tüm evrak detayları)
```

### D. Kritik Uyarılar

1. **Session Bağımlılığı:** İndirme istekleri (fetch) mutlaka extension'ın content script'i veya aynı session'ı paylaşan background script üzerinden yapılmalıdır.
2. **Rate Limiting:** Sunucu ardışık istekleri engelleyebilir. İstekler arasına `setTimeout` veya `sleep` eklenmelidir.
3. **Görünmez Elementler:** `#evrakViewContent` DOM'da yoktur, veriyi `#browser` üzerinden çekmek şarttır.
4. **Format:** UDF dosyalar `mimeType=Pdf` ile dönüştürülerek çekilmelidir.
