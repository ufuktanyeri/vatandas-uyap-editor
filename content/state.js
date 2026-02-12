/**
 * state.js - Uygulama durumu
 * Kaynak: v2/src/store/signals.ts (reactive olmayan vanilla JS versiyonu)
 */

const AppState = {
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

  // Durumu sıfırla
  reset() {
    this.evraklar = [];
    this.seciliEvrakIds = new Set();
    this.dosyaBilgileri = null;
    this.downloadStatus = 'idle';
    this.stats = { total: 0, completed: 0, failed: 0 };
    this.sessionExpired = false;
    this.pagination = null;
    this.kisiAdi = '';
    this.initialized = false;
  }
};
