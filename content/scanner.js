/**
 * scanner.js - UYAP DOM tarama ve evrak çıkarma
 * Kaynak: v2/src/content/scanner.ts
 *
 * Özellikler:
 * - Filetree parsing (recursive)
 * - Set ile deduplikasyon (352 span → 206 unique evrak_id)
 * - Tooltip metadata parsing
 * - Pagination detection
 * - jQuery event handler parse (dosyaId/yargiTuru)
 * - "Son 20 Evrak" klasörü atlama
 */

/**
 * dosyaId'yi sayfadan bul
 * Yaklaşım 1: HTML regex (en güvenilir)
 * Yaklaşım 2: jQuery event handler parse
 */
function findDosyaId() {
  // Yaklaşım 1: HTML regex
  const htmlMatch = document.body.innerHTML.match(/dosyaId\s*=\s*['"]?(\d+)['"]?/);
  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1];
  }

  // Yaklaşım 2: jQuery event handler parse
  try {
    const fileSpan = document.querySelector('span.file[evrak_id]');
    if (fileSpan && typeof window.jQuery !== 'undefined') {
      const events = window.jQuery._data && window.jQuery._data(fileSpan, 'events');
      if (events && events.dblclick && events.dblclick[0]) {
        const handlerStr = events.dblclick[0].handler.toString();
        const match = handlerStr.match(/downloadDoc\([^,]+,\s*['"]([^'"]+)['"]/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
  } catch (err) {
    console.warn('[UYAP-EXT] jQuery event parse failed:', err);
  }

  console.warn('[UYAP-EXT] dosyaId not found');
  return null;
}

/**
 * yargiTuru'nü fallback zinciriyle al
 * 1. jQuery event handler
 * 2. #yargiTuru select element
 * 3. Varsayılan: "1" (Hukuk)
 */
function getYargiTuru() {
  // Fallback 1: jQuery event handler parse
  try {
    const fileSpan = document.querySelector('span.file[evrak_id]');
    if (fileSpan && typeof window.jQuery !== 'undefined') {
      const events = window.jQuery._data && window.jQuery._data(fileSpan, 'events');
      if (events && events.dblclick && events.dblclick[0]) {
        const handlerStr = events.dblclick[0].handler.toString();
        const match = handlerStr.match(/downloadDoc\([^,]+,\s*[^,]+,\s*['"]([^'"]+)['"]/);
        if (match && match[1] && match[1].trim() !== '') {
          return match[1].trim();
        }
      }
    }
  } catch (err) {
    console.warn('[UYAP-EXT] jQuery yargiTuru parse failed:', err);
  }

  // Fallback 2: Select element
  const selectEl = document.querySelector(SELECTORS.YARGI_TURU_SELECT);
  if (selectEl && selectEl.value && selectEl.value.trim() !== '') {
    return selectEl.value.trim();
  }

  // Fallback 3: Varsayılan
  return DEFAULT_YARGI_TURU;
}

/**
 * Kullanıcı adını header'dan bul
 */
function findKisiAdi() {
  const headerEl = document.querySelector(SELECTORS.USERNAME);
  if (headerEl && headerEl.textContent) {
    return sanitizeName(headerEl.textContent.trim());
  }

  const adElement = document.getElementById('ad');
  if (adElement && adElement.textContent) {
    return sanitizeName(adElement.textContent.trim());
  }

  return 'Bilinmeyen';
}

/**
 * Dosya bilgilerini DOM'dan al
 */
function getDosyaBilgileri() {
  const dosyaId = findDosyaId();
  if (!dosyaId) {
    console.error('[UYAP-EXT] dosyaId not found in page');
    return null;
  }

  const dosyaNoMatch = document.body.innerHTML.match(/Dosya\s+No\s*:?\s*([^\s<]+)/i);
  const dosyaNo = dosyaNoMatch ? dosyaNoMatch[1] : '';

  return {
    dosyaId,
    dosyaNo,
    yargiTuru: getYargiTuru()
  };
}

/**
 * Tooltip'ten metadata çıkar
 * UYAP evrak metadata'yı data-original-title attribute'unda saklar
 * Format: "Birim Evrak No: 12345<br>Onay Tarihi: 15.01.2024<br>..."
 */
function parseTooltip(tooltip) {
  const result = {};
  if (!tooltip) return result;

  const lines = tooltip.split(/<br\s*\/?>|\n/gi);
  for (const line of lines) {
    const clean = line.replace(/<[^>]*>/g, '').trim();
    const colonIndex = clean.indexOf(':');
    if (colonIndex === -1) continue;

    const key = clean.substring(0, colonIndex).trim();
    const value = clean.substring(colonIndex + 1).trim();
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * UYAP filetree'yi tara ve evrak listesi çıkar
 *
 * KRİTİK: Set ile deduplikasyon (352 span → 206 unique evrak_id)
 * KRİTİK: "Son 20 Evrak" klasörünü atla (duplikasyon kaynağı)
 * KRİTİK: Sadece DOM okur, asla değiştirmez (jQuery event'leri bağlı!)
 */
function scanFiletree() {
  const filetree = document.querySelector(SELECTORS.FILETREE);
  if (!filetree) {
    console.warn('[UYAP-EXT] Filetree not found');
    return [];
  }

  const seen = new Set();
  const evraklar = [];

  function parseNode(ul, currentPath) {
    const items = ul.querySelectorAll(':scope > li');

    items.forEach(li => {
      const span = li.querySelector(':scope > span');
      const childUl = li.querySelector(':scope > ul');
      if (!span) return;

      const name = (span.textContent || '').trim();
      const isFolder = span.classList.contains('folder');

      if (isFolder) {
        // "Son 20 Evrak" gibi duplikasyon klasörlerini atla
        if (SKIP_FOLDERS.some(skip => name.includes(skip))) return;

        const newPath = currentPath ? `${currentPath}/${name}` : name;
        if (childUl) parseNode(childUl, newPath);
      } else {
        const evrakId = span.getAttribute('evrak_id');
        if (!evrakId) return;

        // Deduplikasyon
        if (seen.has(evrakId)) return;
        seen.add(evrakId);

        // Tooltip metadata
        const tooltip = span.getAttribute('data-original-title');
        const metadata = parseTooltip(tooltip);

        evraklar.push({
          evrakId,
          name,
          relativePath: currentPath,
          evrakTuru: metadata['Evrak Türü'] || '',
          evrakTarihi: metadata['Evrak Tarihi'] || ''
        });
      }
    });
  }

  parseNode(filetree, '');
  console.log(`[UYAP-EXT] Scanner: Found ${evraklar.length} unique evraklar`);

  // Nested tree yapısını oluştur
  const tree = buildTreeFromFlat(evraklar);

  return {
    tree,           // Nested structure
    flatList: evraklar  // Backward compat
  };
}

/**
 * Flat list'ten nested tree yapısı oluştur
 * @param {Array} flatList - Scanner'dan gelen flat evrak listesi
 * @returns {Array} Nested tree nodes
 */
function buildTreeFromFlat(flatList) {
  const root = {};

  flatList.forEach(evrak => {
    const pathParts = evrak.relativePath
      ? evrak.relativePath.split('/')
      : [];

    let current = root;
    const currentPath = [];

    // Klasörleri oluştur
    pathParts.forEach(folderName => {
      currentPath.push(folderName);
      const fullPath = currentPath.join('/');

      if (!current[folderName]) {
        current[folderName] = {
          type: 'folder',
          name: folderName,
          path: [...currentPath],
          fullPath,
          children: {}
        };
      }
      current = current[folderName].children;
    });

    // Dosyayı ekle
    const fileNode = {
      type: 'file',
      name: evrak.name,
      fullPath: pathParts.length > 0
        ? `${evrak.relativePath}/${evrak.name}`
        : evrak.name,
      evrakId: evrak.evrakId,
      metadata: {
        evrakTuru: evrak.evrakTuru,
        evrakTarihi: evrak.evrakTarihi
      }
    };

    current[evrak.name] = fileNode;
  });

  // Object'i array'e çevir (recursive)
  function objectToArray(obj) {
    return Object.values(obj)
      .map(node => {
        if (node.type === 'folder') {
          node.children = objectToArray(node.children);
        }
        return node;
      })
      .filter(node => node.type); // Sadece valid node'lar
  }

  return objectToArray(root);
}

/**
 * Filetree'de sayfalama olup olmadığını tespit et
 * UYAP "Toplam X sayfadan Y. sayfa" gösterir
 */
function detectPagination() {
  const resultContainer = document.querySelector(SELECTORS.EVRAK_RESULT);
  if (!resultContainer) return null;

  const text = resultContainer.textContent || '';
  const match = text.match(/Toplam\s+(\d+)\s+sayfadan\s+(\d+)\.\s*sayfa/i);
  if (!match) return null;

  const totalPages = parseInt(match[1], 10);
  const currentPage = parseInt(match[2], 10);

  return {
    currentPage,
    totalPages,
    hasMultiplePages: totalPages > 1
  };
}

/**
 * Filetree'nin DOM'a yüklenmesini bekle
 */
function waitForFiletree(timeout) {
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
