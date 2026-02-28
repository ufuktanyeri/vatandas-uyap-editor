# Oturum Başlatma ve Sonlandırma Prompt'ları

Bu dosya, Cursor'da yeni bir chat oturumu açarken ve kapatırken kullanılacak prompt'ları içerir. Amaç: AI'ın proje bağlamını hızlıca yakalaması ve oturum sonunda güncel durumu kaydetmesi.

---

## Oturum Başlatma Prompt'u

Aşağıdaki prompt'u yeni bir Cursor chat oturumu başlattığında ilk mesaj olarak gönder:

```
Proje: UYAP Evrak İndirici Chrome Extension.

Bağlamı yükle:
1. `.cursor/rules/project-context.mdc` dosyasını oku — mevcut durum, tamamlanan çalışmalar, bekleyen görevler
2. `docs/todo-by-prompt.md` dosyasını oku — detaylı görev listesi ve durum tablosu
3. `CLAUDE.md` dosyasını oku — proje mimarisi ve teknik kısıtlar
4. `git log --oneline -10` çalıştır — son commit'leri gör
5. `git status` çalıştır — bekleyen değişiklikleri kontrol et

Bağlamı yükledikten sonra kısaca özetle:
- Son yapılan iş
- Bekleyen en öncelikli 3 görev
- Varsa bekleyen uncommitted değişiklikler
```

---

## Oturum Sonlandırma Prompt'u

Aşağıdaki prompt'u oturumu kapatmadan önce son mesaj olarak gönder:

```
Oturumu kapat:
1. Bugünkü yazışma transkriptini çıkar ve `session-transcript-YYYY-MM-DD-X.md` olarak kaydet (X: a,b,c... sıralı)
2. `docs/todo-by-prompt.md` dosyasını güncelle — tamamlanan görevleri işaretle, yeni görevleri ekle
3. `.cursor/rules/project-context.mdc` dosyasını güncelle — son commit, tamamlanan çalışmalar, bekleyen görevler
4. Uncommitted değişiklik varsa commit ve push yap
5. Güncel durumu kısaca özetle
```

---

## Notlar

- Transkript dosyaları proje kök dizininde tutulur: `session-transcript-YYYY-MM-DD-X.md`
- Bağlam dosyası `.cursor/rules/project-context.mdc` — Cursor tarafından her oturumda otomatik yüklenir (alwaysApply: true)
- Görev detayları `docs/todo-by-prompt.md` — her görev için adım adım prompt içerir
- Proje mimarisi `CLAUDE.md` — nadiren değişir, her oturumda okunmalı