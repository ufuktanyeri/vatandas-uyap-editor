/**
 * state.js - Uygulama durumu (AppStateManager class)
 *
 * Private alanlar UYAP sayfasının extension state'ine erişimini engeller.
 * Public API getter/setter'lar ile kontrollü erişim sağlar.
 * Callback: main.js onReset ile UI bağlar; state modülü UI çağırmaz.
 */

class AppStateManager {
  #evraklar = [];
  #seciliEvrakIds = new Set();
  #treeData = null;
  #expandedFolders = new Set();
  #dosyaBilgileri = null;
  #downloadStatus = 'idle';
  #stats = { total: 0, completed: 0, failed: 0 };
  #sessionExpired = false;
  #pagination = null;
  #kisiAdi = '';
  #settings = { ...DEFAULT_SETTINGS };
  #useSimpleMode = false;
  #initialized = false;
  #downloadedEvrakIds = new Set();
  #dosyaGecmisi = new Map();
  #oturumStats = { toplamIndirilen: 0, toplamBasarisiz: 0 };

  onReset = null;

  // --- Property access ---

  get evraklar() { return this.#evraklar; }
  set evraklar(v) { this.#evraklar = v; }

  get seciliEvrakIds() { return this.#seciliEvrakIds; }
  set seciliEvrakIds(v) { this.#seciliEvrakIds = v; }

  get treeData() { return this.#treeData; }
  set treeData(v) { this.#treeData = v; }

  get expandedFolders() { return this.#expandedFolders; }
  set expandedFolders(v) { this.#expandedFolders = v; }

  get dosyaBilgileri() { return this.#dosyaBilgileri; }
  set dosyaBilgileri(v) { this.#dosyaBilgileri = v; }

  get downloadStatus() { return this.#downloadStatus; }
  set downloadStatus(v) { this.#downloadStatus = v; }

  get stats() { return this.#stats; }
  set stats(v) { this.#stats = v; }

  get sessionExpired() { return this.#sessionExpired; }
  set sessionExpired(v) { this.#sessionExpired = v; }

  get pagination() { return this.#pagination; }
  set pagination(v) { this.#pagination = v; }

  get kisiAdi() { return this.#kisiAdi; }
  set kisiAdi(v) { this.#kisiAdi = v; }

  get settings() { return this.#settings; }
  set settings(v) { this.#settings = v; }

  get useSimpleMode() { return this.#useSimpleMode; }
  set useSimpleMode(v) { this.#useSimpleMode = v; }

  get initialized() { return this.#initialized; }
  set initialized(v) { this.#initialized = v; }

  get downloadedEvrakIds() { return this.#downloadedEvrakIds; }
  set downloadedEvrakIds(v) { this.#downloadedEvrakIds = v; }

  get dosyaGecmisi() { return this.#dosyaGecmisi; }
  set dosyaGecmisi(v) { this.#dosyaGecmisi = v; }

  get oturumStats() { return this.#oturumStats; }
  set oturumStats(v) { this.#oturumStats = v; }

  // --- Selection ---

  toggleEvrakSecimi(evrakId) {
    if (this.#seciliEvrakIds.has(evrakId)) {
      this.#seciliEvrakIds.delete(evrakId);
    } else {
      this.#seciliEvrakIds.add(evrakId);
    }
  }

  tumunuSec() {
    this.#seciliEvrakIds = new Set(this.#evraklar.map(e => e.evrakId));
  }

  secimiTemizle() {
    this.#seciliEvrakIds = new Set();
  }

  getSeciliEvraklar() {
    return this.#evraklar.filter(e => this.#seciliEvrakIds.has(e.evrakId));
  }

  // --- Tree ---

  toggleFolderExpanded(fullPath) {
    if (this.#expandedFolders.has(fullPath)) {
      this.#expandedFolders.delete(fullPath);
    } else {
      this.#expandedFolders.add(fullPath);
    }
  }

  findNodeByPath(tree, fullPath) {
    for (const node of tree) {
      if (node.fullPath === fullPath) return node;
      if (node.type === 'folder' && node.children) {
        const found = this.findNodeByPath(node.children, fullPath);
        if (found) return found;
      }
    }
    return null;
  }

  selectAllInFolder(node) {
    if (node.type === 'file') {
      this.#seciliEvrakIds.add(node.evrakId);
    } else if (node.children) {
      node.children.forEach(n => this.selectAllInFolder(n));
    }
  }

  deselectAllInFolder(node) {
    if (node.type === 'file') {
      this.#seciliEvrakIds.delete(node.evrakId);
    } else if (node.children) {
      node.children.forEach(n => this.deselectAllInFolder(n));
    }
  }

  isFolderFullySelected(node) {
    if (node.type === 'file') return this.#seciliEvrakIds.has(node.evrakId);
    if (node.children && node.children.length > 0) {
      return node.children.every(n => this.isFolderFullySelected(n));
    }
    return true;
  }

  getFileCountInFolder(node) {
    if (node.type === 'file') return 1;
    if (!node.children) return 0;
    return node.children.reduce((sum, n) => sum + this.getFileCountInFolder(n), 0);
  }

  // --- Multi-dosya ---

  saveDosyaContext() {
    if (!this.#dosyaBilgileri?.dosyaId) return;

    const dosyaId = this.#dosyaBilgileri.dosyaId;
    const existing = this.#dosyaGecmisi.get(dosyaId);

    const downloadedIds = existing
      ? new Set([...existing.downloadedEvrakIds, ...this.#downloadedEvrakIds])
      : new Set(this.#downloadedEvrakIds);

    const completedCount = existing
      ? existing.stats.completed + this.#stats.completed
      : this.#stats.completed;
    const failedCount = existing
      ? existing.stats.failed + this.#stats.failed
      : this.#stats.failed;

    this.#dosyaGecmisi.set(dosyaId, {
      dosyaBilgileri: { ...this.#dosyaBilgileri },
      downloadedEvrakIds: downloadedIds,
      stats: { total: this.#evraklar.length, completed: completedCount, failed: failedCount },
      evrakSayisi: this.#evraklar.length,
      yargiTuruAdi: YARGI_TURLERI[this.#dosyaBilgileri.yargiTuru] || this.#dosyaBilgileri.yargiTuru
    });

    this.#recalcOturumStats();
    console.log(`[UYAP-EXT] Dosya context saved: ${dosyaId} (${downloadedIds.size} downloaded)`);
  }

  restoreDosyaContext(dosyaId) {
    const gecmis = this.#dosyaGecmisi.get(dosyaId);
    if (!gecmis) return false;

    this.#downloadedEvrakIds = new Set(gecmis.downloadedEvrakIds);
    console.log(`[UYAP-EXT] Dosya context restored: ${dosyaId} (${this.#downloadedEvrakIds.size} previously downloaded)`);
    return true;
  }

  getDosyaGecmisi(dosyaId) {
    return this.#dosyaGecmisi.get(dosyaId) || null;
  }

  isEvrakDownloaded(evrakId) {
    if (this.#downloadedEvrakIds.has(evrakId)) return true;
    for (const [, ctx] of this.#dosyaGecmisi) {
      if (ctx.downloadedEvrakIds.has(evrakId)) return true;
    }
    return false;
  }

  #recalcOturumStats() {
    let toplamIndirilen = 0;
    let toplamBasarisiz = 0;
    for (const [, ctx] of this.#dosyaGecmisi) {
      toplamIndirilen += ctx.stats.completed;
      toplamBasarisiz += ctx.stats.failed;
    }
    this.#oturumStats.toplamIndirilen = toplamIndirilen;
    this.#oturumStats.toplamBasarisiz = toplamBasarisiz;
  }

  getOturumOzeti() {
    const dosyalar = [];
    for (const [dosyaId, ctx] of this.#dosyaGecmisi) {
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
      toplamIndirilen: this.#oturumStats.toplamIndirilen,
      toplamBasarisiz: this.#oturumStats.toplamBasarisiz
    };
  }

  // --- Reset ---

  resetActiveDosya() {
    this.#evraklar = [];
    this.#seciliEvrakIds = new Set();
    this.#treeData = null;
    this.#expandedFolders = new Set();
    this.#dosyaBilgileri = null;
    this.#downloadStatus = 'idle';
    this.#stats = { total: 0, completed: 0, failed: 0 };
    this.#sessionExpired = false;
    this.#pagination = null;
    this.#downloadedEvrakIds = new Set();
    this.#initialized = false;

    if (this.onReset) this.onReset();
    console.log('[UYAP-EXT] Active dosya reset (history preserved)');
  }

  reset() {
    this.resetActiveDosya();
    this.#dosyaGecmisi = new Map();
    this.#oturumStats = { toplamIndirilen: 0, toplamBasarisiz: 0 };
    this.#kisiAdi = '';
    console.log('[UYAP-EXT] Full state reset complete');
  }
}

const AppState = new AppStateManager();
