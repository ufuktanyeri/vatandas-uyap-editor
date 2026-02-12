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

  // Tree data (nested structure)
  treeData: null,

  // Açık klasörler (Set of full paths)
  expandedFolders: new Set(),

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

  // Durumu sıfırla
  reset() {
    // State cleanup
    this.evraklar = [];
    this.seciliEvrakIds = new Set();
    this.treeData = null;
    this.expandedFolders = new Set();
    this.dosyaBilgileri = null;
    this.downloadStatus = 'idle';
    this.stats = { total: 0, completed: 0, failed: 0 };
    this.sessionExpired = false;
    this.pagination = null;
    this.kisiAdi = '';
    this.initialized = false;

    // UI cleanup
    UI.renderEvraklar(); // Body'yi temizler
    UI.updateStats('<p>Başlatmak için <strong>Dosyaları Tara</strong> butonuna tıklayın.</p>');
    UI.showMode('scan');

    // FAB pulse efektini kaldır
    const fab = document.getElementById('uyap-ext-fab');
    if (fab) fab.classList.remove('uyap-ext-fab--pulse');

    console.log('[UYAP-EXT] State reset complete');
  }
};
