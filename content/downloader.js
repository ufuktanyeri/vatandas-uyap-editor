/**
 * downloader.js - Evrak indirme motoru
 * Kaynak: v2/src/content/downloader.ts
 *
 * Özellikler:
 * - fetch() ile doğrudan UYAP'tan indirme (same-origin, credentials)
 * - Magic bytes ile dosya tipi tespiti (PDF/UDF/TIFF)
 * - Content-Type + magic bytes çift session expired kontrolü
 * - Retry + exponential backoff
 * - Pause/Resume/Cancel desteği
 * - WAF koruması (configurable delay)
 * - Fallback: window.downloadDoc() (basit mod)
 */

const Downloader = (() => {
  let abortController = null;
  let isPaused = false;
  let currentIndex = 0;

  /**
   * Magic bytes ile dosya tipi tespit et
   */
  function detectFileType(bytes) {
    const header = bytes.slice(0, 4);

    function matchBytes(h, magic) {
      if (h.length < magic.length) return false;
      for (let i = 0; i < magic.length; i++) {
        if (h[i] !== magic[i]) return false;
      }
      return true;
    }

    if (matchBytes(header, MAGIC_BYTES.PDF)) {
      return { mimeType: MIME_TYPES.PDF, extension: FILE_EXTENSIONS.PDF };
    }
    if (matchBytes(header, MAGIC_BYTES.ZIP)) {
      return { mimeType: MIME_TYPES.UDF, extension: FILE_EXTENSIONS.UDF };
    }
    if (matchBytes(header, MAGIC_BYTES.TIFF_LE) || matchBytes(header, MAGIC_BYTES.TIFF_BE)) {
      return { mimeType: MIME_TYPES.TIFF, extension: FILE_EXTENSIONS.TIFF };
    }

    return { mimeType: MIME_TYPES.UNKNOWN, extension: '' };
  }

  /**
   * Response byte'larının HTML olup olmadığını kontrol et (session expired)
   */
  function isHtmlResponse(bytes) {
    const snippet = new TextDecoder().decode(bytes.slice(0, 500));
    return snippet.includes('<!DOCTYPE') ||
      snippet.includes('<html') ||
      snippet.includes('<HTML');
  }

  /**
   * ArrayBuffer → base64 (chunked, call stack overflow önleme)
   */
  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const CHUNK_SIZE = 8192;
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.byteLength));
      binary += String.fromCharCode.apply(null, chunk);
    }

    return btoa(binary);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Tek bir evrakı indir
   */
  async function downloadSingle(evrak, dosya) {
    const yargiTuru = getYargiTuru();
    const url = `${UYAP_BASE_URL}/${DOWNLOAD_ENDPOINT}` +
      `?evrakId=${evrak.evrakId}` +
      `&dosyaId=${dosya.dosyaId}` +
      `&yargiTuru=${yargiTuru}`;

    try {
      const response = await fetch(url, {
        credentials: 'include',
        signal: abortController ? abortController.signal : undefined
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }

      // Hızlı session kontrolü: Content-Type
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return { success: false, sessionExpired: true };
      }

      // Body oku ve magic bytes kontrol
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Çift kontrol: magic bytes ile HTML tespiti
      if (isHtmlResponse(bytes)) {
        return { success: false, sessionExpired: true };
      }

      // Dosya tipi tespit
      const { mimeType, extension } = detectFileType(bytes);
      const fileName = `${sanitizeName(evrak.name)}${extension || '.bin'}`;

      // Data URL oluştur (chrome.downloads için)
      const base64Data = arrayBufferToBase64(arrayBuffer);
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      // Chrome downloads API ile otomatik indir (kullanıcı onayı gerektirmez)
      try {
        const downloadResponse = await chrome.runtime.sendMessage({
          type: 'DOWNLOAD_FILE',
          payload: {
            url: dataUrl,
            filename: fileName
          }
        });

        if (!downloadResponse || !downloadResponse.success) {
          throw new Error(downloadResponse?.error || 'Background download failed');
        }

        console.log(`[UYAP-EXT] Downloaded: ${fileName}`);

        return {
          success: true,
          fileName,
          mimeType,
          fileSize: arrayBuffer.byteLength,
          downloadId: downloadResponse.downloadId
        };
      } catch (downloadError) {
        // Fallback: eski blob method (kullanıcı onayı gerektirir)
        console.warn('[UYAP-EXT] Chrome downloads API failed, fallback to blob:', downloadError);

        const blob = new Blob([arrayBuffer], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          try {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          } catch (err) {
            console.warn('[UYAP-EXT] Cleanup error:', err);
          }
        }, TIMEOUTS.BLOB_CLEANUP_DELAY);

        return {
          success: true,
          fileName,
          mimeType,
          fileSize: arrayBuffer.byteLength
        };
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { success: false, error: 'İptal edildi' };
      }

      console.error('[UYAP-EXT] Download error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  /**
   * Retry ile indirme (session expired ve iptal hariç)
   */
  async function downloadWithRetry(evrak, dosya, settings) {
    const maxAttempts = settings.autoRetry ? RETRY_CONFIG.MAX_RETRIES + 1 : 1;
    let lastResult = { success: false, error: 'Bilinmeyen hata' };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      lastResult = await downloadSingle(evrak, dosya);

      // Başarılı, session expired veya iptal → retry yapma
      if (lastResult.success || lastResult.sessionExpired ||
          lastResult.error === 'İptal edildi' ||
          (abortController && abortController.signal.aborted)) {
        return lastResult;
      }

      // Kalan deneme varsa exponential backoff ile bekle
      if (attempt < maxAttempts) {
        const delay = RETRY_CONFIG.BASE_DELAY *
          Math.pow(RETRY_CONFIG.DELAY_MULTIPLIER, attempt - 1);
        console.log(`[UYAP-EXT] Retry ${attempt}/${RETRY_CONFIG.MAX_RETRIES} for ${evrak.evrakId} after ${delay}ms`);
        await sleep(delay);
      }
    }

    return lastResult;
  }

  /**
   * Basit mod: window.downloadDoc() kullan (v5/v6 mantığı)
   */
  function downloadSimple(evrak, dosya) {
    if (typeof window.downloadDoc === 'function') {
      window.downloadDoc(evrak.evrakId, dosya.dosyaId, dosya.yargiTuru);
      return { success: true };
    }
    return { success: false, error: 'downloadDoc fonksiyonu bulunamadı' };
  }

  return {
    /**
     * Seçili evrakları toplu indir
     * @param {Array} evraklar - İndirilecek evrak listesi
     * @param {Object} dosya - Dosya bilgileri (dosyaId, yargiTuru)
     * @param {Object} settings - Ayarlar (downloadDelay, autoRetry)
     * @param {Function} onProgress - Progress callback ({evrakId, status, error})
     * @param {Function} onSessionExpired - Session expired callback
     * @param {boolean} useSimpleMode - true ise window.downloadDoc() kullan
     */
    async downloadAll(evraklar, dosya, settings, onProgress, onSessionExpired, useSimpleMode) {
      abortController = new AbortController();
      isPaused = false;
      currentIndex = 0;

      for (let i = 0; i < evraklar.length; i++) {
        // Pause kontrolü
        while (isPaused && abortController && !abortController.signal.aborted) {
          await sleep(TIMEOUTS.PAUSE_CHECK_INTERVAL);
        }

        // İptal kontrolü
        if (abortController && abortController.signal.aborted) {
          console.log('[UYAP-EXT] Download cancelled');
          break;
        }

        // Session kontrolü
        if (AppState.sessionExpired) {
          console.log('[UYAP-EXT] Session expired, stopping downloads');
          if (onSessionExpired) onSessionExpired();
          break;
        }

        const evrak = evraklar[i];
        currentIndex = i;

        // Progress: downloading
        if (onProgress) {
          onProgress({ evrakId: evrak.evrakId, status: 'downloading', current: i + 1, total: evraklar.length });
        }

        let result;

        if (useSimpleMode) {
          result = downloadSimple(evrak, dosya);
        } else {
          result = await downloadWithRetry(evrak, dosya, settings);
        }

        if (result.sessionExpired) {
          AppState.sessionExpired = true;
          if (onSessionExpired) onSessionExpired();
          break;
        }

        // Progress: completed/failed
        if (onProgress) {
          onProgress({
            evrakId: evrak.evrakId,
            status: result.success ? 'completed' : 'failed',
            error: result.error,
            current: i + 1,
            total: evraklar.length
          });
        }

        // WAF koruması - sonraki indirmeden önce bekle
        if (i < evraklar.length - 1) {
          await sleep(settings.downloadDelay || DEFAULT_SETTINGS.downloadDelay);
        }
      }

      // Return download results
      return {
        completed: AppState.stats.completed,
        failed: AppState.stats.failed,
        total: evraklar.length,
        sessionExpired: AppState.sessionExpired
      };
    },

    pause() {
      isPaused = true;
      console.log('[UYAP-EXT] Downloads paused');
    },

    resume() {
      isPaused = false;
      console.log('[UYAP-EXT] Downloads resumed');
    },

    cancel() {
      if (abortController) abortController.abort();
      isPaused = false;
      console.log('[UYAP-EXT] Downloads cancelled');
    },

    isPausedState() {
      return isPaused;
    },

    isCancelled() {
      return abortController ? abortController.signal.aborted : false;
    },

    getCurrentIndex() {
      return currentIndex;
    }
  };
})();
