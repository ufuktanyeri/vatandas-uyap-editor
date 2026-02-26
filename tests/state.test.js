import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  AppState.evraklar = [];
  AppState.seciliEvrakIds = new Set();
  AppState.dosyaBilgileri = null;
  AppState.downloadStatus = 'idle';
  AppState.stats = { total: 0, completed: 0, failed: 0 };
  AppState.sessionExpired = false;
  AppState.pagination = null;
  AppState.kisiAdi = '';
  AppState.initialized = false;
  AppState.treeData = null;
  AppState.expandedFolders = new Set();
  AppState.downloadedEvrakIds = new Set();
  AppState.dosyaGecmisi = new Map();
  AppState.oturumStats = { toplamIndirilen: 0, toplamBasarisiz: 0 };
  AppState.onReset = null;
});

describe('AppState selection helpers', () => {
  const mockEvraklar = [
    { evrakId: '1', name: 'A', relativePath: 'Folder1' },
    { evrakId: '2', name: 'B', relativePath: 'Folder1' },
    { evrakId: '3', name: 'C', relativePath: 'Folder2' },
  ];

  it('toggleEvrakSecimi adds and removes', () => {
    AppState.toggleEvrakSecimi('1');
    expect(AppState.seciliEvrakIds.has('1')).toBe(true);
    AppState.toggleEvrakSecimi('1');
    expect(AppState.seciliEvrakIds.has('1')).toBe(false);
  });

  it('tumunuSec selects all', () => {
    AppState.evraklar = mockEvraklar;
    AppState.tumunuSec();
    expect(AppState.seciliEvrakIds.size).toBe(3);
  });

  it('secimiTemizle clears all', () => {
    AppState.seciliEvrakIds = new Set(['1', '2', '3']);
    AppState.secimiTemizle();
    expect(AppState.seciliEvrakIds.size).toBe(0);
  });

  it('getSeciliEvraklar returns only selected', () => {
    AppState.evraklar = mockEvraklar;
    AppState.seciliEvrakIds = new Set(['1', '3']);
    const selected = AppState.getSeciliEvraklar();
    expect(selected).toHaveLength(2);
    expect(selected.map(e => e.evrakId)).toEqual(['1', '3']);
  });
});

describe('AppState folder operations', () => {
  it('toggleFolderExpanded adds and removes path', () => {
    AppState.toggleFolderExpanded('Folder1');
    expect(AppState.expandedFolders.has('Folder1')).toBe(true);
    AppState.toggleFolderExpanded('Folder1');
    expect(AppState.expandedFolders.has('Folder1')).toBe(false);
  });

  it('findNodeByPath locates nested node', () => {
    const tree = [
      {
        type: 'folder', fullPath: 'A', children: [
          { type: 'file', fullPath: 'A/file.pdf', evrakId: '1' }
        ]
      }
    ];
    expect(AppState.findNodeByPath(tree, 'A')).toBeTruthy();
    expect(AppState.findNodeByPath(tree, 'A/file.pdf')).toBeTruthy();
    expect(AppState.findNodeByPath(tree, 'X')).toBeNull();
  });

  it('selectAllInFolder and deselectAllInFolder work recursively', () => {
    const folder = {
      type: 'folder', children: [
        { type: 'file', evrakId: '10' },
        { type: 'file', evrakId: '20' },
        {
          type: 'folder', children: [
            { type: 'file', evrakId: '30' }
          ]
        }
      ]
    };

    AppState.selectAllInFolder(folder);
    expect(AppState.seciliEvrakIds.size).toBe(3);
    expect(AppState.seciliEvrakIds.has('30')).toBe(true);

    AppState.deselectAllInFolder(folder);
    expect(AppState.seciliEvrakIds.size).toBe(0);
  });

  it('isFolderFullySelected checks all descendants', () => {
    const folder = {
      type: 'folder', children: [
        { type: 'file', evrakId: '10' },
        { type: 'file', evrakId: '20' },
      ]
    };

    AppState.seciliEvrakIds = new Set(['10']);
    expect(AppState.isFolderFullySelected(folder)).toBe(false);

    AppState.seciliEvrakIds = new Set(['10', '20']);
    expect(AppState.isFolderFullySelected(folder)).toBe(true);
  });

  it('getFileCountInFolder counts all files recursively', () => {
    const folder = {
      type: 'folder', children: [
        { type: 'file', evrakId: '1' },
        {
          type: 'folder', children: [
            { type: 'file', evrakId: '2' },
            { type: 'file', evrakId: '3' },
          ]
        }
      ]
    };
    expect(AppState.getFileCountInFolder(folder)).toBe(3);
  });
});

