/**
 * constants.js - Sabitler ve konfigürasyon
 * Kaynak: v2/src/lib/constants.ts + v2/src/types/index.ts
 */

// UYAP endpoint'leri
const UYAP_BASE_URL = 'https://vatandas.uyap.gov.tr';

// yargiTuru → download endpoint mapping (Application.getDownloadURL aynalama)
// Not: UYAP İcra türü için "danistay" adlı endpoint kullanır (UYAP isimlendirme tutarsızlığı)
const DOWNLOAD_ENDPOINTS = {
  DEFAULT: 'download_document_brd.uyap',              // 0,1,5,6,11,25,26 ve diğerleri
  DANISTAY: 'download_document_danistay_brd.uyap',   // yargiTuru=2 (İcra)
  YARGITAY: 'download_document_yargitay_brd.uyap',   // yargiTuru=3 (Yargıtay)
  KVK: 'kvkEvrakDownloadDocument_brd.uyap',           // yargiTuru=kvk (KVK)
};

/**
 * UYAP Application.getDownloadURL mantığını aynalar
 * @param {string} yargiTuru
 * @returns {string} endpoint path
 */
function getDownloadEndpoint(yargiTuru) {
  if (yargiTuru === 'kvk') return DOWNLOAD_ENDPOINTS.KVK;
  if (yargiTuru === '2') return DOWNLOAD_ENDPOINTS.DANISTAY;
  if (yargiTuru === '3') return DOWNLOAD_ENDPOINTS.YARGITAY;
  return DOWNLOAD_ENDPOINTS.DEFAULT;
}

// Magic bytes - dosya tipi tespiti
const MAGIC_BYTES = {
  PDF: [0x25, 0x50, 0x44, 0x46],       // %PDF
  ZIP: [0x50, 0x4B, 0x03, 0x04],       // PK.. (UDF/DOCX)
  TIFF_LE: [0x49, 0x49, 0x2A, 0x00],   // II*.
  TIFF_BE: [0x4D, 0x4D, 0x00, 0x2A],   // MM.*
  PNG: [0x89, 0x50, 0x4E, 0x47],       // .PNG
  JPEG: [0xFF, 0xD8, 0xFF],            // JFIF/Exif
};

// MIME types
const MIME_TYPES = {
  PDF: 'application/pdf',
  UDF: 'application/zip',
  TIFF: 'image/tiff',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  HTML: 'text/html',
  UNKNOWN: 'application/octet-stream'
};

// Dosya uzantıları
const FILE_EXTENSIONS = {
  PDF: '.pdf',
  UDF: '.udf',
  TIFF: '.tiff',
  PNG: '.png',
  JPEG: '.jpg',
  HTML: '.html'
};

// UYAP DOM seçicileri
const SELECTORS = {
  FILETREE: '#browser.filetree',
  MODAL: '#dosya_goruntule_modal',
  YARGI_TURU_SELECT: '#yargiTuru',
  USERNAME: '.username.username-hide-on-mobile',
  FILE_SPAN: 'span.file',
  FOLDER_SPAN: 'span.folder',
  EVRAK_RESULT: '#dosya_evrak_bilgileri_result'
};

// Tarama sırasında atlanacak klasörler
const SKIP_FOLDERS = ['Son 20 Evrak', 'Son20'];

// Varsayılan ayarlar
const DEFAULT_SETTINGS = {
  downloadDelay: 300,           // 300ms minimum bekleme (WAF koruması)
  autoRetry: true,
  keepFolderStructure: true
};

// Varsayılan yargı türü
const DEFAULT_YARGI_TURU = '1'; // Hukuk

// Yargı türleri referans tablosu
// Select options (0,1,2,5,6,11,25,26) + endpoint-only türler (3, kvk)
const YARGI_TURLERI = {
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
};

// Retry konfigürasyonu
const RETRY_CONFIG = {
  MAX_RETRIES: 2,
  BASE_DELAY: 1000,             // 1s ilk retry bekleme
  DELAY_MULTIPLIER: 2           // Üstel artış: 1s, 2s
};

// Timeout değerleri
const TIMEOUTS = {
  FILETREE_LOAD: 30000,        // scanner.js waitForFiletree
  MUTATION_DEBOUNCE: 150,      // main.js observeModal debounce
  POLLING_INTERVAL: 500,       // scanner.js waitForFiletree polling
  BLOB_CLEANUP_DELAY: 100,     // downloader.js cleanup timeout
  PAUSE_CHECK_INTERVAL: 100    // downloader.js pause loop
};

// UI mesajları ve icon'lar
const UI_MESSAGES = {
  SUCCESS_ICON: '✅',
  WARNING_ICON: '⚠',
  ERROR_ICON: '❌',
  LOG_PREFIX: '[UYAP-EXT]',
  SCAN_IN_PROGRESS: '<p><i class="fa fa-spinner fa-spin"></i> Dosyalar taranıyor...</p>',
  SCAN_COMPLETE: 'evrak bulundu',
  DOWNLOAD_COMPLETE: 'indirildi',
  SESSION_EXPIRED: 'UYAP oturumunuz sona erdi. Sayfayı yenileyip tekrar giriş yapın.'
};

// Storage anahtarları
const STORAGE_KEYS = {
  SETTINGS: 'uyap-settings'
};

/**
 * Dosya adını temizle - geçersiz karakterleri kaldır
 */
function sanitizeName(name) {
  return name
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '')          // Kontrol karakterleri
    .replace(/[<>:"/\\|?*]/g, '_')             // Windows geçersiz karakterler
    .replace(/\s+/g, ' ')                       // Çoklu boşluklar
    .replace(/^[\s.]+|[\s.]+$/g, '')            // Baş/son nokta ve boşluklar
    .substring(0, 200);                          // Uzunluk limiti
}

/**
 * HTML özel karakterlerini escape et (XSS önleme)
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
