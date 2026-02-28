/**
 * downloader.js - Evrak indirme motoru (DownloadManager class)
 *
 * T-19: downloadSingle → #fetchDocument + #detectAndName + #saveFile
 * Private alanlar ile state encapsulation.
 * Public API: downloadAll, pause, resume, cancel, isPausedState, isCancelled
 */

class DownloadManager {
  #abortController = null;
  #isPaused = false;
  #currentIndex = 0;

  // --- Private helpers ---

  #detectFileType(bytes) {
    const header = bytes.slice(0, 4);
    const match = (h, magic) => {
      if (h.length < magic.length) return false;
      for (let i = 0; i < magic.length; i++) {
        if (h[i] !== magic[i]) return false;
      }
      return true;
    };

    if (match(header, MAGIC_BYTES.PDF)) return { mimeType: MIME_TYPES.PDF, extension: FILE_EXTENSIONS.PDF };
    if (match(header, MAGIC_BYTES.PNG)) return { mimeType: MIME_TYPES.PNG, extension: FILE_EXTENSIONS.PNG };
    if (match(header, MAGIC_BYTES.JPEG)) return { mimeType: MIME_TYPES.JPEG, extension: FILE_EXTENSIONS.JPEG };
    if (match(header, MAGIC_BYTES.ZIP)) return { mimeType: MIME_TYPES.UDF, extension: FILE_EXTENSIONS.UDF };
    if (match(header, MAGIC_BYTES.TIFF_LE) || match(header, MAGIC_BYTES.TIFF_BE)) {
      return { mimeType: MIME_TYPES.TIFF, extension: FILE_EXTENSIONS.TIFF };
    }
    return { mimeType: MIME_TYPES.UNKNOWN, extension: '' };
  }

  #isHtmlResponse(bytes) {
    const snippet = new TextDecoder().decode(bytes.slice(0, 500));
    return snippet.includes('<!DOCTYPE') || snippet.includes('<html') || snippet.includes('<HTML');
  }

  #arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const CHUNK_SIZE = 8192;
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.byteLength));
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  #sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- T-19: downloadSingle split into 3 focused methods ---

  async #fetchDocument(evrak, dosya) {
    const endpoint = getDownloadEndpoint(dosya.yargiTuru);
    const url = `${UYAP_BASE_URL}/${endpoint}` +
      `?evrakId=${encodeURIComponent(evrak.evrakId)}` +
      `&dosyaId=${encodeURIComponent(dosya.dosyaId)}` +
      `&yargiTuru=${encodeURIComponent(dosya.yargiTuru)}`;

    const response = await fetch(url, {
      credentials: 'include',
      signal: this.#abortController?.signal
    });

    if (!response.ok) return { success: false, error: `HTTP ${response.status}` };

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) return { success: false, sessionExpired: true };

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    if (this.#isHtmlResponse(bytes)) return { success: false, sessionExpired: true };

    return { success: true, arrayBuffer, bytes };
  }

  #detectAndName(arrayBuffer, bytes, evrak) {
    const { mimeType, extension } = this.#detectFileType(bytes);
    const fileName = `${sanitizeName(evrak.name)}${extension || '.bin'}`;
    const base64Data = this.#arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    return { dataUrl, fileName, mimeType, fileSize: arrayBuffer.byteLength };
  }

  async #saveFile(dataUrl, fileName, arrayBuffer, mimeType) {
    try {
      const downloadResponse = await chrome.runtime.sendMessage({
        type: 'DOWNLOAD_FILE',
        payload: { url: dataUrl, filename: fileName }
      });

      if (!downloadResponse?.success) {
        throw new Error(downloadResponse?.error || 'Background download failed');
      }

      console.log(`[UYAP-EXT] Downloaded: ${fileName}`);
      return {
        success: true, fileName, mimeType,
        fileSize: arrayBuffer.byteLength,
        downloadId: downloadResponse.downloadId
      };
    } catch (downloadError) {
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

      return { success: true, fileName, mimeType, fileSize: arrayBuffer.byteLength };
    }
  }

  async #downloadSingle(evrak, dosya) {
    try {
      const fetchResult = await this.#fetchDocument(evrak, dosya);
      if (!fetchResult.success) return fetchResult;

      const { dataUrl, fileName, mimeType } = this.#detectAndName(
        fetchResult.arrayBuffer, fetchResult.bytes, evrak
      );

      return this.#saveFile(dataUrl, fileName, fetchResult.arrayBuffer, mimeType);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { success: false, error: 'İptal edildi' };
      }
      console.error('[UYAP-EXT] Download error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' };
    }
  }

  async #downloadWithRetry(evrak, dosya, settings) {
    const maxAttempts = settings.autoRetry ? RETRY_CONFIG.MAX_RETRIES + 1 : 1;
    let lastResult = { success: false, error: 'Bilinmeyen hata' };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      lastResult = await this.#downloadSingle(evrak, dosya);

      if (lastResult.success || lastResult.sessionExpired ||
          lastResult.error === 'İptal edildi' ||
          this.#abortController?.signal.aborted) {
        return lastResult;
      }

      if (attempt < maxAttempts) {
        const delay = RETRY_CONFIG.BASE_DELAY * Math.pow(RETRY_CONFIG.DELAY_MULTIPLIER, attempt - 1);
        console.log(`[UYAP-EXT] Retry ${attempt}/${RETRY_CONFIG.MAX_RETRIES} for ${evrak.evrakId} after ${delay}ms`);
        await this.#sleep(delay);
      }
    }

    return lastResult;
  }

  #downloadSimple(evrak, dosya) {
    if (typeof window.downloadDoc === 'function') {
      window.downloadDoc(evrak.evrakId, dosya.dosyaId, dosya.yargiTuru);
      return { success: true };
    }
    return { success: false, error: 'downloadDoc fonksiyonu bulunamadı' };
  }

  // --- Public API ---

  async downloadAll(evraklar, dosya, settings, onProgress, onSessionExpired, useSimpleMode) {
    this.#abortController = new AbortController();
    this.#isPaused = false;
    this.#currentIndex = 0;

    let completed = 0;
    let failed = 0;
    let sessionExpired = false;

    for (let i = 0; i < evraklar.length; i++) {
      while (this.#isPaused && this.#abortController && !this.#abortController.signal.aborted) {
        await this.#sleep(TIMEOUTS.PAUSE_CHECK_INTERVAL);
      }

      if (this.#abortController?.signal.aborted) {
        console.log('[UYAP-EXT] Download cancelled');
        break;
      }

      if (sessionExpired) {
        console.log('[UYAP-EXT] Session expired, stopping downloads');
        if (onSessionExpired) onSessionExpired();
        break;
      }

      const evrak = evraklar[i];
      this.#currentIndex = i;

      if (onProgress) {
        onProgress({ evrakId: evrak.evrakId, status: 'downloading', current: i + 1, total: evraklar.length });
      }

      const result = useSimpleMode
        ? this.#downloadSimple(evrak, dosya)
        : await this.#downloadWithRetry(evrak, dosya, settings);

      if (result.sessionExpired) {
        sessionExpired = true;
        if (onSessionExpired) onSessionExpired();
        break;
      }

      if (result.success) {
        completed++;
      } else {
        failed++;
      }

      if (onProgress) {
        onProgress({
          evrakId: evrak.evrakId,
          status: result.success ? 'completed' : 'failed',
          error: result.error,
          current: i + 1,
          total: evraklar.length
        });
      }

      if (i < evraklar.length - 1) {
        await this.#sleep(settings.downloadDelay || DEFAULT_SETTINGS.downloadDelay);
      }
    }

    return { completed, failed, total: evraklar.length, sessionExpired };
  }

  pause() {
    this.#isPaused = true;
    console.log('[UYAP-EXT] Downloads paused');
  }

  resume() {
    this.#isPaused = false;
    console.log('[UYAP-EXT] Downloads resumed');
  }

  cancel() {
    this.#abortController?.abort();
    this.#isPaused = false;
    console.log('[UYAP-EXT] Downloads cancelled');
  }

  isPausedState() {
    return this.#isPaused;
  }

  isCancelled() {
    return this.#abortController?.signal.aborted ?? false;
  }

  getCurrentIndex() {
    return this.#currentIndex;
  }
}

const Downloader = new DownloadManager();