describe('AppState multi-dosya context tracking', () => {
  it('saveDosyaContext stores current context', () => {
    AppState.dosyaBilgileri = { dosyaId: 'D1', dosyaNo: '2026/1', yargiTuru: '1' };
    AppState.evraklar = [{ evrakId: '10' }, { evrakId: '20' }];
    AppState.downloadedEvrakIds = new Set(['10']);
    AppState.stats = { total: 2, completed: 1, failed: 0 };

    AppState.saveDosyaContext();

    expect(AppState.dosyaGecmisi.has('D1')).toBe(true);
    const ctx = AppState.dosyaGecmisi.get('D1');
    expect(ctx.downloadedEvrakIds.has('10')).toBe(true);
    expect(ctx.stats.completed).toBe(1);
    expect(ctx.evrakSayisi).toBe(2);
  });

  it('saveDosyaContext accumulates on repeated saves', () => {
    AppState.dosyaBilgileri = { dosyaId: 'D1', dosyaNo: '2026/1', yargiTuru: '1' };
    AppState.evraklar = [{ evrakId: '10' }, { evrakId: '20' }];
    AppState.downloadedEvrakIds = new Set(['10']);
    AppState.stats = { total: 2, completed: 1, failed: 0 };
    AppState.saveDosyaContext();

    AppState.downloadedEvrakIds = new Set(['20']);
    AppState.stats = { total: 2, completed: 1, failed: 0 };
    AppState.saveDosyaContext();

    const ctx = AppState.dosyaGecmisi.get('D1');
    expect(ctx.downloadedEvrakIds.size).toBe(2);
    expect(ctx.stats.completed).toBe(2);
  });

  it('saveDosyaContext does nothing without dosyaBilgileri', () => {
    AppState.dosyaBilgileri = null;
    AppState.saveDosyaContext();
    expect(AppState.dosyaGecmisi.size).toBe(0);
  });

  it('restoreDosyaContext recovers downloaded IDs', () => {
    AppState.dosyaGecmisi.set('D1', {
      dosyaBilgileri: { dosyaId: 'D1', dosyaNo: '2026/1', yargiTuru: '1' },
      downloadedEvrakIds: new Set(['10', '20']),
      stats: { total: 2, completed: 2, failed: 0 },
      evrakSayisi: 2,
      yargiTuruAdi: 'Hukuk'
    });

    const restored = AppState.restoreDosyaContext('D1');
    expect(restored).toBe(true);
    expect(AppState.downloadedEvrakIds.size).toBe(2);
    expect(AppState.downloadedEvrakIds.has('10')).toBe(true);
  });

  it('restoreDosyaContext returns false for unknown dosya', () => {
    expect(AppState.restoreDosyaContext('UNKNOWN')).toBe(false);
  });

  it('getDosyaGecmisi returns null for unknown', () => {
    expect(AppState.getDosyaGecmisi('UNKNOWN')).toBeNull();
  });

  it('isEvrakDownloaded checks current and all history', () => {
    AppState.downloadedEvrakIds = new Set(['10']);
    expect(AppState.isEvrakDownloaded('10')).toBe(true);

    AppState.dosyaGecmisi.set('D2', {
      downloadedEvrakIds: new Set(['50']),
      dosyaBilgileri: {}, stats: {}, evrakSayisi: 0, yargiTuruAdi: ''
    });
    expect(AppState.isEvrakDownloaded('50')).toBe(true);
    expect(AppState.isEvrakDownloaded('99')).toBe(false);
  });

  it('_recalcOturumStats aggregates all dosya stats', () => {
    AppState.dosyaGecmisi.set('D1', {
      downloadedEvrakIds: new Set(), dosyaBilgileri: {},
      stats: { completed: 5, failed: 1 }, evrakSayisi: 6, yargiTuruAdi: ''
    });
    AppState.dosyaGecmisi.set('D2', {
      downloadedEvrakIds: new Set(), dosyaBilgileri: {},
      stats: { completed: 3, failed: 2 }, evrakSayisi: 5, yargiTuruAdi: ''
    });

    AppState._recalcOturumStats();
    expect(AppState.oturumStats.toplamIndirilen).toBe(8);
    expect(AppState.oturumStats.toplamBasarisiz).toBe(3);
  });

  it('getOturumOzeti returns structured summary', () => {
    AppState.dosyaGecmisi.set('D1', {
      dosyaBilgileri: { dosyaId: 'D1', dosyaNo: '2026/1', yargiTuru: '1' },
      downloadedEvrakIds: new Set(['10']),
      stats: { total: 2, completed: 1, failed: 1 },
      evrakSayisi: 2,
      yargiTuruAdi: 'Hukuk'
    });
    AppState.oturumStats = { toplamIndirilen: 1, toplamBasarisiz: 1 };

    const ozet = AppState.getOturumOzeti();
    expect(ozet.dosyalar).toHaveLength(1);
    expect(ozet.dosyalar[0].dosyaNo).toBe('2026/1');
    expect(ozet.dosyalar[0].yargiTuruAdi).toBe('Hukuk');
    expect(ozet.toplamIndirilen).toBe(1);
    expect(ozet.toplamBasarisiz).toBe(1);
  });
});

