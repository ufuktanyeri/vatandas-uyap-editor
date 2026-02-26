/**
 * state.js - Uygulama durumu
 * Kaynak: v2/src/store/signals.ts (reactive olmayan vanilla JS versiyonu)
 *
 * Callback'ler: UI etkileşimi main.js tarafından onReset ile bağlanır.
 * State modülü hiçbir UI modülünü doğrudan çağırmaz.
 */

const AppState = {
  // Reset callback — main.js tarafından atanır
  onReset: null,

  // Taranan evraklar
  evraklar: [],

  // Seçili evrak ID'leri
  seciliEvrakIds: new Set(),

  // Dosya bilgileri (dosyaId, dosyaNo, yargiTuru)
  dosyaBilgileri: null,

  // İndirme durumu
  downloadStatus: 'idle', // idle | downloading | paused | completed | error

  // İstatistikler
  stats: {
    total: 0,
    completed: 0,
    failed: 0
  },

  // Session expired flag
  sessionExpired: false,

  // Pagination bilgisi
  pagination: null,

  // Kişi adı
  kisiAdi: '',

  // Ayarlar
  settings: { ...DEFAULT_SETTINGS },

  // İndirme modu
  useSimpleMode: false,  // true: window.downloadDoc(), false: fetch + magic bytes

  // Initialized flag
  initialized: false,

  // Tree data (nested structure)
  treeData: null,

  // Açık klasörler (Set of full paths)
  expandedFolders: new Set(),

  // Multi-dosya: aktif dosyada indirilen evrak ID'leri
  downloadedEvrakIds: new Set(),

  // Multi-dosya: oturum boyunca dosya gecmisi (dosyaId -> context)
  dosyaGecmisi: new Map(),

  // Multi-dosya: oturum geneli istatistikler
  oturumStats: {
    toplamIndirilen: 0,
    toplamBasarisiz: 0
  },

  // Evrakları klasörlere göre grupla
  getGroupedEvraklar() {
    const groups = new Map();

    for (const evrak of this.evraklar) {
      const folder = evrak.relativePath
        ? evrak.relativePath.split('/')[0]
        : 'Diğer';

      if (!groups.has(folder)) {
        groups.set(folder, []);
      }
      groups.get(folder).push(evrak);
    }

    return groups;
  },

  // Seçim yardımcıları
  toggleEvrakSecimi(evrakId) {
    if (this.seciliEvrakIds.has(evrakId)) {
      this.seciliEvrakIds.delete(evrakId);
    } else {
      this.seciliEvrakIds.add(evrakId);
    }
  },

  tumunuSec() {
    this.seciliEvrakIds = new Set(this.evraklar.map(e => e.evrakId));
  },

  secimiTemizle() {
    this.seciliEvrakIds = new Set();
  },

  klasorEvraklariniSec(klasorAdi) {
    const groups = this.getGroupedEvraklar();
    const evraklar = groups.get(klasorAdi) || [];
    for (const evrak of evraklar) {
      this.seciliEvrakIds.add(evrak.evrakId);
    }
  },

  klasorEvraklariniKaldir(klasorAdi) {
    const groups = this.getGroupedEvraklar();
    const evraklar = groups.get(klasorAdi) || [];
    for (const evrak of evraklar) {
      this.seciliEvrakIds.delete(evrak.evrakId);
    }
  },

  // Seçili evrakları al
  getSeciliEvraklar() {
    return this.evraklar.filter(e => this.seciliEvrakIds.has(e.evrakId));
  },

  /**
   * Klasör açık/kapalı state'ini toggle et
   */
  toggleFolderExpanded(fullPath) {
    if (this.expandedFolders.has(fullPath)) {
      this.expandedFolders.delete(fullPath);
    } else {
      this.expandedFolders.add(fullPath);
    }
  },

  /**
   * Tree'de belirli bir path'e sahip node'u bul
   */
  findNodeByPath(tree, fullPath) {
    function search(nodes) {
      for (const node of nodes) {
        if (node.fullPath === fullPath) return node;
        if (node.type === 'folder' && node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    return search(tree);
  },

  /**
   * Klasördeki tüm dosyaları seç (recursive)
   */
  selectAllInFolder(node) {
    const selectFiles = (n) => {
      if (n.type === 'file') {
        this.seciliEvrakIds.add(n.evrakId);
      } else if (n.children) {
        n.children.forEach(selectFiles);
      }
    };
    selectFiles(node);
  },

  /**
   * Klasördeki tüm dosya seçimini kaldır (recursive)
   */
  deselectAllInFolder(node) {
    const deselectFiles = (n) => {
      if (n.type === 'file') {
        this.seciliEvrakIds.delete(n.evrakId);
      } else if (n.children) {
        n.children.forEach(deselectFiles);
      }
    };
    deselectFiles(node);
  },

  /**
   * Klasördeki tüm dosyalar seçili mi kontrol et
   */
  isFolderFullySelected(node) {
    const checkAll = (n) => {
      if (n.type === 'file') {
        return this.seciliEvrakIds.has(n.evrakId);
      }
      if (n.children && n.children.length > 0) {
        return n.children.every(checkAll);
      }
      return true;
    };
    return checkAll(node);
  },

  /**
   * Klasördeki toplam dosya sayısı (recursive)
   */
  getFileCountInFolder(node) {
    let count = 0;
    const traverse = (n) => {
      if (n.type === 'file') {
        count++;
      } else if (n.children) {
        n.children.forEach(traverse);
      }
    };
    traverse(node);
    return count;
  },

  /**
   * Mevcut dosyanin indirme gecmisini kaydet.
   * Modal kapanmadan once cagirilir.
   */
  saveDosyaContext() {
    if (!this.dosyaBilgileri || !this.dosyaBilgileri.dosyaId) return;

    const dosyaId = this.dosyaBilgileri.dosyaId;
    const existing = this.dosyaGecmisi.get(dosyaId);

    const downloadedIds = existing
      ? new Set([...existing.downloadedEvrakIds, ...this.downloadedEvrakIds])
      : new Set(this.downloadedEvrakIds);

    const completedCount = existing
      ? existing.stats.completed + this.stats.completed
      : this.stats.completed;
    const failedCount = existing
      ? existing.stats.failed + this.stats.failed
      : this.stats.failed;

    this.dosyaGecmisi.set(dosyaId, {
      dosyaBilgileri: { ...this.dosyaBilgileri },
      downloadedEvrakIds: downloadedIds,
      stats: { total: this.evraklar.length, completed: completedCount, failed: failedCount },
      evrakSayisi: this.evraklar.length,
      yargiTuruAdi: YARGI_TURLERI[this.dosyaBilgileri.yargiTuru] || this.dosyaBilgileri.yargiTuru
    });

    this._recalcOturumStats();
    console.log(`[UYAP-EXT] Dosya context saved: ${dosyaId} (${downloadedIds.size} downloaded)`);
  },

  /**
   * Daha once taranan bir dosyanin indirme gecmisini restore et.
   * @returns {boolean} gecmis bulundu mu
   */
  restoreDosyaContext(dosyaId) {
    const gecmis = this.dosyaGecmisi.get(dosyaId);
    if (!gecmis) return false;

    this.downloadedEvrakIds = new Set(gecmis.downloadedEvrakIds);
    console.log(`[UYAP-EXT] Dosya context restored: ${dosyaId} (${this.downloadedEvrakIds.size} previously downloaded)`);
    return true;
  },

  /**
   * Belirli bir dosya icin gecmis dondur.
   */
  getDosyaGecmisi(dosyaId) {
    return this.dosyaGecmisi.get(dosyaId) || null;
  },

  /**
   * Herhangi bir dosyada bu evrak daha once indirilmis mi?
   */
  isEvrakDownloaded(evrakId) {
    if (this.downloadedEvrakIds.has(evrakId)) return true;
    for (const [, ctx] of this.dosyaGecmisi) {
      if (ctx.downloadedEvrakIds.has(evrakId)) return true;
    }
    return false;
  },

  /**
   * Oturum istatistiklerini dosyaGecmisi'nden yeniden hesapla.
   */
  _recalcOturumStats() {
    let toplamIndirilen = 0;
    let toplamBasarisiz = 0;
    for (const [, ctx] of this.dosyaGecmisi) {
      toplamIndirilen += ctx.stats.completed;
      toplamBasarisiz += ctx.stats.failed;
    }
    this.oturumStats.toplamIndirilen = toplamIndirilen;
    this.oturumStats.toplamBasarisiz = toplamBasarisiz;
  },

  /**
   * Oturum genelinde islenen dosya listesini dondur.
   */
  getOturumOzeti() {
    const dosyalar = [];
    for (const [dosyaId, ctx] of this.dosyaGecmisi) {
      dosyalar.push({
        dosyaId,
        dosyaNo: ctx.dosyaBilgileri.dosyaNo,
        yargiTuru: ctx.dosyaBilgileri.yargiTuru,
        yargiTuruAdi: ctx.yargiTuruAdi,
        evrakSayisi: ctx.evrakSayisi,
        indirilenSayisi: ctx.stats.completed,
        basarisizSayisi: ctx.stats.failed
      });
    }
    return {
      dosyalar,
      toplamIndirilen: this.oturumStats.toplamIndirilen,
      toplamBasarisiz: this.oturumStats.toplamBasarisiz
    };
  },

  /**
   * Aktif dosya state'ini temizle.
   * Dosya gecmisi ve oturum istatistikleri korunur.
   */
  resetActiveDosya() {
    this.evraklar = [];
    this.seciliEvrakIds = new Set();
    this.treeData = null;
    this.expandedFolders = new Set();
    this.dosyaBilgileri = null;
    this.downloadStatus = 'idle';
    this.stats = { total: 0, completed: 0, failed: 0 };
    this.sessionExpired = false;
    this.pagination = null;
    this.downloadedEvrakIds = new Set();
    this.initialized = false;

    if (this.onReset) this.onReset();

    console.log('[UYAP-EXT] Active dosya reset (history preserved)');
  },

  /**
   * Tam sifirlama — oturum sonu veya sayfa yenileme.
   * Dosya gecmisi dahil her sey temizlenir.
   */
  reset() {
    this.resetActiveDosya();
    this.dosyaGecmisi = new Map();
    this.oturumStats = { toplamIndirilen: 0, toplamBasarisiz: 0 };
    this.kisiAdi = '';

    console.log('[UYAP-EXT] Full state reset complete');
  }
};
