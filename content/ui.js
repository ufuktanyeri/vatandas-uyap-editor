/**
 * ui.js - UI bileşenleri (UIManager class)
 *
 * FALLBACK grup rendering ve renderEvrakCard kaldırıldı (T-1).
 * renderTreeView → #renderFolderNode + #renderFileNode split.
 */

class UIManager {
  #qs(sel, root) { return (root || document).querySelector(sel); }

  createUI() {
    if (this.#qs('#uyap-extension-root')) return;

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

  openDrawer() {
    const drawer = this.#qs('#uyap-ext-drawer');
    const overlay = this.#qs('#uyap-ext-overlay');
    if (drawer) drawer.classList.add('uyap-ext-drawer--open');
    if (overlay) overlay.classList.add('uyap-ext-drawer-overlay--open');
  }

  closeDrawer() {
    const drawer = this.#qs('#uyap-ext-drawer');
    const overlay = this.#qs('#uyap-ext-overlay');
    if (drawer) drawer.classList.remove('uyap-ext-drawer--open');
    if (overlay) overlay.classList.remove('uyap-ext-drawer-overlay--open');
  }

  updateStats(html) {
    const statsEl = this.#qs('#uyap-ext-stats');
    if (statsEl) statsEl.innerHTML = html;
  }

  renderEvraklar() {
    const body = this.#qs('#uyap-ext-body');
    if (!body) return;

    if (AppState.treeData && AppState.treeData.length > 0) {
      body.innerHTML = this.#renderTreeView(AppState.treeData, 0);
      this.updateSelectionUI();
      return;
    }

    body.innerHTML = `
      <div class="uyap-ext-empty" id="uyap-ext-empty">
        <i class="fa fa-inbox"></i>
        Henüz tarama yapılmadı
      </div>
    `;
  }

  #renderTreeView(nodes, level) {
    if (!nodes || nodes.length === 0) return '';
    return nodes.map(node =>
      node.type === 'folder'
        ? this.#renderFolderNode(node, level)
        : this.#renderFileNode(node, level)
    ).join('');
  }

  #renderFolderNode(node, level) {
    const isExpanded = AppState.expandedFolders.has(node.fullPath);
    const isFullySelected = AppState.isFolderFullySelected(node);
    const fileCount = AppState.getFileCountInFolder(node);

    return `
      <div class="uyap-ext-tree-node uyap-ext-tree-node--folder" data-level="${level}">
        <div class="uyap-ext-tree-header" data-path="${escapeHtml(node.fullPath)}">
          <span class="uyap-ext-tree-toggle ${isExpanded ? 'uyap-ext-tree-toggle--open' : ''}">
            <i class="fa fa-caret-right"></i>
          </span>
          <input type="checkbox" class="uyap-ext-folder-checkbox"
                 data-path="${escapeHtml(node.fullPath)}" ${isFullySelected ? 'checked' : ''}>
          <i class="fa fa-folder uyap-ext-tree-icon"></i>
          <span class="uyap-ext-tree-name">${escapeHtml(node.name)}</span>
          <span class="uyap-ext-tree-count">${fileCount}</span>
        </div>
        <div class="uyap-ext-tree-children" style="display: ${isExpanded ? 'block' : 'none'}">
          ${this.#renderTreeView(node.children, level + 1)}
        </div>
      </div>
    `;
  }

  #renderFileNode(node, level) {
    const isChecked = AppState.seciliEvrakIds.has(node.evrakId);
    const metaParts = [];
    if (node.metadata?.evrakTuru) metaParts.push(node.metadata.evrakTuru);
    if (node.metadata?.evrakTarihi) metaParts.push(node.metadata.evrakTarihi);

