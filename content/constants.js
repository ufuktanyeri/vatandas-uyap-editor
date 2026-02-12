/**
 * constants.js - Sabitler ve konfigürasyon
 * Kaynak: v2/src/lib/constants.ts + v2/src/types/index.ts
 */

// UYAP endpoint'leri
const UYAP_BASE_URL = 'https://vatandas.uyap.gov.tr';
const DOWNLOAD_ENDPOINT = 'download_document_brd.uyap';

// Magic bytes - dosya tipi tespiti
const MAGIC_BYTES = {
  PDF: [0x25, 0x50, 0x44, 0x46],       // %PDF
  ZIP: [0x50, 0x4B, 0x03, 0x04],       // PK.. (UDF)
  TIFF_LE: [0x49, 0x49, 0x2A, 0x00],   // II*.
  TIFF_BE: [0x4D, 0x4D, 0x00, 0x2A],   // MM.*
};

// MIME types
const MIME_TYPES = {
  PDF: 'application/pdf',
  UDF: 'application/zip',
  TIFF: 'image/tiff',
  HTML: 'text/html',
  UNKNOWN: 'application/octet-stream'
};

// Dosya uzantıları
const FILE_EXTENSIONS = {
  PDF: '.pdf',
  UDF: '.udf',
  TIFF: '.tiff',
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