describe('AppState reset methods', () => {
  it('resetActiveDosya preserves history', () => {
    AppState.dosyaGecmisi.set('D1', {
      downloadedEvrakIds: new Set(['10']),
      dosyaBilgileri: {}, stats: { completed: 1, failed: 0 }, evrakSayisi: 1, yargiTuruAdi: ''
    });
    AppState.oturumStats = { toplamIndirilen: 1, toplamBasarisiz: 0 };
    AppState.kisiAdi = 'TestUser';
    AppState.evraklar = [{ evrakId: '99' }];
    AppState.seciliEvrakIds = new Set(['99']);

    AppState.resetActiveDosya();

    expect(AppState.evraklar).toEqual([]);
    expect(AppState.seciliEvrakIds.size).toBe(0);
    expect(AppState.dosyaGecmisi.size).toBe(1);
    expect(AppState.oturumStats.toplamIndirilen).toBe(1);
    expect(AppState.kisiAdi).toBe('TestUser');
  });

  it('reset clears everything including history', () => {
    AppState.dosyaGecmisi.set('D1', {
      downloadedEvrakIds: new Set(), dosyaBilgileri: {},
      stats: {}, evrakSayisi: 0, yargiTuruAdi: ''
    });
    AppState.oturumStats = { toplamIndirilen: 5, toplamBasarisiz: 1 };
    AppState.kisiAdi = 'TestUser';

    AppState.reset();

    expect(AppState.dosyaGecmisi.size).toBe(0);
    expect(AppState.oturumStats.toplamIndirilen).toBe(0);
    expect(AppState.kisiAdi).toBe('');
  });

  it('resetActiveDosya calls onReset callback', () => {
    let called = false;
    AppState.onReset = () => { called = true; };
    AppState.resetActiveDosya();
    expect(called).toBe(true);
  });

  it('reset calls onReset callback via resetActiveDosya', () => {
    let callCount = 0;
    AppState.onReset = () => { callCount++; };
    AppState.reset();
    expect(callCount).toBe(1);
  });
});
