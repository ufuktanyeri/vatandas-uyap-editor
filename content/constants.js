/**
 * constants.js - Sabitler ve konfigürasyon
 *
 * IIFE + Object.freeze ile encapsulation (T-4).
 * globalThis'e atanarak tüm content script'lerde erişilebilir.
 */

const UyapConstants = (() => {
  const UYAP_BASE_URL = 'https://vatandas.uyap.gov.tr';

  const DOWNLOAD_ENDPOINTS = Object.freeze({
    DEFAULT: 'download_document_brd.uyap',
    DANISTAY: 'download_document_danistay_brd.uyap',
    YARGITAY: 'download_document_yargitay_brd.uyap',
    KVK: 'kvkEvrakDownloadDocument_brd.uyap',
  });

  function getDownloadEndpoint(yargiTuru) {
    if (yargiTuru === 'kvk') return DOWNLOAD_ENDPOINTS.KVK;
    if (yargiTuru === '2') return DOWNLOAD_ENDPOINTS.DANISTAY;
    if (yargiTuru === '3') return DOWNLOAD_ENDPOINTS.YARGITAY;
    return DOWNLOAD_ENDPOINTS.DEFAULT;
  }

  const MAGIC_BYTES = Object.freeze({
    PDF: [0x25, 0x50, 0x44, 0x46],
    ZIP: [0x50, 0x4B, 0x03, 0x04],
    TIFF_LE: [0x49, 0x49, 0x2A, 0x00],
    TIFF_BE: [0x4D, 0x4D, 0x00, 0x2A],
    PNG: [0x89, 0x50, 0x4E, 0x47],
    JPEG: [0xFF, 0xD8, 0xFF],
  });

  const MIME_TYPES = Object.freeze({
    PDF: 'application/pdf',
    UDF: 'application/zip',
    TIFF: 'image/tiff',
    PNG: 'image/png',
    JPEG: 'image/jpeg',
    HTML: 'text/html',
    UNKNOWN: 'application/octet-stream'
  });

  const FILE_EXTENSIONS = Object.freeze({
    PDF: '.pdf',
    UDF: '.udf',
    TIFF: '.tiff',
    PNG: '.png',
    JPEG: '.jpg',
    HTML: '.html'
  });

  const SELECTORS = Object.freeze({
    FILETREE: '#browser.filetree',
    MODAL: '#dosya_goruntule_modal',
    YARGI_TURU_SELECT: '#yargiTuru',
    USERNAME: '.username.username-hide-on-mobile',
    FILE_SPAN: 'span.file',
    FOLDER_SPAN: 'span.folder',
    EVRAK_RESULT: '#dosya_evrak_bilgileri_result'
  });

  const SKIP_FOLDERS = Object.freeze(['Son 20 Evrak', 'Son20']);

  const DEFAULT_SETTINGS = Object.freeze({
    downloadDelay: 300,
    autoRetry: true,
    keepFolderStructure: true
  });

  const DEFAULT_YARGI_TURU = '1';

  const YARGI_TURLERI = Object.freeze({
    '0': 'Ceza',
    '1': 'Hukuk',
    '2': 'İcra',
    '3': 'Yargıtay',
    '5': 'Adli Tıp',
    '6': 'İdari Yargı',
    '11': 'Satış Memurluğu',
    '25': 'Arabuluculuk',
    '26': 'Tazminat Komisyonu Başkanlığı',
    'kvk': 'Kişisel Verilerin Korunması'
  });

  const RETRY_CONFIG = Object.freeze({
    MAX_RETRIES: 2,
    BASE_DELAY: 1000,
    DELAY_MULTIPLIER: 2
  });

  const TIMEOUTS = Object.freeze({
    FILETREE_LOAD: 30000,
    MUTATION_DEBOUNCE: 150,
    POLLING_INTERVAL: 500,
    BLOB_CLEANUP_DELAY: 100,
    PAUSE_CHECK_INTERVAL: 100
  });

  const UI_MESSAGES = Object.freeze({
    SUCCESS_ICON: '✅',
    WARNING_ICON: '⚠',
    ERROR_ICON: '❌',
    LOG_PREFIX: '[UYAP-EXT]',
    SCAN_IN_PROGRESS: '<p><i class="fa fa-spinner fa-spin"></i> Dosyalar taranıyor...</p>',
    SCAN_COMPLETE: 'evrak bulundu',
    DOWNLOAD_COMPLETE: 'indirildi',
    SESSION_EXPIRED: 'UYAP oturumunuz sona erdi. Sayfayı yenileyip tekrar giriş yapın.'
  });

  const STORAGE_KEYS = Object.freeze({
    SETTINGS: 'uyap-settings'
  });

  function sanitizeName(name) {
    return name
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, ' ')
      .replace(/^[\s.]+|[\s.]+$/g, '')
      .substring(0, 200);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return Object.freeze({
    UYAP_BASE_URL, DOWNLOAD_ENDPOINTS, MAGIC_BYTES,
    MIME_TYPES, FILE_EXTENSIONS, SELECTORS, SKIP_FOLDERS,
    DEFAULT_SETTINGS, DEFAULT_YARGI_TURU, YARGI_TURLERI,
    RETRY_CONFIG, TIMEOUTS, UI_MESSAGES, STORAGE_KEYS,
    getDownloadEndpoint, sanitizeName, escapeHtml
  });
})();

Object.assign(globalThis, UyapConstants);
