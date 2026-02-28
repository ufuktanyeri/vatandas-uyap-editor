/**
 * main.js - Uygulama orkestratörü (AppController class)
 *
 * T-18: bindEvents → #bindDrawerEvents + #bindScanEvents +
 *       #bindSelectionEvents + #bindDownloadEvents
 * FALLBACK event handler'lar kaldırıldı (T-1).
 */

class AppController {
  #modalObserver = null;
  #eventRegistry = new Map();

  init() {
    UI.createUI();

    AppState.onReset = () => {
      UI.renderEvraklar();
      let resetHtml = '<p>Başlatmak için <strong>Dosyaları Tara</strong> butonuna tıklayın.</p>';
      resetHtml += this.#buildOturumStatsHtml();
      UI.updateStats(resetHtml);
      UI.showMode('scan');

      const fab = document.getElementById('uyap-ext-fab');
      if (fab) fab.classList.remove('uyap-ext-fab--pulse');
    };

    this.#bindEvents();
    this.#observeModal();
    window.addEventListener('beforeunload', () => this.#destroy());
    console.log('[UYAP-EXT] UI initialized, observing modal...');
  }

  // --- T-18: bindEvents split ---

  #bindEvents() {
    this.#bindDrawerEvents();
    this.#bindScanEvents();
    this.#bindSelectionEvents();
    this.#bindDownloadEvents();
  }

  #bindDrawerEvents() {
    const fab = document.getElementById('uyap-ext-fab');
    if (fab) this.#on(fab, 'click', () => UI.openDrawer());

    const closeBtn = document.getElementById('uyap-ext-close');
    if (closeBtn) this.#on(closeBtn, 'click', () => UI.closeDrawer());