    return `
      <div class="uyap-ext-tree-node uyap-ext-tree-node--file"
           data-level="${level}" data-evrak-id="${node.evrakId}">
        <input type="checkbox" class="uyap-ext-file-checkbox"
               data-evrak-id="${node.evrakId}" ${isChecked ? 'checked' : ''}>
        <i class="fa fa-file-text-o uyap-ext-tree-icon"></i>
        <div class="uyap-ext-tree-file-content">
          <p class="uyap-ext-tree-file-name" title="${escapeHtml(node.name)}">
            ${escapeHtml(node.name)}
          </p>
          ${metaParts.length > 0
            ? `<div class="uyap-ext-card__meta">
                 ${metaParts.map(m => `<span>${escapeHtml(m)}</span>`).join('')}
               </div>`
            : ''}
        </div>
      </div>
    `;
  }

  updateSelectionUI() {
    const count = AppState.seciliEvrakIds.size;
    const countEl = this.#qs('#uyap-ext-selected-count');
    const downloadBtn = this.#qs('#uyap-ext-download');

    if (countEl) countEl.textContent = count;
    if (downloadBtn) downloadBtn.disabled = count === 0;
  }

  updateProgress(current, total, status) {
    const progressEl = this.#qs('#uyap-ext-progress');
    const bar = this.#qs('#uyap-ext-progress-bar');
    const label = this.#qs('#uyap-ext-progress-label');
    const value = this.#qs('#uyap-ext-progress-value');

    if (!progressEl) return;
    progressEl.style.display = '';

    const percent = total > 0 ? Math.round((current / total) * 100) : 0;

    if (bar) {
      bar.style.width = `${percent}%`;
      bar.className = 'uyap-ext-progress__bar';
      const statusClasses = {
        downloading: ['uyap-ext-progress__bar--downloading', 'uyap-ext-progress__bar--animated'],
        completed: ['uyap-ext-progress__bar--completed'],
        paused: ['uyap-ext-progress__bar--paused'],
        error: ['uyap-ext-progress__bar--error']
      };
      (statusClasses[status] || []).forEach(c => bar.classList.add(c));
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

  showProgressError(message) {
    const errorEl = this.#qs('#uyap-ext-progress-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = '';
    }
  }

  showSessionAlert() {
    const alertEl = this.#qs('#uyap-ext-session-alert');
    if (alertEl) alertEl.style.display = '';
  }

  showMode(mode) {
    const scanBtn = this.#qs('#uyap-ext-scan');
    const selectionActions = this.#qs('#uyap-ext-selection-actions');
    const downloadActions = this.#qs('#uyap-ext-download-actions');
    const controlActions = this.#qs('#uyap-ext-control-actions');
    const modeRow = this.#qs('#uyap-ext-mode-row');

    if (selectionActions) selectionActions.style.display = 'none';
    if (downloadActions) downloadActions.style.display = 'none';
    if (controlActions) controlActions.style.display = 'none';

    switch (mode) {
      case 'scan':
        if (scanBtn) {
          scanBtn.disabled = false;
          scanBtn.style.display = '';
          scanBtn.innerHTML = '<i class="fa fa-search uyap-ext-icon-spacing-sm"></i>Dosyaları Tara';
        }
        if (modeRow) modeRow.style.display = '';
        break;

      case 'scanning':
        if (scanBtn) {
          scanBtn.disabled = true;
          scanBtn.innerHTML = '<i class="fa fa-spinner fa-spin uyap-ext-icon-spacing-sm"></i>Taranıyor...';
        }
        break;

      case 'select':
        if (scanBtn) {
          scanBtn.style.display = '';
          scanBtn.disabled = false;
          scanBtn.innerHTML = '<i class="fa fa-refresh uyap-ext-icon-spacing-sm"></i>Yeniden Tara';
        }
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
        if (scanBtn) {
          scanBtn.style.display = '';
          scanBtn.disabled = false;
          scanBtn.innerHTML = '<i class="fa fa-refresh uyap-ext-icon-spacing-sm"></i>Yeniden Tara';
        }
        if (selectionActions) selectionActions.style.display = '';
        if (downloadActions) downloadActions.style.display = '';
        if (modeRow) modeRow.style.display = '';
        break;
    }
  }
}

const UI = new UIManager();
