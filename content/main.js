/**
 * main.js - Uygulama orkestratoru
 * v2'nin content/index.tsx mantığı + v4'ün init akışı
 *
 * Akış:
 * 1. DOM hazır olunca UI oluştur
 * 2. UYAP modal'ını gözle (MutationObserver)
 * 3. Modal açılınca → Tarama hazır
 * 4. FAB → Drawer aç
 * 5. "Dosyaları Tara" → filetree parse → evrakları listele
 * 6. Seçim → "İndir" → Downloader başlat
 */

(() => {
  'use strict';

  console.log('[UYAP-EXT] Content script loaded');

  // ===== CLEANUP INFRASTRUCTURE =====

  // Module-scoped cleanup variables
  let modalObserver = null;
  const eventRegistry = new Map();

  /**
   * Event listener kayıt sistemi
   * Tüm listener'ları track eder, cleanup için
   */
  function registerEventListener(element, event, handler) {
    if (!eventRegistry.has(element)) {
      eventRegistry.set(element, []);
    }
    eventRegistry.get(element).push({ event, handler });
    element.addEventListener(event, handler);
  }

  /**
   * MutationObserver cleanup
   */
  function cleanupObservers() {
    if (modalObserver) {
      modalObserver.disconnect();
      modalObserver = null;
      console.log('[UYAP-EXT] MutationObserver cleaned up');
    }
  }

  /**
   * Event listener'ları temizle
   */
  function cleanupEventListeners() {
    for (const [element, handlers] of eventRegistry) {
      handlers.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    }
    eventRegistry.clear();
    console.log('[UYAP-EXT] Event listeners cleaned up');
  }

  // ===== INIT =====

  function init() {
    UI.createUI();
    bindEvents();
    observeModal();

    AppState.onReset = () => {
      UI.renderEvraklar();
      let resetHtml = '<p>Başlatmak için <strong>Dosyaları Tara</strong> butonuna tıklayın.</p>';
      resetHtml += buildOturumStatsHtml();
      UI.updateStats(resetHtml);
      UI.showMode('scan');

      const fab = document.getElementById('uyap-ext-fab');
      if (fab) fab.classList.remove('uyap-ext-fab--pulse');
    };

    // Beforeunload cleanup
    window.addEventListener('beforeunload', () => {
      cleanupObservers();
      cleanupEventListeners();
      Downloader.cancel();
      console.log('[UYAP-EXT] Content script cleanup complete');
    });

    console.log('[UYAP-EXT] UI initialized, observing modal...');
  }

  // ===== EVENT BINDING =====

  function bindEvents() {
    // FAB → Drawer aç
    const fab = document.getElementById('uyap-ext-fab');
    if (fab) {
      registerEventListener(fab, 'click', () => UI.openDrawer());
    }

    // Close → Drawer kapat
    const closeBtn = document.getElementById('uyap-ext-close');
    if (closeBtn) {
      registerEventListener(closeBtn, 'click', () => UI.closeDrawer());
    }

    // Overlay → Drawer kapat
    const overlay = document.getElementById('uyap-ext-overlay');
    if (overlay) {
      registerEventListener(overlay, 'click', () => UI.closeDrawer());
    }

    // Tara butonu
    const scanBtn = document.getElementById('uyap-ext-scan');
    if (scanBtn) {
      registerEventListener(scanBtn, 'click', handleScan);
    }

    // Tümünü seç
    const selectAllBtn = document.getElementById('uyap-ext-select-all');
    if (selectAllBtn) {
      registerEventListener(selectAllBtn, 'click', () => {
        AppState.tumunuSec();
        UI.renderEvraklar();
      });
    }

    // Seçimi kaldır
    const deselectAllBtn = document.getElementById('uyap-ext-deselect-all');
    if (deselectAllBtn) {
      registerEventListener(deselectAllBtn, 'click', () => {
        AppState.secimiTemizle();
        UI.renderEvraklar();
      });
    }

    // İndir butonu
    const downloadBtn = document.getElementById('uyap-ext-download');
    if (downloadBtn) {
      registerEventListener(downloadBtn, 'click', handleDownload);
    }

    // Duraklat butonu
    const pauseBtn = document.getElementById('uyap-ext-pause');
    if (pauseBtn) {
      registerEventListener(pauseBtn, 'click', handlePause);
    }

    // İptal butonu
    const cancelBtn = document.getElementById('uyap-ext-cancel');
    if (cancelBtn) {
      registerEventListener(cancelBtn, 'click', handleCancel);
    }

    // İndirme modu toggle
    const modeToggle = document.getElementById('uyap-ext-mode-toggle');
    if (modeToggle) {
      const handleModeChange = (e) => {
        AppState.useSimpleMode = !e.target.checked;
        const label = document.getElementById('uyap-ext-mode-label');
        if (label) {
          label.textContent = e.target.checked ? 'Gelişmiş Mod' : 'Basit Mod';
        }
      };
      registerEventListener(modeToggle, 'change', handleModeChange);
      // Varsayılan: Gelişmiş mod (checkbox checked)
      modeToggle.checked = true;
      AppState.useSimpleMode = false;
    }

    // Delegated events: evrak checkbox'ları ve grup checkbox'ları
    const body = document.getElementById('uyap-ext-body');
    if (body) {
      const handleBodyChange = (e) => {
        const target = e.target;

        // YENİ: Folder checkbox (tree view)
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

        // File checkbox (evrak checkbox)
        if (target.classList.contains('uyap-ext-card__checkbox')) {
          const evrakId = target.dataset.evrakId;
          if (evrakId) {
            AppState.toggleEvrakSecimi(evrakId);
            UI.updateSelectionUI();
          }
          return;
        }

        // FALLBACK: Eski grup checkbox mantığı
        if (target.classList.contains('uyap-ext-group__checkbox')) {
          const folderName = target.dataset.folder;
          if (folderName) {
            if (target.checked) {
              AppState.klasorEvraklariniSec(folderName);
            } else {
              AppState.klasorEvraklariniKaldir(folderName);
            }
            UI.renderEvraklar();
          }
        }
      };
      registerEventListener(body, 'change', handleBodyChange);

      // Grup header tıklama → aç/kapa
      const handleBodyClick = (e) => {
        // YENİ: Tree header toggle
        const treeHeader = e.target.closest('.uyap-ext-tree-header');
        if (treeHeader) {
          // Checkbox tıklamasını atla
          if (e.target.classList.contains('uyap-ext-folder-checkbox')) return;

          const fullPath = treeHeader.dataset.path;
          AppState.toggleFolderExpanded(fullPath);
          UI.renderEvraklar();
          return;
        }

        // FALLBACK: Eski grup header mantığı (backward compat)
        const header = e.target.closest('.uyap-ext-group__header');
        if (!header) return;

        // Checkbox tıklamasını atla (change event'i handle eder)
        if (e.target.classList.contains('uyap-ext-group__checkbox')) return;

        const groupIndex = header.dataset.group;
        const bodyEl = document.querySelector(`[data-group-body="${groupIndex}"]`);
        const toggle = header.querySelector('.uyap-ext-group__toggle');

        if (bodyEl) {
          const isOpen = bodyEl.style.display !== 'none';
          bodyEl.style.display = isOpen ? 'none' : '';
          if (toggle) {
            toggle.classList.toggle('uyap-ext-group__toggle--open', !isOpen);
          }
        }
      };
      registerEventListener(body, 'click', handleBodyClick);
    }
  }

  // ===== OTURUM OZETI =====

  /**
   * Birden fazla dosya tarandi ise oturum gecmisi HTML'i olustur.
   */
  function buildOturumStatsHtml() {
    const ozet = AppState.getOturumOzeti();
    if (ozet.dosyalar.length === 0) return '';

    let html = '<div class="uyap-ext-session-summary">';
    html += `<p><i class="fa fa-history uyap-ext-icon-spacing-sm"></i>Oturum: <strong>${ozet.dosyalar.length}</strong> dosya`;
    if (ozet.toplamIndirilen > 0) {
      html += `, <strong>${ozet.toplamIndirilen}</strong> evrak indirildi`;
    }
    html += '</p>';

    ozet.dosyalar.forEach(d => {
      const durumIcon = d.indirilenSayisi > 0 ? UI_MESSAGES.SUCCESS_ICON : '';
      const yargiLabel = d.yargiTuruAdi ? escapeHtml(d.yargiTuruAdi) : '';
      const dosyaNo = d.dosyaNo ? escapeHtml(d.dosyaNo) : escapeHtml(d.dosyaId);
      html += `<p class="uyap-ext-session-item">${durumIcon} ${yargiLabel} ${dosyaNo}: `;
      html += `${d.indirilenSayisi}/${d.evrakSayisi} evrak`;
      if (d.basarisizSayisi > 0) html += ` (${d.basarisizSayisi} başarısız)`;
      html += '</p>';
    });

    html += '</div>';
    return html;
  }

  // ===== TARAMA =====

  async function handleScan() {
    UI.showMode('scanning');
    UI.updateStats(UI_MESSAGES.SCAN_IN_PROGRESS);

    try {
      await waitForFiletree(30000);

      // Tarama - YENİ: Tree + flat list döner
      const scanResult = scanFiletree();
      AppState.evraklar = scanResult.flatList;  // Backward compat
      AppState.treeData = scanResult.tree;       // YENİ: Tree data

      // Tüm klasörleri varsayılan olarak aç
      function expandAllFolders(nodes) {
        nodes.forEach(node => {
          if (node.type === 'folder') {
            AppState.expandedFolders.add(node.fullPath);
            if (node.children) expandAllFolders(node.children);
          }
        });
      }
      expandAllFolders(scanResult.tree);

      // Pagination kontrolü
      const pagination = detectPagination();
      AppState.pagination = pagination;

      // Dosya bilgileri
      const dosya = getDosyaBilgileri();
      AppState.dosyaBilgileri = dosya;

      // Gecmis kontrolu — daha once taranan dosyaya donuluyor mu?
      if (dosya) {
        const gecmis = AppState.getDosyaGecmisi(dosya.dosyaId);
        if (gecmis) {
          AppState.restoreDosyaContext(dosya.dosyaId);
          console.log('[UYAP-EXT] Returning to previously scanned dosya:', dosya.dosyaId);
        }
      }

      // Kişi adı
      if (!AppState.kisiAdi) {
        AppState.kisiAdi = findKisiAdi();
      }

      // Tümünü seç (varsayılan)
      AppState.tumunuSec();

      // Stats güncelle
      let statsHtml = `<p><strong>${scanResult.flatList.length}</strong> evrak bulundu</p>`;
      if (dosya) {
        statsHtml += `<p>Dosya ID: <strong>${escapeHtml(dosya.dosyaId)}</strong>`;
        if (dosya.dosyaNo) statsHtml += ` | No: <strong>${escapeHtml(dosya.dosyaNo)}</strong>`;
        const yargiAdi = YARGI_TURLERI[dosya.yargiTuru];
        if (yargiAdi) statsHtml += ` | <strong>${escapeHtml(yargiAdi)}</strong>`;
        statsHtml += `</p>`;
      }
      if (pagination && pagination.hasMultiplePages) {
        statsHtml += `<p style="color:var(--uyap-color-warning);">⚠ Sayfa ${pagination.currentPage}/${pagination.totalPages} - Sadece mevcut sayfa tarandı</p>`;
      }
      if (AppState.kisiAdi && AppState.kisiAdi !== 'Bilinmeyen') {
        statsHtml += `<p>Kişi: <strong>${escapeHtml(AppState.kisiAdi)}</strong></p>`;
      }
      // Oturum gecmisi ozeti (birden fazla dosya tarandi ise)
      statsHtml += buildOturumStatsHtml();
      UI.updateStats(statsHtml);

      // Evrakları render et
      UI.renderEvraklar();
      UI.showMode('select');

      console.log('[UYAP-EXT] Scan complete:', {
        evrakCount: scanResult.flatList.length,
        dosyaId: dosya ? dosya.dosyaId : null,
        kisiAdi: AppState.kisiAdi
      });

    } catch (err) {
      console.error('[UYAP-EXT] Scan failed:', err);
      UI.updateStats(`<p style="color:#dc2626;">⚠ Tarama başarısız: ${escapeHtml(err.message)}</p>`);
      UI.showMode('scan');
    }
  }

  // ===== İNDİRME =====

  async function handleDownload() {
    const seciliEvraklar = AppState.getSeciliEvraklar();
    if (seciliEvraklar.length === 0) return;

    if (!AppState.dosyaBilgileri) {
      UI.updateStats('<p style="color:#dc2626;">⚠ Dosya bilgileri bulunamadı. Yeniden tarayın.</p>');
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
      statsHtml += buildOturumStatsHtml();
      UI.updateStats(statsHtml);
      UI.showMode('completed');
    }
  }

  // ===== KONTROLLER =====

  function handlePause() {
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

  function handleCancel() {
    Downloader.cancel();
    AppState.downloadStatus = 'idle';
    UI.showMode('completed');
  }

  // ===== MODAL GÖZLEM =====

  /**
   * UYAP modal'ının açılıp kapanmasını gözle
   * Modal element DOM'da her zaman boş kabuk olarak bulunur,
   * visibility kontrolü yapılmalı
   */
  function isModalVisible() {
    const modal = document.querySelector(SELECTORS.MODAL);
    if (!modal) return false;

    const style = window.getComputedStyle(modal);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (modal.classList.contains('show') || modal.classList.contains('in')) return true;

    return modal.offsetWidth > 0 && modal.offsetHeight > 0;
  }

  function observeModal() {
    let debounceTimer = null;

    // Module-scoped observer'a ata (cleanup için)
    modalObserver = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        const visible = isModalVisible();
        if (visible && !AppState.initialized) {
          console.log('[UYAP-EXT] UYAP modal detected');
          AppState.initialized = true;
          // FAB pulse efekti ekle
          const fab = document.getElementById('uyap-ext-fab');
          if (fab) fab.classList.add('uyap-ext-fab--pulse');
        } else if (!visible && AppState.initialized) {
          console.log('[UYAP-EXT] UYAP modal closed');
          if (AppState.dosyaBilgileri) {
            AppState.saveDosyaContext();
          }
          AppState.resetActiveDosya();
        }
      }, TIMEOUTS.MUTATION_DEBOUNCE);
    });

    const modalEl = document.querySelector(SELECTORS.MODAL);
    const target = (modalEl && modalEl.parentElement) || document.body;

    modalObserver.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Halihazırda açık mı kontrol et
    if (isModalVisible()) {
      console.log('[UYAP-EXT] UYAP modal already visible');
      AppState.initialized = true;
    }
  }

  // ===== BAŞLAT =====

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