    const overlay = document.getElementById('uyap-ext-overlay');
    if (overlay) this.#on(overlay, 'click', () => UI.closeDrawer());
  }

  #bindScanEvents() {
    const scanBtn = document.getElementById('uyap-ext-scan');
    if (scanBtn) this.#on(scanBtn, 'click', () => this.#handleScan());
  }

  #bindSelectionEvents() {
    const selectAllBtn = document.getElementById('uyap-ext-select-all');
    if (selectAllBtn) {
      this.#on(selectAllBtn, 'click', () => {
        AppState.tumunuSec();
        UI.renderEvraklar();
      });
    }

    const deselectAllBtn = document.getElementById('uyap-ext-deselect-all');
    if (deselectAllBtn) {
      this.#on(deselectAllBtn, 'click', () => {
        AppState.secimiTemizle();
        UI.renderEvraklar();
      });
    }

    const modeToggle = document.getElementById('uyap-ext-mode-toggle');
    if (modeToggle) {
      this.#on(modeToggle, 'change', (e) => {
        AppState.useSimpleMode = !e.target.checked;
        const label = document.getElementById('uyap-ext-mode-label');
        if (label) label.textContent = e.target.checked ? 'Gelişmiş Mod' : 'Basit Mod';
      });
      modeToggle.checked = true;
      AppState.useSimpleMode = false;
    }

    const body = document.getElementById('uyap-ext-body');
    if (body) {
      this.#on(body, 'change', (e) => this.#handleBodyChange(e));
      this.#on(body, 'click', (e) => this.#handleBodyClick(e));
    }
  }

  #bindDownloadEvents() {
    const downloadBtn = document.getElementById('uyap-ext-download');
    if (downloadBtn) this.#on(downloadBtn, 'click', () => this.#handleDownload());

    const pauseBtn = document.getElementById('uyap-ext-pause');
    if (pauseBtn) this.#on(pauseBtn, 'click', () => this.#handlePause());

    const cancelBtn = document.getElementById('uyap-ext-cancel');
    if (cancelBtn) this.#on(cancelBtn, 'click', () => this.#handleCancel());
  }

  // --- Delegated event handlers ---

  #handleBodyChange(e) {
    const target = e.target;

    if (target.classList.contains('uyap-ext-folder-checkbox')) {
      const fullPath = target.dataset.path;
      const node = AppState.findNodeByPath(AppState.treeData, fullPath);
      if (!node) {
        console.warn('[UYAP-EXT] Folder node not found:', fullPath);
        return;
      }
      if (target.checked) {
        AppState.selectAllInFolder(node);
      } else {
        AppState.deselectAllInFolder(node);
      }
      UI.renderEvraklar();
      return;
    }

    if (target.classList.contains('uyap-ext-file-checkbox')) {
      const evrakId = target.dataset.evrakId;
      if (evrakId) {
        AppState.toggleEvrakSecimi(evrakId);
        UI.updateSelectionUI();
      }
    }
  }

  #handleBodyClick(e) {
    const treeHeader = e.target.closest('.uyap-ext-tree-header');
    if (!treeHeader) return;
    if (e.target.classList.contains('uyap-ext-folder-checkbox')) return;

    const fullPath = treeHeader.dataset.path;
    AppState.toggleFolderExpanded(fullPath);
    UI.renderEvraklar();
  }

  // --- Scan ---

  async #handleScan() {
    UI.showMode('scanning');
    UI.updateStats(UI_MESSAGES.SCAN_IN_PROGRESS);

    try {
      await Scanner.waitForFiletree(30000);

      const scanResult = Scanner.scanFiletree();
      AppState.evraklar = scanResult.flatList;
      AppState.treeData = scanResult.tree;

      this.#expandAllFolders(scanResult.tree);

      AppState.pagination = Scanner.detectPagination();

      const dosya = Scanner.getDosyaBilgileri();
      AppState.dosyaBilgileri = dosya;

      if (dosya) {
        const gecmis = AppState.getDosyaGecmisi(dosya.dosyaId);
        if (gecmis) {
          AppState.restoreDosyaContext(dosya.dosyaId);
          console.log('[UYAP-EXT] Returning to previously scanned dosya:', dosya.dosyaId);
        }
      }

      if (!AppState.kisiAdi) AppState.kisiAdi = Scanner.findKisiAdi();

      AppState.tumunuSec();
      UI.renderEvraklar();

      const seciliSayisi = AppState.seciliEvrakIds.size;
      let statsHtml = `<p><strong>${seciliSayisi}</strong> evrak bulundu</p>`;
      if (dosya) {
        statsHtml += `<p>Dosya ID: <strong>${escapeHtml(dosya.dosyaId)}</strong>`;
        if (dosya.dosyaNo) statsHtml += ` | No: <strong>${escapeHtml(dosya.dosyaNo)}</strong>`;
        const yargiAdi = YARGI_TURLERI[dosya.yargiTuru];
        if (yargiAdi) statsHtml += ` | <strong>${escapeHtml(yargiAdi)}</strong>`;
        statsHtml += '</p>';
      }
      if (AppState.pagination?.hasMultiplePages) {
        statsHtml += `<p style="color:var(--uyap-color-warning);">⚠ Sayfa ${escapeHtml(String(AppState.pagination.currentPage))}/${escapeHtml(String(AppState.pagination.totalPages))} - Sadece mevcut sayfa tarandı</p>`;
      }
      if (AppState.kisiAdi && AppState.kisiAdi !== 'Bilinmeyen') {
        statsHtml += `<p>Kişi: <strong>${escapeHtml(AppState.kisiAdi)}</strong></p>`;
      }
      statsHtml += this.#buildOturumStatsHtml();
      UI.updateStats(statsHtml);

      UI.showMode('select');

      console.log('[UYAP-EXT] Scan complete:', {
        evrakCount: scanResult.flatList.length,
        dosyaId: dosya ? dosya.dosyaId : null,
        kisiAdi: AppState.kisiAdi
      });

    } catch (err) {
      console.error('[UYAP-EXT] Scan failed:', err);
      UI.updateStats(`<p style="color:var(--uyap-color-error);">⚠ Tarama başarısız: ${escapeHtml(err.message)}</p>`);
      UI.showMode('scan');
    }
  }

  #expandAllFolders(nodes) {
    for (const node of nodes) {
      if (node.type === 'folder') {
        AppState.expandedFolders.add(node.fullPath);
        if (node.children) this.#expandAllFolders(node.children);
      }
    }
  }

  // --- Download ---

  async #handleDownload() {
    const seciliEvraklar = AppState.getSeciliEvraklar();
    if (seciliEvraklar.length === 0) return;

    if (!AppState.dosyaBilgileri) {
      UI.updateStats('<p style="color:var(--uyap-color-error);">⚠ Dosya bilgileri bulunamadı. Yeniden tarayın.</p>');
      return;
    }

    AppState.downloadStatus = 'downloading';
    AppState.stats = { total: seciliEvraklar.length, completed: 0, failed: 0 };
    AppState.sessionExpired = false;

    UI.showMode('downloading');
    UI.updateProgress(0, seciliEvraklar.length, 'downloading');

    const result = await Downloader.downloadAll(
      seciliEvraklar,
      AppState.dosyaBilgileri,
      AppState.settings,
      (progress) => {
        if (progress.status === 'completed') {
          AppState.stats.completed++;
          AppState.downloadedEvrakIds.add(progress.evrakId);
        } else if (progress.status === 'failed') {
          AppState.stats.failed++;
          UI.showProgressError(`Hata: ${progress.error} (${progress.evrakId})`);
        }
        UI.updateProgress(progress.current, progress.total,
          AppState.downloadStatus === 'paused' ? 'paused' : 'downloading');
      },
      () => {
        AppState.sessionExpired = true;
        AppState.downloadStatus = 'error';
        UI.showSessionAlert();
        UI.updateProgress(AppState.stats.completed, AppState.stats.total, 'error');
        UI.showMode('completed');
      },
      AppState.useSimpleMode
    );

    if (!result.sessionExpired) {
      AppState.downloadStatus = 'completed';
      UI.updateProgress(result.completed, result.total, 'completed');

      let statsHtml = `<p>${UI_MESSAGES.SUCCESS_ICON} <strong>${result.completed}</strong> ${UI_MESSAGES.DOWNLOAD_COMPLETE}` +
        (result.failed > 0 ? `, <strong style="color:var(--uyap-color-error);">${result.failed}</strong> başarısız` : '') +
        ` / ${result.total} toplam</p>`;
      statsHtml += this.#buildOturumStatsHtml();
      UI.updateStats(statsHtml);
      UI.showMode('completed');
    }
  }

  // --- Controls ---

  #handlePause() {
    const pauseBtn = document.getElementById('uyap-ext-pause');
    if (!pauseBtn) return;

    if (Downloader.isPausedState()) {
      Downloader.resume();
      AppState.downloadStatus = 'downloading';
      pauseBtn.innerHTML = '<i class="fa fa-pause uyap-ext-icon-spacing-sm"></i>Duraklat';
      pauseBtn.className = 'uyap-ext-btn uyap-ext-btn--warning uyap-ext-btn--flex1';
    } else {
      Downloader.pause();
      AppState.downloadStatus = 'paused';
      pauseBtn.innerHTML = '<i class="fa fa-play uyap-ext-icon-spacing-sm"></i>Devam Et';
      pauseBtn.className = 'uyap-ext-btn uyap-ext-btn--primary uyap-ext-btn--flex1';
      UI.updateProgress(AppState.stats.completed, AppState.stats.total, 'paused');
    }
  }

  #handleCancel() {
    Downloader.cancel();
    AppState.downloadStatus = 'idle';
    UI.showMode('completed');
  }

  // --- Session Summary ---

  #buildOturumStatsHtml() {
    const ozet = AppState.getOturumOzeti();
    if (ozet.dosyalar.length === 0) return '';

    let html = '<div class="uyap-ext-session-summary">';
    html += `<p><i class="fa fa-history uyap-ext-icon-spacing-sm"></i>Oturum: <strong>${ozet.dosyalar.length}</strong> dosya`;
    if (ozet.toplamIndirilen > 0) html += `, <strong>${ozet.toplamIndirilen}</strong> evrak indirildi`;
    html += '</p>';

    for (const d of ozet.dosyalar) {
      const durumIcon = d.indirilenSayisi > 0 ? UI_MESSAGES.SUCCESS_ICON : '';
      const yargiLabel = d.yargiTuruAdi ? escapeHtml(d.yargiTuruAdi) : '';
      const dosyaNo = d.dosyaNo ? escapeHtml(d.dosyaNo) : escapeHtml(d.dosyaId);
      html += `<p class="uyap-ext-session-item">${durumIcon} ${yargiLabel} ${dosyaNo}: `;
      html += `${d.indirilenSayisi}/${d.evrakSayisi} evrak`;
      if (d.basarisizSayisi > 0) html += ` (${d.basarisizSayisi} başarısız)`;
      html += '</p>';
    }

    html += '</div>';
    return html;
  }

  // --- Modal Observer ---

  #observeModal() {
    let debounceTimer = null;

    this.#modalObserver = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        const visible = this.#isModalVisible();
        if (visible && !AppState.initialized) {
          console.log('[UYAP-EXT] UYAP modal detected');
          AppState.initialized = true;
          const fab = document.getElementById('uyap-ext-fab');
          if (fab) fab.classList.add('uyap-ext-fab--pulse');
        } else if (!visible && AppState.initialized) {
          console.log('[UYAP-EXT] UYAP modal closed');
          if (AppState.dosyaBilgileri) AppState.saveDosyaContext();
          AppState.resetActiveDosya();
        }
      }, TIMEOUTS.MUTATION_DEBOUNCE);
    });

    const modalEl = document.querySelector(SELECTORS.MODAL);
    const target = (modalEl && modalEl.parentElement) || document.body;

    this.#modalObserver.observe(target, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['class', 'style']
    });

    if (this.#isModalVisible()) {
      console.log('[UYAP-EXT] UYAP modal already visible');
      AppState.initialized = true;
    }
  }

  #isModalVisible() {
    const modal = document.querySelector(SELECTORS.MODAL);
    if (!modal) return false;

    const style = window.getComputedStyle(modal);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (modal.classList.contains('show') || modal.classList.contains('in')) return true;

    return modal.offsetWidth > 0 && modal.offsetHeight > 0;
  }

  // --- Event Registration & Cleanup ---

  #on(element, event, handler) {
    if (!this.#eventRegistry.has(element)) this.#eventRegistry.set(element, []);
    this.#eventRegistry.get(element).push({ event, handler });
    element.addEventListener(event, handler);
  }

  #destroy() {
    if (this.#modalObserver) {
      this.#modalObserver.disconnect();
      this.#modalObserver = null;
    }

    for (const [element, handlers] of this.#eventRegistry) {
      for (const { event, handler } of handlers) {
        element.removeEventListener(event, handler);
      }
    }
    this.#eventRegistry.clear();
    Downloader.cancel();
    console.log('[UYAP-EXT] Content script cleanup complete');
  }
}

// Bootstrap
(() => {
  'use strict';
  console.log('[UYAP-EXT] Content script loaded');

  const app = new AppController();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
  } else {
    app.init();
  }
})();
