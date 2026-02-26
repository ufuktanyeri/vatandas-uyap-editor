import { describe, it, expect } from 'vitest';

describe('sanitizeName', () => {
  it('trims whitespace', () => {
    expect(sanitizeName('  hello  ')).toBe('hello');
  });

  it('replaces control characters', () => {
    expect(sanitizeName('test\x00\x1Fname')).toBe('testname');
  });

  it('replaces Windows-invalid characters with underscore', () => {
    expect(sanitizeName('file<>:"/\\|?*name')).toBe('file_________name');
  });

  it('collapses multiple spaces', () => {
    expect(sanitizeName('hello   world')).toBe('hello world');
  });

  it('removes leading/trailing dots and spaces', () => {
    expect(sanitizeName('..hello..')).toBe('hello');
  });

  it('truncates at 200 characters', () => {
    const longName = 'a'.repeat(250);
    expect(sanitizeName(longName).length).toBe(200);
  });

  it('handles Turkish characters correctly', () => {
    expect(sanitizeName('Çalışma Dosyası İçeriği')).toBe('Çalışma Dosyası İçeriği');
  });

  it('handles empty string', () => {
    expect(sanitizeName('')).toBe('');
  });
});

describe('escapeHtml', () => {
  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('does not escape double quotes (safe in text content)', () => {
    expect(escapeHtml('"hello"')).toBe('"hello"');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world 123')).toBe('hello world 123');
  });

  it('handles Turkish characters', () => {
    const input = 'İstanbul Üniversitesi Çağrı';
    expect(escapeHtml(input)).toBe(input);
  });
});

describe('getDownloadEndpoint', () => {
  it('returns KVK endpoint for kvk', () => {
    expect(getDownloadEndpoint('kvk')).toBe(DOWNLOAD_ENDPOINTS.KVK);
  });

  it('returns DANISTAY endpoint for yargiTuru 2 (İcra)', () => {
    expect(getDownloadEndpoint('2')).toBe(DOWNLOAD_ENDPOINTS.DANISTAY);
  });

  it('returns YARGITAY endpoint for yargiTuru 3', () => {
    expect(getDownloadEndpoint('3')).toBe(DOWNLOAD_ENDPOINTS.YARGITAY);
  });

  it('returns DEFAULT endpoint for yargiTuru 0 (Ceza)', () => {
    expect(getDownloadEndpoint('0')).toBe(DOWNLOAD_ENDPOINTS.DEFAULT);
  });

  it('returns DEFAULT endpoint for yargiTuru 1 (Hukuk)', () => {
    expect(getDownloadEndpoint('1')).toBe(DOWNLOAD_ENDPOINTS.DEFAULT);
  });

  it('returns DEFAULT endpoint for yargiTuru 5 (Adli Tıp)', () => {
    expect(getDownloadEndpoint('5')).toBe(DOWNLOAD_ENDPOINTS.DEFAULT);
  });

  it('returns DEFAULT endpoint for yargiTuru 6 (İdari Yargı)', () => {
    expect(getDownloadEndpoint('6')).toBe(DOWNLOAD_ENDPOINTS.DEFAULT);
  });

  it('returns DEFAULT endpoint for yargiTuru 11', () => {
    expect(getDownloadEndpoint('11')).toBe(DOWNLOAD_ENDPOINTS.DEFAULT);
  });

  it('returns DEFAULT endpoint for yargiTuru 25', () => {
    expect(getDownloadEndpoint('25')).toBe(DOWNLOAD_ENDPOINTS.DEFAULT);
  });

  it('returns DEFAULT endpoint for yargiTuru 26', () => {
    expect(getDownloadEndpoint('26')).toBe(DOWNLOAD_ENDPOINTS.DEFAULT);
  });

  it('returns DEFAULT endpoint for unknown yargiTuru', () => {
    expect(getDownloadEndpoint('999')).toBe(DOWNLOAD_ENDPOINTS.DEFAULT);
  });
});

describe('MAGIC_BYTES', () => {
  it('has PDF magic bytes (%PDF)', () => {
    expect(MAGIC_BYTES.PDF).toEqual([0x25, 0x50, 0x44, 0x46]);
  });

  it('has ZIP magic bytes (PK..)', () => {
    expect(MAGIC_BYTES.ZIP).toEqual([0x50, 0x4B, 0x03, 0x04]);
  });

  it('has PNG magic bytes', () => {
    expect(MAGIC_BYTES.PNG).toEqual([0x89, 0x50, 0x4E, 0x47]);
  });

  it('has JPEG magic bytes (3 bytes)', () => {
    expect(MAGIC_BYTES.JPEG).toEqual([0xFF, 0xD8, 0xFF]);
  });
});

describe('YARGI_TURLERI reference table', () => {
  it('contains all select option values', () => {
    const requiredKeys = ['0', '1', '2', '5', '6', '11', '25', '26'];
    for (const key of requiredKeys) {
      expect(YARGI_TURLERI).toHaveProperty(key);
    }
  });

  it('contains endpoint-only types', () => {
    expect(YARGI_TURLERI).toHaveProperty('3');
    expect(YARGI_TURLERI).toHaveProperty('kvk');
  });
});
