/**
 * scanner.js - UYAP DOM tarama ve evrak çıkarma (Scanner static class)
 *
 * Static class: tüm metodlar stateless, instance gerekmez.
 * jQuery handler parsing #parseJQueryHandler ile deduplicate edildi (T-2).
 * window.dosyaId öncelikli kullanılır (T-2).
 */

class Scanner {
  /**
   * Ortak jQuery dblclick handler parser.
   * findDosyaId ve getYargiTuru tarafından kullanılır.
   */
  static #parseJQueryHandler(el, regex) {
    try {
      if (typeof window.jQuery === 'undefined') return null;
      const events = window.jQuery._data?.(el, 'events');
      if (!events?.dblclick) return null;
      for (const handler of events.dblclick) {
        const match = handler.handler.toString().match(regex);
        if (match) return match[1];
      }
    } catch { /* silent */ }
    return null;
  }

  static findDosyaId() {
    if (window.dosyaId) return String(window.dosyaId);

    const htmlMatch = document.body.innerHTML.match(/dosyaId\s*=\s*['"]?(\d+)['"]?/);
    if (htmlMatch?.[1]) return htmlMatch[1];

    const fileSpan = document.querySelector('span.file[evrak_id]');
    if (fileSpan) {
      const result = Scanner.#parseJQueryHandler(
        fileSpan, /downloadDoc\([^,]+,\s*['"]([^'"]+)['"]/
      );
      if (result) return result;
    }

    console.warn('[UYAP-EXT] dosyaId not found');
    return null;
  }

  static getYargiTuru() {
    const selectEl = document.querySelector(SELECTORS.YARGI_TURU_SELECT);
    if (selectEl?.value?.trim()) return selectEl.value.trim();

    const fileSpan = document.querySelector('span.file[evrak_id]');
    if (fileSpan) {
      const result = Scanner.#parseJQueryHandler(
        fileSpan, /downloadDoc\([^,]+,\s*[^,]+,\s*['"]([^'"]+)['"]/
      );
      if (result?.trim()) return result.trim();
    }

    return DEFAULT_YARGI_TURU;
  }

  static findKisiAdi() {
    const headerEl = document.querySelector(SELECTORS.USERNAME);
    if (headerEl?.textContent) return sanitizeName(headerEl.textContent.trim());

    const adElement = document.getElementById('ad');
    if (adElement?.textContent) return sanitizeName(adElement.textContent.trim());

    return 'Bilinmeyen';
  }

  static getDosyaBilgileri() {
    const dosyaId = Scanner.findDosyaId();
    if (!dosyaId) {
      console.error('[UYAP-EXT] dosyaId not found in page');
      return null;
    }

    let dosyaNo = '';
    const resultEl = document.querySelector(SELECTORS.EVRAK_RESULT);
    if (resultEl) {
      const match = resultEl.textContent.match(/Dosya\s+No\s*:\s*(\S+)/i);
      if (match) dosyaNo = match[1];
    }

    if (!dosyaNo) {
      const modalEl = document.querySelector(SELECTORS.MODAL);
      const searchRoot = modalEl || document.body;
      const match = searchRoot.textContent.match(/Dosya\s+No\s*:\s*([\w/-]+)/i);
      if (match) dosyaNo = match[1];
    }

    return { dosyaId, dosyaNo, yargiTuru: Scanner.getYargiTuru() };
  }

  static parseTooltip(tooltip) {
    const result = {};
    if (!tooltip) return result;

    const lines = tooltip.split(/<\/?div[^>]*>|<br\s*\/?>|\n/gi);
    for (const line of lines) {
      const clean = line.replace(/<[^>]*>/g, '').trim();
      if (!clean) continue;
      const colonIndex = clean.indexOf(':');
      if (colonIndex === -1) continue;
      const key = clean.substring(0, colonIndex).trim();
      const value = clean.substring(colonIndex + 1).trim();
      if (key && value) result[key] = value;
    }
    return result;
  }

  static scanFiletree() {
    const filetree = document.querySelector(SELECTORS.FILETREE);
    if (!filetree) {
      console.warn('[UYAP-EXT] Filetree not found');
      return { tree: [], flatList: [] };
    }

    const seen = new Set();
    const evraklar = [];
    Scanner.#parseNode(filetree, '', seen, evraklar);

    console.log(`[UYAP-EXT] Scanner: Found ${evraklar.length} unique evraklar`);
    return { tree: Scanner.buildTreeFromFlat(evraklar), flatList: evraklar };
  }

  static #parseNode(ul, currentPath, seen, evraklar) {
    const items = ul.querySelectorAll(':scope > li');
    for (const li of items) {
      const span = li.querySelector(':scope > span');
      const childUl = li.querySelector(':scope > ul');
      if (!span) continue;

      const name = (span.textContent || '').trim();

      if (span.classList.contains('folder')) {
        if (SKIP_FOLDERS.some(skip => name.includes(skip))) continue;
        const newPath = currentPath ? `${currentPath}/${name}` : name;
        if (childUl) Scanner.#parseNode(childUl, newPath, seen, evraklar);
      } else {
        const evrakId = span.getAttribute('evrak_id');
        if (!evrakId || seen.has(evrakId)) continue;
        seen.add(evrakId);

        const tooltip = span.getAttribute('data-original-title')
          || span.getAttribute('title') || '';
        const metadata = Scanner.parseTooltip(tooltip);

        evraklar.push({
          evrakId,
          name,
          relativePath: currentPath,
          evrakTuru: metadata['Türü'] || metadata['Evrak Türü'] || metadata['Belge Türü'] || '',
          evrakTarihi: metadata['Evrakın Onaylandığı Tarih'] || metadata['Onay Tarihi']
            || metadata['Evrak Tarihi'] || metadata['Tarih'] || metadata['Kayıt Tarihi'] || ''
        });
      }
    }
  }

  static buildTreeFromFlat(flatList) {
    const root = {};

    for (const evrak of flatList) {
      const pathParts = evrak.relativePath ? evrak.relativePath.split('/') : [];
      let current = root;
      const currentPath = [];

      for (const folderName of pathParts) {
        currentPath.push(folderName);
        const fullPath = currentPath.join('/');
        if (!current[folderName]) {
          current[folderName] = {
            type: 'folder', name: folderName,
            path: [...currentPath], fullPath, children: {}
          };
        }
        current = current[folderName].children;
      }

      current[`__file_${evrak.evrakId}`] = {
        type: 'file', name: evrak.name,
        fullPath: pathParts.length > 0 ? `${evrak.relativePath}/${evrak.name}` : evrak.name,
        evrakId: evrak.evrakId,
        metadata: { evrakTuru: evrak.evrakTuru, evrakTarihi: evrak.evrakTarihi }
      };
    }

    return Scanner.#objectToArray(root);
  }

  static #objectToArray(obj) {
    return Object.values(obj)
      .filter(node => node.type)
      .map(node => {
        if (node.type === 'folder') node.children = Scanner.#objectToArray(node.children);
        return node;
      });
  }

  static detectPagination() {
    const container = document.querySelector(SELECTORS.EVRAK_RESULT);
    if (!container) return null;

    const match = (container.textContent || '').match(
      /Toplam\s+(\d+)\s+sayfadan\s+(\d+)\.\s*sayfa/i
    );
    if (!match) return null;

    const totalPages = parseInt(match[1], 10);
    const currentPage = parseInt(match[2], 10);
    return { currentPage, totalPages, hasMultiplePages: totalPages > 1 };
  }

  static waitForFiletree(timeout) {
    timeout = timeout || TIMEOUTS.FILETREE_LOAD;
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      function check() {
        const filetree = document.querySelector(SELECTORS.FILETREE);
        if (filetree && filetree.querySelector('li')) {
          console.log('[UYAP-EXT] Filetree loaded with content');
          resolve(filetree);
          return;
        }
        if (Date.now() - startTime > timeout) {
          reject(new Error('Filetree load timeout'));
          return;
        }
        setTimeout(check, TIMEOUTS.POLLING_INTERVAL);
      }
      check();
    });
  }
}
