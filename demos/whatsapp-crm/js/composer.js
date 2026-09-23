export class CampaignComposer {
  constructor(app) {
    this.app = app;
    this.mediaUrl = null;
    this.selectedContactIds = new Set();
    this.allProjectContacts = [];
    this.currentProductId = null;
    this.activeCategory = 'all';
    this.init();
  }

  init() {
    this.setupListeners();
  }

  async loadProject(productId) {
    this.currentProductId = productId;
    this.selectedContactIds.clear();
    this.activeCategory = 'all';

    // Load saved message template & mode for this project
    try {
      const r = await fetch(`/api/products/${productId}`);
      const d = await r.json();
      if (d.success && d.product) {
        const p = d.product;
        const textarea = document.getElementById('composer-message-text');
        if (textarea && p.messageTemplate) textarea.value = p.messageTemplate;

        // Set interaction mode
        const mode = p.interactionMode || 'TEXT';
        document.querySelectorAll('input[name="interaction-mode"]').forEach(radio => {
          radio.checked = radio.value === mode;
        });
      }
    } catch(e) { console.error('[Composer] loadProject', e); }

    this.updatePreview();
    await this.loadCustomerList(productId);
  }

  async loadCustomerList(productId) {
    this.currentProductId = productId;
    try {
      const r = await fetch(`/api/contacts?product=${productId}`);
      const d = await r.json();
      if (d.success) {
        this.allProjectContacts = d.contacts;
        this.renderCategoryChips();
        this.renderCustomerList();
      }
    } catch(e) { console.error('[Composer] loadCustomerList', e); }
  }

  renderCategoryChips() {
    const container = document.getElementById('composer-category-chips');
    if (!container) return;

    if (!this.allProjectContacts || !this.allProjectContacts.length) {
      container.innerHTML = '<span style="font-size:12px;color:var(--text-muted);">No contacts found in this project.</span>';
      return;
    }

    const catMap = {};
    this.allProjectContacts.forEach(c => {
      const cat = c.category || 'Uncategorised';
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push(c);
    });

    const total = this.allProjectContacts.length;
    const totalEligible = this.allProjectContacts.filter(c => c.status !== 'BLACKLISTED').length;
    const totalSelected = this.allProjectContacts.filter(c => this.selectedContactIds.has(c.id)).length;
    const isAllActive = this.activeCategory === 'all';
    const isAllFullySelected = totalEligible > 0 && totalSelected === totalEligible;

    let html = `
      <div class="composer-cat-chip ${isAllActive ? 'active' : ''} ${isAllFullySelected ? 'selected' : ''}" data-cat="all" title="Touch to select all contacts">
        <span>${isAllFullySelected ? '✓' : '•'} All</span>
        <span class="chip-count">${totalSelected > 0 ? `${totalSelected}/${total}` : total}</span>
      </div>
    `;

    // Sort categories (put Erode first, then alphabetical)
    const sortedCats = Object.keys(catMap).sort((a, b) => {
      if (a === 'Erode') return -1;
      if (b === 'Erode') return 1;
      return a.localeCompare(b);
    });

    sortedCats.forEach(cat => {
      const list = catMap[cat];
      const eligible = list.filter(c => c.status !== 'BLACKLISTED');
      const selectedInCat = list.filter(c => this.selectedContactIds.has(c.id)).length;
      const isFullySelected = eligible.length > 0 && selectedInCat === eligible.length;
      const isActive = this.activeCategory === cat;

      html += `
        <div class="composer-cat-chip ${isActive ? 'active' : ''} ${isFullySelected ? 'selected' : ''}" data-cat="${cat}" title="Touch to select all ${list.length} members in ${cat}">
          <span>${isFullySelected ? '✓' : ''} ${cat}</span>
          <span class="chip-count">${selectedInCat > 0 ? `${selectedInCat}/${list.length}` : list.length}</span>
        </div>
      `;
    });

    container.innerHTML = html;

    // Attach click listeners to chips
    container.querySelectorAll('.composer-cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const cat = chip.dataset.cat;
        this.selectCategoryAndMembers(cat);
      });
    });
  }

  selectCategoryAndMembers(cat) {
    if (cat === 'all') {
      this.activeCategory = 'all';
      const eligible = this.allProjectContacts.filter(c => c.status !== 'BLACKLISTED');
      const allSelected = eligible.length > 0 && eligible.every(c => this.selectedContactIds.has(c.id));
      if (!allSelected) {
        eligible.forEach(c => this.selectedContactIds.add(c.id));
      } else {
        this.selectedContactIds.clear();
      }
    } else {
      const inCat = this.allProjectContacts.filter(c => (c.category || 'Uncategorised') === cat && c.status !== 'BLACKLISTED');
      const allInCatSelected = inCat.length > 0 && inCat.every(c => this.selectedContactIds.has(c.id));

      if (this.activeCategory === cat && allInCatSelected) {
        // If already viewing this category and all are selected, tap toggles/deselects them
        inCat.forEach(c => this.selectedContactIds.delete(c.id));
      } else {
        // Touch category -> immediately switch filter AND select ALL members in this category!
        this.activeCategory = cat;
        inCat.forEach(c => this.selectedContactIds.add(c.id));
      }
    }

    this.updateSelectedCount();
    this.renderCategoryChips();
    this.renderCustomerList();
  }

  renderCustomerList(filteredList = null) {
    const container = document.getElementById('customer-select-list');
    if (!container) return;

    let contacts = filteredList || this.allProjectContacts;

    // Filter by active category if not 'all' and not an explicit subset
    if (!filteredList && this.activeCategory && this.activeCategory !== 'all') {
      contacts = contacts.filter(c => (c.category || 'Uncategorised') === this.activeCategory);
    }

    // Apply search filter if typed in input
    const searchVal = document.getElementById('customer-filter-input')?.value?.toLowerCase()?.trim();
    if (searchVal) {
      contacts = contacts.filter(c =>
        c.phone.includes(searchVal) ||
        (c.name && c.name.toLowerCase().includes(searchVal)) ||
        (c.company && c.company.toLowerCase().includes(searchVal)) ||
        (c.category && c.category.toLowerCase().includes(searchVal))
      );
    }

    if (contacts.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">No contacts found in ${this.activeCategory !== 'all' ? `category "${this.activeCategory}"` : 'this project'}.</div>`;
      return;
    }

    container.innerHTML = contacts.map(c => {
      const isBlacklisted = c.status === 'BLACKLISTED';
      const isChecked = this.selectedContactIds.has(c.id) && !isBlacklisted;
      const statusColors = { INTERESTED:'#059669', PRICING:'#3B82F6', SENT:'#6366F1', REPLIED:'#8B5CF6', BLACKLISTED:'#F43F5E', NEW:'#94A3B8', READY:'#94A3B8' };
      const catName = c.category || 'Uncategorised';
      const isErode = catName === 'Erode';

      return `
        <div class="customer-select-item ${isChecked ? 'checked' : ''} ${isBlacklisted ? 'opacity-60' : ''}"
             data-id="${c.id}" data-phone="${c.phone}" style="${isBlacklisted ? 'opacity:0.55;cursor:not-allowed;' : ''}">
          <div class="customer-checkbox">
            ${isChecked ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
          </div>
          <div class="customer-info" style="flex:1;min-width:0;">
            <div class="customer-name" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span style="font-weight:600;">${c.name || 'Prospect'}</span>
              <span class="customer-cat-pill ${isErode ? 'cat-erode' : ''}">
                 ${catName}
              </span>
            </div>
            <div class="customer-phone" style="font-size:12px;color:var(--text-muted);">${c.phone} ${c.company ? '• ' + c.company : ''}</div>
          </div>
          <span class="badge" style="font-size:10px;background:transparent;color:${statusColors[c.status]||'#94A3B8'};border:1px solid ${statusColors[c.status]||'#94A3B8'};padding:1px 6px;">${c.status}</span>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.customer-select-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const c  = this.allProjectContacts.find(c => c.id === id);
        if (!c || c.status === 'BLACKLISTED') return;

        if (this.selectedContactIds.has(id)) {
          this.selectedContactIds.delete(id);
          item.classList.remove('checked');
          item.querySelector('.customer-checkbox').innerHTML = '';
        } else {
          this.selectedContactIds.add(id);
          item.classList.add('checked');
          item.querySelector('.customer-checkbox').innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        }
        this.updateSelectedCount();
        this.renderCategoryChips();
      });
    });

    this.updateSelectedCount();
  }

  updateSelectedCount() {
    const badge = document.getElementById('selected-count-badge');
    if (badge) badge.textContent = `${this.selectedContactIds.size} selected`;
  }

  setupListeners() {
    // Token insertion
    document.querySelectorAll('.token-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const textarea = document.getElementById('composer-message-text');
        if (!textarea) return;
        const token = chip.dataset.token;
        const s = textarea.selectionStart, e = textarea.selectionEnd;
        textarea.value = textarea.value.slice(0,s) + token + textarea.value.slice(e);
        textarea.setSelectionRange(s+token.length, s+token.length);
        textarea.focus();
        this.updatePreview();
      });
    });

    // Message text live update (debounced auto-save)
    document.getElementById('composer-message-text')?.addEventListener('input', () => {
      this.updatePreview();
      clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => this.autoSaveTemplate(), 900);
    });

    // Mode change
    document.querySelectorAll('input[name="interaction-mode"]').forEach(r => {
      r.addEventListener('change', () => {
        this.updateModeInfo(r.value);
        this.updatePreview();
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this.autoSaveTemplate(), 500);
      });
    });

    // Product select in composer
    document.getElementById('composer-product-select')?.addEventListener('change', e => {
      if (e.target.value) window.app?.selectProject(e.target.value);
    });

    // Media upload
    document.getElementById('composer-media-input')?.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      await this.uploadMedia(file);
    });

    document.getElementById('remove-media-btn')?.addEventListener('click', () => {
      this.mediaUrl = null;
      document.getElementById('media-preview-row').style.display = 'none';
      document.getElementById('composer-media-input').value = '';
      document.getElementById('media-status-label').textContent = 'Optional — Photo or Video';
      this.updatePreview();
    });

    // Select All / Clear (both header buttons and category bar buttons)
    const handleSelectAll = () => {
      const targetList = (this.activeCategory && this.activeCategory !== 'all')
        ? this.allProjectContacts.filter(c => (c.category || 'Uncategorised') === this.activeCategory)
        : this.allProjectContacts;
      targetList.filter(c => c.status !== 'BLACKLISTED').forEach(c => this.selectedContactIds.add(c.id));
      this.updateSelectedCount();
      this.renderCategoryChips();
      this.renderCustomerList();
    };

    const handleClearAll = () => {
      if (this.activeCategory && this.activeCategory !== 'all') {
        this.allProjectContacts.filter(c => (c.category || 'Uncategorised') === this.activeCategory).forEach(c => this.selectedContactIds.delete(c.id));
      } else {
        this.selectedContactIds.clear();
      }
      this.updateSelectedCount();
      this.renderCategoryChips();
      this.renderCustomerList();
    };

    document.getElementById('select-all-customers-btn')?.addEventListener('click', handleSelectAll);
    document.getElementById('cat-btn-select-all')?.addEventListener('click', handleSelectAll);

    document.getElementById('deselect-all-customers-btn')?.addEventListener('click', handleClearAll);
    document.getElementById('cat-btn-clear')?.addEventListener('click', handleClearAll);

    // Customer filter input (debounced)
    let filterDebounce = null;
    document.getElementById('customer-filter-input')?.addEventListener('input', () => {
      clearTimeout(filterDebounce);
      filterDebounce = setTimeout(() => {
        this.renderCustomerList();
      }, 150);
    });

    // Launch
    document.getElementById('launch-campaign-btn')?.addEventListener('click', () => this.launchCampaign());
  }

  async autoSaveTemplate() {
    if (!this.currentProductId) return;
    const messageTemplate = document.getElementById('composer-message-text')?.value || '';
    const interactionMode = document.querySelector('input[name="interaction-mode"]:checked')?.value || 'BUTTONS';
    try {
      await fetch(`/api/products/${this.currentProductId}/template`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messageTemplate, interactionMode })
      });
    } catch(_) {}
  }

  async uploadMedia(file) {
    const statusLabel = document.getElementById('media-status-label');
    if (statusLabel) statusLabel.textContent = 'Uploading…';
    const formData = new FormData();
    formData.append('media', file);
    try {
      const r = await fetch('/api/upload', { method:'POST', body: formData });
      const d = await r.json();
      if (d.success) {
        this.mediaUrl = d.url;
        document.getElementById('media-preview-row').style.display = 'flex';
        document.getElementById('media-preview-thumb').src = d.url;
        if (statusLabel) statusLabel.textContent = file.name;
        this.updatePreview();
      }
    } catch(e) {
      if (statusLabel) statusLabel.textContent = 'Upload failed';
    }
  }

  updatePreview() {
    const rawText = document.getElementById('composer-message-text')?.value || '';
    const mode    = document.querySelector('input[name="interaction-mode"]:checked')?.value || 'BUTTONS';
    const activeBtns = this.app.buttonManager?.getButtons() || [];

    let displayText = rawText
      .replace(/\{([^{}]+)\}/g, (_, choices) => choices.split('|')[0])
      .replace(/{{name}}/g,    'Marcus')
      .replace(/{{company}}/g, 'Vance Logistics')
      .replace(/{{product}}/g, this.app.activeProject?.name || 'Our Product');

    if (!displayText.trim()) displayText = 'Your message will appear here…';

    displayText = displayText
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g,   '<em>$1</em>')
      .replace(/\n/g, '<br/>');

    if (mode === 'TEXT' && activeBtns.length > 0) {
      const numberedHints = activeBtns.map((btn, idx) => `• Reply <strong>${idx + 1}</strong> or <strong>${btn.label}</strong>`).join('<br/>');
      displayText += `<br/><br/>${numberedHints}`;
    } else if (mode === 'LINKS' && activeBtns.length > 0) {
      const linkHints = activeBtns.map(btn =>
        `• <strong>${btn.label}:</strong><br/><span style="color:#0284c7;text-decoration:underline;font-size:11px;">https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(btn.label)}</span>`
      ).join('<br/><br/>');
      displayText += `<br/><br/><strong>Tap an option below to reply in 1-click (auto-types for you):</strong><br/><br/>${linkHints}`;
    }

    const previewTextEl = document.getElementById('wa-preview-text');
    if (previewTextEl) previewTextEl.innerHTML = displayText;

    // Media in preview
    const previewMedia = document.getElementById('wa-preview-media');
    if (previewMedia) {
      if (this.mediaUrl) {
        previewMedia.style.display = 'block';
        previewMedia.innerHTML = `<img src="${this.mediaUrl}" alt="media" />`;
      } else {
        previewMedia.style.display = 'none';
        previewMedia.innerHTML = '';
      }
    }

    // Buttons in preview
    const btnsStack = document.getElementById('wa-preview-buttons');
    if (!btnsStack) return;

    if (mode === 'POLL' || mode === 'BUTTONS') {
      btnsStack.innerHTML = `
        <div style="background:rgba(255,255,255,0.9);border-radius:10px;padding:10px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="font-size:10px;font-weight:700;color:#666;margin-bottom:7px;text-transform:uppercase;letter-spacing:0.05em;">Interactive Choice — Tap to respond</div>
          ${activeBtns.map(btn => `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f0f0f0;">
              <div style="width:14px;height:14px;border:2px solid #128C7E;border-radius:50%;"></div>
              <span style="font-size:12px;font-weight:600;color:#111;">${btn.label}</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      btnsStack.innerHTML = '';
    }
  }

  updateModeInfo(mode) {
    const infoEl = document.getElementById('mode-info-text');
    if (!infoEl) return;
    if (mode === 'LINKS') {
      infoEl.innerHTML = '<strong>1-Click Auto-Type Links (Lowest Ban Risk):</strong> Creates clickable <code>wa.me</code> links that auto-populate the keyword directly in the customer\'s WhatsApp text bar. When sent, Meta classifies it as a customer-initiated reply, drastically lowering spam ban risk.';
    } else if (mode === 'POLL') {
      infoEl.innerHTML = '<strong>1-Tap Poll (Reliable):</strong> 100% reliable 1-click radio options. Renders instantly on both WhatsApp Web (PC) and Mobile Phones without error.';
    } else if (mode === 'TEXT') {
      infoEl.innerHTML = '<strong>Conversational Micro-Reply (Demo 3 — Active):</strong> Clean, human outreach with quick-reply options (e.g., <em>• Reply 1 or Interested</em>). Zero links to click, 100% natural conversational tone, and automated triggers respond immediately when a prospect replies with a number or keyword.';
    } else if (mode === 'BUTTONS') {
      infoEl.innerHTML = '<strong>Interactive Poll Buttons:</strong> Dispatches clean message text followed immediately by 1-tap interactive options.';
    }
  }

  simulateButtonClick(label) {
    const canvas = document.getElementById('wa-sim-canvas');
    if (!canvas) return;
    const bubble = document.createElement('div');
    bubble.className = 'wa-msg-in';
    bubble.innerHTML = `${label}<div class="wa-msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>`;
    canvas.appendChild(bubble);
    canvas.scrollTop = canvas.scrollHeight;
  }

  async launchCampaign() {
    if (!this.currentProductId) { alert('Please select a project from the sidebar first.'); return; }

    const title           = document.getElementById('composer-title')?.value || 'Outreach Campaign';
    const messageTemplate = document.getElementById('composer-message-text')?.value;
    const interactionMode = document.querySelector('input[name="interaction-mode"]:checked')?.value || 'TEXT';

    if (!messageTemplate?.trim()) { alert('Please enter a message template.'); return; }

    // Build recipients: quick add numbers + selected contacts
    const recipients = [];

    // 1. Parse quick add textarea
    const quickNumbers = document.getElementById('composer-quick-numbers')?.value || '';
    quickNumbers.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
      const parts = line.split(',');
      const phone = (parts[0] || '').trim().replace(/[^0-9]/g, '');
      if (phone.length >= 10) {
        recipients.push({ phone, name: (parts[1]||'Prospect').trim(), company: (parts[2]||'').trim() });
      }
    });

    // 2. Add selected contacts from list
    this.allProjectContacts.forEach(c => {
      if (this.selectedContactIds.has(c.id) && !recipients.find(r => r.phone === c.phone)) {
        recipients.push({ phone: c.phone, name: c.name, company: c.company });
      }
    });

    if (recipients.length === 0) { alert('Please select recipients or enter phone numbers in the Quick Add box.'); return; }

    const payload = {
      title,
      productId:       this.currentProductId,
      messageTemplate,
      mediaUrl:        this.mediaUrl,
      buttons:         this.app.buttonManager?.getButtons() || [],
      recipients,
      interactionMode,
      allowResend:     true
    };

    try {
      const r = await fetch('/api/campaigns/launch', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (d.success) {
        if (d.queuedCount > 0) {
          let msg = `Campaign launched! ${d.queuedCount} message${d.queuedCount !== 1 ? 's' : ''} added to the Antiban Pacing Queue.`;
          if (d.skippedCount > 0) {
            msg += `\n(${d.skippedCount} skipped due to duplicate safeguards/opt-outs)`;
          }
          alert(msg);
          window.app?.switchTab('inbox');
        } else {
          let warn = 'Notice: 0 recipients were queued.';
          if (d.skippedList && d.skippedList.length > 0) {
            warn += '\n\nReasons:\n' + d.skippedList.map(s => `• ${s.phone}: ${s.reason}`).join('\n');
          }
          alert(warn);
        }
      } else {
        alert('Launch failed: ' + d.error);
      }
    } catch(e) {
      alert('Network error: ' + e.message);
    }
  }
}
