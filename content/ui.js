/**
 * ui.js - UI bileşenleri
 * Kaynak: v4 UI pattern (FAB + drawer) + v2 bileşen yapısı
 *
 * Aşamalar:
 * 1. FAB butonu → Drawer aç
 * 2. Klasörler listelenir (checkbox ile seçim)
 * 3. "Evrakları Getir" → Seçili klasörlerin evrakları listelenir
 * 4. Evrak seçimi + "İndir" → Toplu indirme başlar
 * 5. Progress bar + durum gösterimi
 */

const UI = (() => {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /**
   * Ana UI yapısını oluştur
   */
  function createUI() {
    if ($('#uyap-extension-root')) return;

    const root = document.createElement('div');
    root.id = 'uyap-extension-root';
    root.innerHTML = `
      <button class="uyap-ext-fab" id="uyap-ext-fab" title="UYAP Evrak İndirici">
        <i class="fa fa-download"></i>
      </button>

      <div class="uyap-ext-drawer-overlay" id="uyap-ext-overlay"></div>

      <div class="uyap-ext-drawer" id="uyap-ext-drawer">
        <div class="uyap-ext-panel">

          <!-- Header -->
          <div class="uyap-ext-panel__header">
            <h3 class="uyap-ext-panel__title">
              <i class="fa fa-folder-open-o uyap-ext-icon-spacing"></i>UYAP Evrak İndirici
            </h3>
            <button class="uyap-ext-panel__close" id="uyap-ext-close" title="Kapat">
              <i class="fa fa-times"></i>
            </button>
          </div>

          <!-- Stats -->
          <div class="uyap-ext-panel__stats" id="uyap-ext-stats">
            <p>Başlatmak için <strong>Dosyaları Tara</strong> butonuna tıklayın.</p>
          </div>

          <!-- Session Alert (gizli) -->
          <div class="uyap-ext-alert" id="uyap-ext-session-alert" style="display:none;">
            <i class="fa fa-exclamation-triangle uyap-ext-alert__icon"></i>
            <div class="uyap-ext-alert__content">
              <p class="uyap-ext-alert__title">Oturum Sona Erdi</p>
              <p class="uyap-ext-alert__message">UYAP oturumunuz sona erdi. Sayfayı yenileyip tekrar giriş yapın.</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="uyap-ext-panel__actions">
            <div class="uyap-ext-panel__action-row">
              <button class="uyap-ext-btn uyap-ext-btn--primary uyap-ext-btn--flex1" id="uyap-ext-scan">
                <i class="fa fa-search uyap-ext-icon-spacing-sm"></i>Dosyaları Tara
              </button>
            </div>
            <div class="uyap-ext-panel__action-row" id="uyap-ext-selection-actions" style="display:none;">
              <button class="uyap-ext-btn uyap-ext-btn--secondary uyap-ext-btn--sm" id="uyap-ext-select-all">
                Tümünü Seç
              </button>
              <button class="uyap-ext-btn uyap-ext-btn--secondary uyap-ext-btn--sm" id="uyap-ext-deselect-all">
                Seçimi Kaldır
              </button>
            </div>
            <div class="uyap-ext-panel__action-row" id="uyap-ext-download-actions" style="display:none;">
              <button class="uyap-ext-btn uyap-ext-btn--primary uyap-ext-btn--flex1" id="uyap-ext-download" disabled>
                <i class="fa fa-download uyap-ext-icon-spacing-sm"></i>İndir (<span id="uyap-ext-selected-count">0</span>)
              </button>
            </div>
            <div class="uyap-ext-panel__action-row" id="uyap-ext-control-actions" style="display:none;">
              <button class="uyap-ext-btn uyap-ext-btn--warning uyap-ext-btn--flex1" id="uyap-ext-pause">
                <i class="fa fa-pause uyap-ext-icon-spacing-sm"></i>Duraklat
              </button>
              <button class="uyap-ext-btn uyap-ext-btn--danger uyap-ext-btn--sm" id="uyap-ext-cancel">
                <i class="fa fa-stop uyap-ext-icon-spacing-sm"></i>İptal
              </button>
            </div>
            <!-- İndirme modu toggle -->
            <div class="uyap-ext-panel__action-row" id="uyap-ext-mode-row">
              <label class="uyap-ext-mode-toggle" title="Basit Mod: UYAP'ın kendi indirme fonksiyonunu kullanır. Gelişmiş Mod: Dosya tipini algılar, retry yapar.">
                <input type="checkbox" id="uyap-ext-mode-toggle">
                <span class="uyap-ext-mode-label" id="uyap-ext-mode-label">Gelişmiş Mod</span>
              </label>
            </div>
          </div>

          <!-- Progress (gizli) -->
          <div class="uyap-ext-progress" id="uyap-ext-progress" style="display:none;">
            <div class="uyap-ext-progress__header">
              <span class="uyap-ext-progress__label" id="uyap-ext-progress-label">İndiriliyor...</span>
              <span class="uyap-ext-progress__value" id="uyap-ext-progress-value">0/0</span>
            </div>
            <div class="uyap-ext-progress__track">
              <div class="uyap-ext-progress__bar uyap-ext-progress__bar--downloading uyap-ext-progress__bar--animated"
                   id="uyap-ext-progress-bar" style="width:0%"></div>
            </div>
            <div class="uyap-ext-progress__error" id="uyap-ext-progress-error" style="display:none;"></div>
          </div>

          <!-- Body (scrollable evrak listesi) -->
          <div class="uyap-ext-panel__body" id="uyap-ext-body">
            <div class="uyap-ext-empty" id="uyap-ext-empty">
              <i class="fa fa-inbox"></i>
              Henüz tarama yapılmadı
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(root);
  }

  /**
   * Drawer'ı aç
   */
  function openDrawer() {
    const drawer = $('#uyap-ext-drawer');
    const overlay = $('#uyap-ext-overlay');
    if (drawer) drawer.classList.add('uyap-ext-drawer--open');
    if (overlay) overlay.classList.add('uyap-ext-drawer-overlay--open');
  }

  /**
   * Drawer'ı kapat
   */
  function closeDrawer() {
    const drawer = $('#uyap-ext-drawer');
    const overlay = $('#uyap-ext-overlay');
    if (drawer) drawer.classList.remove('uyap-ext-drawer--open');
    if (overlay) overlay.classList.remove('uyap-ext-drawer-overlay--open');
  }

  /**
   * Stats alanını güncelle
   */
  function updateStats(html) {
    const statsEl = $('#uyap-ext-stats');
    if (statsEl) statsEl.innerHTML = html;
  }

  /**
   * Evrak listesini gruplu şekilde render et
   */
  function renderEvraklar() {
    const body = $('#uyap-ext-body');
    const emptyEl = $('#uyap-ext-empty');
    if (!body) return;

    const groups = AppState.getGroupedEvraklar();

    if (groups.size === 0) {
      body.innerHTML = '';
      if (emptyEl) {
        emptyEl.style.display = '';
        body.appendChild(emptyEl);
      }
      return;
    }

    body.innerHTML = '';
    let groupIndex = 0;

    groups.forEach((evraklar, folderName) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'uyap-ext-group';
      groupEl.dataset.folder = folderName;

      // Klasörün tüm evrakları seçili mi kontrol et
      const allSelected = evraklar.every(e => AppState.seciliEvrakIds.has(e.evrakId));

      groupEl.innerHTML = `
        <div class="uyap-ext-group__header" data-group="${groupIndex}">
          <input type="checkbox" class="uyap-ext-group__checkbox"
                 data-folder="${folderName}" ${allSelected ? 'checked' : ''}>
          <span class="uyap-ext-group__toggle uyap-ext-group__toggle--open">
            <i class="fa fa-caret-right"></i>
          </span>
          <i class="fa fa-folder uyap-ext-group__folder-icon"></i>
          <span class="uyap-ext-group__name">${escapeHtml(folderName)}</span>
          <span class="uyap-ext-group__count">${evraklar.length}</span>
        </div>
        <div class="uyap-ext-group__body" data-group-body="${groupIndex}">
          ${evraklar.map(evrak => renderEvrakCard(evrak)).join('')}
        </div>
      `;

      body.appendChild(groupEl);
      groupIndex++;
    });

    updateSelectionUI();
  }

  /**
   * Tek evrak kartı HTML'i
   */
  function renderEvrakCard(evrak) {
    const checked = AppState.seciliEvrakIds.has(evrak.evrakId) ? 'checked' : '';
    const metaParts = [];
    if (evrak.evrakTuru) metaParts.push(evrak.evrakTuru);
    if (evrak.evrakTarihi) metaParts.push(evrak.evrakTarihi);

    return `
      <div class="uyap-ext-card" data-evrak-id="${evrak.evrakId}">
        <input type="checkbox" class="uyap-ext-card__checkbox"
               data-evrak-id="${evrak.evrakId}" ${checked}>
        <div class="uyap-ext-card__content">
          <p class="uyap-ext-card__name" title="${escapeHtml(evrak.name)}">${escapeHtml(evrak.name)}</p>
          ${metaParts.length > 0
            ? `<div class="uyap-ext-card__meta">${metaParts.map(m => `<span>${escapeHtml(m)}</span>`).join('')}</div>`
            : ''}
        </div>
      </div>
    `;
  }

  /**
   * Seçim UI'ını güncelle (buton durumları, sayaç)
   */
  function updateSelectionUI() {
    const count = AppState.seciliEvrakIds.size;
    const countEl = $('#uyap-ext-selected-count');
    const downloadBtn = $('#uyap-ext-download');

    if (countEl) countEl.textContent = count;
    if (downloadBtn) downloadBtn.disabled = count === 0;

    // Grup checkbox'larını senkronize et
    $$('.uyap-ext-group__checkbox').forEach(cb => {
      const folderName = cb.dataset.folder;
      const groups = AppState.getGroupedEvraklar();
      const folderEvraklar = groups.get(folderName) || [];
      cb.checked = folderEvraklar.length > 0 &&
        folderEvraklar.every(e => AppState.seciliEvrakIds.has(e.evrakId));
    });
  }

  /**
   * Progress bar güncelle
   */
  function updateProgress(current, total, status) {
    const progressEl = $('#uyap-ext-progress');
    const bar = $('#uyap-ext-progress-bar');
    const label = $('#uyap-ext-progress-label');
    const value = $('#uyap-ext-progress-value');

    if (!progressEl) return;
    progressEl.style.display = '';

    const percent = total > 0 ? Math.round((current / total) * 100) : 0;

    if (bar) {
      bar.style.width = `${percent}%`;
      bar.className = 'uyap-ext-progress__bar';

      if (status === 'downloading') {
        bar.classList.add('uyap-ext-progress__bar--downloading', 'uyap-ext-progress__bar--animated');
      } else if (status === 'completed') {
        bar.classList.add('uyap-ext-progress__bar--completed');
      } else if (status === 'paused') {
        bar.classList.add('uyap-ext-progress__bar--paused');
      } else if (status === 'error') {
        bar.classList.add('uyap-ext-progress__bar--error');
      }
    }

    if (value) value.textContent = `${current}/${total}`;

    if (label) {
      const labels = {
        downloading: 'İndiriliyor...',
        completed: 'Tamamlandı',
        paused: 'Duraklatıldı',
        error: 'Hata oluştu'
      };
      label.textContent = labels[status] || 'İndiriliyor...';
    }
  }

  /**
   * Progress hata mesajı göster
   */
  function showProgressError(message) {
    const errorEl = $('#uyap-ext-progress-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = '';
    }
  }

  /**
   * Session expired alert göster
   */
  function showSessionAlert() {
    const alertEl = $('#uyap-ext-session-alert');
    if (alertEl) alertEl.style.display = '';
  }

  /**
   * İndirme/tarama moduna göre butonları göster/gizle
   */
  function showMode(mode) {
    const scanBtn = $('#uyap-ext-scan');
    const selectionActions = $('#uyap-ext-selection-actions');
    const downloadActions = $('#uyap-ext-download-actions');
    const controlActions = $('#uyap-ext-control-actions');
    const modeRow = $('#uyap-ext-mode-row');

    // Hepsini gizle
    if (selectionActions) selectionActions.style.display = 'none';
    if (downloadActions) downloadActions.style.display = 'none';
    if (controlActions) controlActions.style.display = 'none';

    switch (mode) {
      case 'scan':
        if (scanBtn) { scanBtn.disabled = false; scanBtn.style.display = ''; }
        if (modeRow) modeRow.style.display = '';
        break;

      case 'scanning':
        if (scanBtn) { scanBtn.disabled = true; }
        break;

      case 'select':
        if (scanBtn) scanBtn.style.display = '';
        if (selectionActions) selectionActions.style.display = '';
        if (downloadActions) downloadActions.style.display = '';
        if (modeRow) modeRow.style.display = '';
        break;

      case 'downloading':
        if (scanBtn) scanBtn.style.display = 'none';
        if (controlActions) controlActions.style.display = '';
        if (modeRow) modeRow.style.display = 'none';
        break;

      case 'completed':
        if (scanBtn) { scanBtn.style.display = ''; scanBtn.disabled = false; }
        if (selectionActions) selectionActions.style.display = '';
        if (downloadActions) downloadActions.style.display = '';
        if (modeRow) modeRow.style.display = '';
        break;
    }
  }

  /**
   * HTML escape
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    createUI,
    openDrawer,
    closeDrawer,
    updateStats,
    renderEvraklar,
    updateSelectionUI,
    updateProgress,
    showProgressError,
    showSessionAlert,
    showMode,
    $,
    $$
  };
})();
