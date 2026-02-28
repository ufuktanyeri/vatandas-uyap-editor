import { describe, it, expect } from 'vitest';

describe('Scanner.parseTooltip', () => {
  it('parses div-based tooltips', () => {
    const tooltip = '<div>Birim Evrak No: 7319</div><div>Onay Tarihi: 06/02/2026</div>';
    const result = Scanner.parseTooltip(tooltip);
    expect(result).toEqual({
      'Birim Evrak No': '7319',
      'Onay Tarihi': '06/02/2026'
    });
  });

  it('parses br-based tooltips', () => {
    const tooltip = 'Türü: Dilekçe<br>Evrakın Onaylandığı Tarih: 15/01/2026';
    const result = Scanner.parseTooltip(tooltip);
    expect(result).toEqual({
      'Türü': 'Dilekçe',
      'Evrakın Onaylandığı Tarih': '15/01/2026'
    });
  });

  it('parses mixed format tooltips', () => {
    const tooltip = '<div>Evrak Türü: Karar</div>Tarih: 20/03/2026<br>Kayıt No: 123';
    const result = Scanner.parseTooltip(tooltip);
    expect(result).toEqual({
      'Evrak Türü': 'Karar',
      'Tarih': '20/03/2026',
      'Kayıt No': '123'
    });
  });

  it('returns empty object for null/empty input', () => {
    expect(Scanner.parseTooltip(null)).toEqual({});
    expect(Scanner.parseTooltip('')).toEqual({});
    expect(Scanner.parseTooltip(undefined)).toEqual({});
  });

  it('strips nested HTML tags from values', () => {
    const tooltip = '<div>Tür: <b>Dilekçe</b></div>';
    const result = Scanner.parseTooltip(tooltip);
    expect(result['Tür']).toBe('Dilekçe');
  });

  it('ignores lines without colon', () => {
    const tooltip = '<div>No colon here</div><div>Key: Value</div>';
    const result = Scanner.parseTooltip(tooltip);
    expect(Object.keys(result)).toEqual(['Key']);
  });

  it('handles colon in value (not just key)', () => {
    const tooltip = '<div>Not: Bu belge saat 14:30 itibariyle geçerlidir</div>';
    const result = Scanner.parseTooltip(tooltip);
    expect(result['Not']).toBe('Bu belge saat 14:30 itibariyle geçerlidir');
  });
});

describe('Scanner.buildTreeFromFlat', () => {
  it('builds single-level tree (root files)', () => {
    const flatList = [
      { evrakId: '1', name: 'Belge A', relativePath: '' },
      { evrakId: '2', name: 'Belge B', relativePath: '' },
    ];
    const tree = Scanner.buildTreeFromFlat(flatList);
    expect(tree).toHaveLength(2);
    expect(tree.every(n => n.type === 'file')).toBe(true);
  });

  it('creates folder nodes from paths', () => {
    const flatList = [
      { evrakId: '1', name: 'Karar.pdf', relativePath: 'Kararlar', evrakTuru: '', evrakTarihi: '' },
    ];
    const tree = Scanner.buildTreeFromFlat(flatList);
    expect(tree).toHaveLength(1);
    expect(tree[0].type).toBe('folder');
    expect(tree[0].name).toBe('Kararlar');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].type).toBe('file');
    expect(tree[0].children[0].evrakId).toBe('1');
  });

  it('handles nested folder paths', () => {
    const flatList = [
      { evrakId: '1', name: 'Doc.pdf', relativePath: 'A/B/C', evrakTuru: '', evrakTarihi: '' },
    ];
    const tree = Scanner.buildTreeFromFlat(flatList);
    expect(tree[0].type).toBe('folder');
    expect(tree[0].name).toBe('A');
    expect(tree[0].children[0].type).toBe('folder');
    expect(tree[0].children[0].name).toBe('B');
    expect(tree[0].children[0].children[0].type).toBe('folder');
    expect(tree[0].children[0].children[0].name).toBe('C');
    expect(tree[0].children[0].children[0].children[0].type).toBe('file');
  });

  it('deduplicates folders with same path', () => {
    const flatList = [
      { evrakId: '1', name: 'A.pdf', relativePath: 'Folder1', evrakTuru: '', evrakTarihi: '' },
      { evrakId: '2', name: 'B.pdf', relativePath: 'Folder1', evrakTuru: '', evrakTarihi: '' },
    ];
    const tree = Scanner.buildTreeFromFlat(flatList);
    expect(tree).toHaveLength(1);
    expect(tree[0].type).toBe('folder');
    expect(tree[0].children).toHaveLength(2);
  });

  it('prevents file name collision via evrakId key', () => {
    const flatList = [
      { evrakId: '100', name: 'Dilekçe', relativePath: 'Belgeler', evrakTuru: '', evrakTarihi: '' },
      { evrakId: '200', name: 'Dilekçe', relativePath: 'Belgeler', evrakTuru: '', evrakTarihi: '' },
    ];
    const tree = Scanner.buildTreeFromFlat(flatList);
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].evrakId).not.toBe(tree[0].children[1].evrakId);
  });

  it('preserves metadata in file nodes', () => {
    const flatList = [
      { evrakId: '1', name: 'Test', relativePath: '', evrakTuru: 'Dilekçe', evrakTarihi: '15/01/2026' },
    ];
    const tree = Scanner.buildTreeFromFlat(flatList);
    expect(tree[0].metadata).toEqual({ evrakTuru: 'Dilekçe', evrakTarihi: '15/01/2026' });
  });

  it('handles empty flat list', () => {
    const tree = Scanner.buildTreeFromFlat([]);
    expect(tree).toEqual([]);
  });
});

describe('Scanner.detectPagination', () => {
  it('returns null when no result container exists', () => {
    expect(Scanner.detectPagination()).toBeNull();
  });

  it('detects pagination text', () => {
    const container = document.createElement('div');
    container.id = 'dosya_evrak_bilgileri_result';
    container.textContent = 'Toplam 5 sayfadan 2. sayfa gösteriliyor';
    document.body.appendChild(container);

    const result = Scanner.detectPagination();
    expect(result).toEqual({
      currentPage: 2,
      totalPages: 5,
      hasMultiplePages: true
    });

    document.body.removeChild(container);
  });

  it('detects single page', () => {
    const container = document.createElement('div');
    container.id = 'dosya_evrak_bilgileri_result';
    container.textContent = 'Toplam 1 sayfadan 1. sayfa';
    document.body.appendChild(container);

    const result = Scanner.detectPagination();
    expect(result).toEqual({
      currentPage: 1,
      totalPages: 1,
      hasMultiplePages: false
    });

    document.body.removeChild(container);
  });
});
