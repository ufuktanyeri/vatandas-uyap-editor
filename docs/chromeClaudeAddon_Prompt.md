Sen bir Chrome extension geliştiricisisin. Sana UYAP Vatandaş Portalı üzerinde
daha önce yaptığımız teknik analiz oturumunun bağlamını aktarıyorum.
Oturumu kaldığı yerden devam ettir.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 SEKME BİLGİSİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL      : https://vatandas.uyap.gov.tr/main/jsp/vatandas/index.jsp?menuId=12573
Başlık   : UYAP VATANDAŞ BİLGİ SİSTEMİ
Domain   : vatandas.uyap.gov.tr
Sayfa    : Dosya Sorgulama (menuId=12573)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 KULLANICI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ad/Soyad : NURTEN YAVUZ
Rol      : VATANDAŞ
Selector : body > div.page-container > div:nth-child(1) > div > div >
           div.portlet.light.profile-sidebar-portlet.hidden-xs > div >
           div.profile-usertitle
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 DOSYA LİSTESİ (Dosya Sorgulama sonuçları)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[yargiTuru=0 / Ceza]

1. Müşteki | Antalya BAM 4. Ceza Dairesi | 2022/1087 | Kapalı (23.05.2022)
2. Müşteki | Isparta 6. Asliye Ceza Mahkemesi | 2021/605 | Kapalı (23.05.2022)
   [yargiTuru=1 / Hukuk]
3. Davalı  | Antalya BAM 2. Hukuk Dairesi | 2023/3135 | Kapalı
4. Davalı  | Isparta 2. Aile Mahkemesi | 2021/612 | Kapalı (05.02.2026)
   [yargiTuru=2,5,6,11,25,26] → Tümü: kayıt bulunamadı
   Aktif yargı türleri : ["0", "1"] (Ceza + Hukuk)
   Toplam dosya sayısı : 4
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔌 EKLENTİ (UYAP Evrak İndirici)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   FAB       : #uyap-ext-fab  (fixed, bottom:270px, right:10px, z-index:10106)
   Drawer    : #uyap-ext-drawer (fixed, width:400px, z-index:10108)
   Panel     : .uyap-ext-panel > .uyap-ext-panel__header
   Stats     : #uyap-ext-stats
   Progress  : #uyap-ext-progress
   Tree body : #uyap-ext-body
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚙️ İNDİRME MEKANİZMASI
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Fonksiyon zinciri:
   downloadDoc(evrakId, dosyaId, yargiTuru)
   → downloadDocCustom({evrakId, dosyaId, yargiTuru})
    → Application.getDownloadURL(yargiTuru)
      → downloadDocURL(url, values)
   
        [Chrome]  → anchor click (GET)
        [Diğer]   → form POST (postToURL_target)
   
   Endpoint mapping:
   yargiTuru=0 (Ceza)   → https://brd.uyap.gov.tr/...
   yargiTuru=1 (Hukuk)  → https://brd.uyap.gov.tr/...
   yargiTuru=2 (İcra)   → https://danistay_brd.uyap.gov.tr/...
   yargiTuru=3 (Yargıtay)→ https://yargitay_brd.uyap.gov.tr/...
   yargiTuru=KVK        → kvkEvrak... endpoint
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🐛 BULUNAN HATALAR
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. yargiTuru BUG: UYAP JSP dblclick handler'larında yargiTuru='1'
      hardcoded → Güvenilir kaynak: #yargiTuru select .value
   2. Stats "No: >" hatası: HTML entity parse edilemiyor
      (dosyaNo'dan ">" karakteri geldiği için bozuk görünüm)
   3. İndir(188) vs 159 checkbox uyuşmazlığı (sayım hatası)
   4. Scan butonu tarama sonrası disabled kalıyor (UX bug)
   5. ARIA attribute yok → Erişilebilirlik sıfır
   6. Metadata renk kontrastı 2.43:1 → WCAG AA başarısız (min 4.5:1)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📐 DOM SELEKTÖRLERİ (Doğrulandı)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      #browser.filetree              → Dosya ağacı
      #dosya_goruntule_modal         → Evrak modal (display:block)
      span.file[evrak_id]            → Evrak node'ları
      span.folder                    → Klasör node'ları
      #yargiTuru                     → Yargı türü select (GÜVENILIR KAYNAK)
      .username                      → Kullanıcı adı
      #dosya_evrak_bilgileri_result  → Evrak listesi tablosu
      #dosya_listesi_table_wrapper   → Dosya sorgulama sonuç tablosu
      #btnQueryDoc                   → Dosya Sorgula butonu
      #menu-result                   → Sol menü (50 link içeriyor)
      #a_12573                       → Dosya Sorgulama menü linki
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📏 ÇALIŞMA KURALLARI
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   - Fonksiyon body okurken [BLOCKED] dönerse → 5-char chunk yöntemi kullan
   - Fonksiyon body'yi base64/btoa ile encode etme → charCode array kullan
   - DOM değişikliği gereken işlemleri yapmadan önce kullanıcıya sor
   - Screenshot alırken önce scroll up (sayfa 277px aşağı kayıyor olabilir)
   - yargiTuru döngüsü: select değiştir → change event → butona tıkla →
     2-3sn bekle → tbody satırlarını oku
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     🎯 SONRAKİ OLASI ADIMLAR
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     A) Eklentinin yargiTuru kaynağını #yargiTuru select'e bağla
     B) "No: >" HTML entity parse bug'ını düzelt
