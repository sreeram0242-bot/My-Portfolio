export class AudienceManager {
  constructor(app) {
    this.app = app;
    this.contacts = [];
    this.selectedProjectId = this.app.products?.[0]?.id || 'prod_1';
    this.selectedCategory  = 'all';
    this.searchQuery       = '';
    this.selectedIds       = new Set();
    this.init();
  }

  init() {
    this.importMode = 'csv';
    this.csvRawRows = [];
    this.csvHeaders = [];
    this.csvDataRows = [];
    this.csvContactsReady = [];
    if (!this.selectedProjectId && this.app.products?.length) {
      this.selectedProjectId = this.app.products[0].id;
    }
    this.setupListeners();
    this.initImportModal();
    this.renderProjectTree();
    this.renderCategoryTree();
    this.fetchAndRender();
  }

  fetchContacts() {
    return this.fetchAndRender();
  }

  // ─── Event Listeners ─────────────────────────────────────────────────────

  setupListeners() {
    // Search (debounced to prevent lag)
    let searchDebounce = null;
    document.getElementById('audience-search-input')?.addEventListener('input', e => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        this.searchQuery = e.target.value.toLowerCase();
        this.fetchAndRender();
      }, 200);
    });

    // Add Contact button (always works)
    document.getElementById('audience-add-contact-btn')?.addEventListener('click', () => {
      if (!this.selectedProjectId) {
        this.selectedProjectId = this.app.products?.[0]?.id || 'prod_1';
      }
      this.openContactModal(null);
    });

    // Add Category button
    document.getElementById('audience-add-category-btn')?.addEventListener('click', async () => {
      const name = prompt('Enter new category name (e.g. "Karur District", "Chennai District", "Gym Owners"):');
      if (name && name.trim()) {
        const catName = name.trim();
        const pid = this.selectedProjectId || this.app.products?.[0]?.id || 'prod_1';
        this.selectedProjectId = pid;
        try {
          await fetch('/api/contacts/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product: pid, name: catName })
          });
        } catch(e) { console.error(e); }
        this.selectCategory(catName);
      }
    });

    // Select All checkbox
    document.getElementById('audience-select-all-chk')?.addEventListener('change', e => {
      const rows = document.querySelectorAll('.audience-row-chk');
      if (e.target.checked) {
        rows.forEach(r => { r.checked = true; this.selectedIds.add(r.dataset.id); });
      } else {
        rows.forEach(r => { r.checked = false; });
        this.selectedIds.clear();
      }
      this.updateDeleteBtn();
    });

    // Delete Selected
    document.getElementById('audience-delete-selected-btn')?.addEventListener('click', () => this.deleteSelected());

    // Import modal
    document.getElementById('open-import-modal-btn')?.addEventListener('click', () => {
      this.populateProjectDropdowns();
      document.getElementById('import-modal').classList.add('open');
    });
    document.getElementById('close-import-modal')?.addEventListener('click',   () => document.getElementById('import-modal').classList.remove('open'));
    document.getElementById('close-import-modal-2')?.addEventListener('click', () => document.getElementById('import-modal').classList.remove('open'));
    document.getElementById('submit-import-btn')?.addEventListener('click',    () => this.handleImport());

    // Contact modal
    document.getElementById('close-contact-modal')?.addEventListener('click',  () => document.getElementById('contact-modal').classList.remove('open'));
    document.getElementById('close-contact-modal-2')?.addEventListener('click',() => document.getElementById('contact-modal').classList.remove('open'));
    document.getElementById('save-contact-btn')?.addEventListener('click',     () => this.saveContactModal());

    // Category datalist suggestion on type
    document.getElementById('contact-modal-category')?.addEventListener('input', () => {
      this.updateCategoryDatalist();
    });

    // View Call List shortcuts
    const triggerCallListModal = () => {
      document.getElementById('ap-stat-calllist-card')?.click();
    };
    document.getElementById('audience-view-calllist-btn')?.addEventListener('click', triggerCallListModal);
    document.getElementById('nav-calllist-btn')?.addEventListener('click', triggerCallListModal);
  }

  // ─── Project Tree ─────────────────────────────────────────────────────────

  renderProjectTree() {
    const tree = document.getElementById('audience-project-tree');
    if (!tree) return;
    const products = this.app.products || [];

    if (this.selectedProjectId && this.selectedProjectId !== 'all' && !products.some(p => p.id === this.selectedProjectId)) {
      this.selectedProjectId = products[0]?.id || null;
    }

    tree.innerHTML = `
      <div class="tree-item ${!this.selectedProjectId || this.selectedProjectId === 'all' ? 'active' : ''}" data-pid="all"
        style="padding:6px 10px;border-radius:8px;cursor:pointer;font-size:12.5px;font-weight:600;color:var(--text-secondary);display:flex;align-items:center;justify-content:space-between;transition:all .15s;">
        <span style="display:flex;align-items:center;gap:8px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
          All Projects
        </span>
        <span style="font-size:11px;color:var(--text-muted);">${products.length} proj</span>
      </div>
      ${products.map(p => `
        <div class="tree-item ${this.selectedProjectId === p.id ? 'active' : ''}" data-pid="${p.id}"
          style="padding:6px 10px;border-radius:8px;cursor:pointer;font-size:12.5px;font-weight:600;display:flex;align-items:center;justify-content:space-between;gap:6px;transition:all .15s;color:${this.selectedProjectId === p.id ? (p.color || '#10B981') : 'var(--text-secondary)'};">
          <span style="display:flex;align-items:center;gap:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">
            <span style="width:8px;height:8px;border-radius:50%;background:${p.color || '#10B981'};flex-shrink:0;"></span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.name}</span>
          </span>
          <span style="display:flex;align-items:center;gap:3px;flex-shrink:0;">
            <button type="button" class="btn btn-ghost btn-icon edit-project-tree-btn" data-pid="${p.id}" title="Edit Project" style="width:20px;height:20px;padding:0;color:var(--text-muted);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button type="button" class="btn btn-ghost btn-icon del-project-tree-btn" data-pid="${p.id}" title="Delete Project" style="width:20px;height:20px;padding:0;color:var(--rose);">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </span>
        </div>
      `).join('')}
    `;

    // Add hover style
    const style = `
      .tree-item:hover { background:var(--bg-hover); color:var(--text-primary) !important; }
      .tree-item.active { background:var(--accent-light); }
    `;
    if (!document.getElementById('tree-style')) {
      const s = document.createElement('style'); s.id = 'tree-style'; s.textContent = style;
      document.head.appendChild(s);
    }

    // Click project row
    tree.querySelectorAll('.tree-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.edit-project-tree-btn') || e.target.closest('.del-project-tree-btn')) return;
        const pid = el.dataset.pid;
        this.selectedProjectId = pid === 'all' ? null : pid;
        this.selectedCategory  = 'all';
        this.renderProjectTree();
        this.renderCategoryTree();
        this.fetchAndRender();
      });
    });

    // Edit project button
    tree.querySelectorAll('.edit-project-tree-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.app.openEditProjectModal(btn.dataset.pid);
      });
    });

    // Delete project button
    tree.querySelectorAll('.del-project-tree-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.app.deleteProject(btn.dataset.pid);
      });
    });
  }

  async renderCategoryTree() {
    const tree = document.getElementById('audience-category-tree');
    if (!tree) return;
    const pid = this.selectedProjectId || (this.app.products?.[0]?.id || 'prod_1');

    try {
      const r = await fetch(`/api/contacts/categories?product=${pid}`);
      const d = await r.json();
      const cats = d.categories || [];

      if (this.selectedCategory && this.selectedCategory !== 'all' && !cats.includes(this.selectedCategory)) {
        cats.push(this.selectedCategory);
      }

      tree.innerHTML = `
        <div class="tree-item ${this.selectedCategory === 'all' ? 'active' : ''}" data-cat="all"
          style="padding:5px 10px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;color:var(--text-secondary);display:flex;align-items:center;gap:7px;transition:all .15s;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
          All Categories
        </div>
        ${cats.length === 0 ? `
          <div style="font-size:11.5px;color:var(--text-muted);padding:8px 10px;">No categories yet. Click "+ New Category" below.</div>
        ` : cats.map(cat => `
          <div class="tree-item ${this.selectedCategory === cat ? 'active' : ''}" data-cat="${cat}"
            style="padding:5px 10px;border-radius:8px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:space-between;gap:7px;transition:all .15s;color:var(--text-secondary);">
            <span style="display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${cat}</span>
            </span>
          </div>
        `).join('')}
      `;

      tree.querySelectorAll('.tree-item').forEach(el => {
        el.addEventListener('click', () => this.selectCategory(el.dataset.cat));
      });
    } catch(e) { console.error(e); }
  }

  selectCategory(cat) {
    this.selectedCategory = cat;
    this.renderCategoryTree();
    this.fetchAndRender();
    // Update badge
    const badge = document.getElementById('audience-category-badge');
    if (badge) badge.textContent = cat === 'all' ? 'All' : cat;
  }

  // ─── Data Fetch & Render ──────────────────────────────────────────────────

  async fetchAndRender() {
    try {
      const params = new URLSearchParams();
      if (this.selectedProjectId) params.append('product', this.selectedProjectId);
      if (this.selectedCategory && this.selectedCategory !== 'all') params.append('category', this.selectedCategory);
      if (this.searchQuery) params.append('search', this.searchQuery);

      const r = await fetch(`/api/contacts?${params}`);
      const d = await r.json();
      if (d.success) {
        this.contacts = d.contacts;
        this.updateBadges();
        this.renderTable(d.contacts);
      }
    } catch(e) { console.error(e); }
  }

  updateBadges() {
    const proj    = document.getElementById('audience-project-badge');
    const catBadge= document.getElementById('audience-category-badge');
    const countBdg= document.getElementById('audience-count-badge');
    const lbl     = document.getElementById('audience-count-label');

    const prodName = this.selectedProjectId
      ? (this.app.products || []).find(p => p.id === this.selectedProjectId)?.name || 'Project'
      : 'All Projects';
    const catName  = this.selectedCategory === 'all' ? 'All' : this.selectedCategory;

    if (proj)    proj.textContent    = prodName;
    if (catBadge)catBadge.textContent= catName;
    if (countBdg)countBdg.textContent= `${this.contacts.length} contacts`;
    if (lbl)     lbl.textContent     = `${this.contacts.length} contacts${this.selectedProjectId ? ` in ${prodName}` : ''}${this.selectedCategory !== 'all' ? ` › ${catName}` : ''}`;
  }

  statusBadge(status) {
    if (status === 'INVALID_NUMBER') {
      return `<span class="badge badge-rose" style="font-size:10px;font-weight:700;background:rgba(234,67,53,0.18);color:#fca5a5;border:1px solid rgba(234,67,53,0.4);" title="Not on WhatsApp - Call manually">NOT ON WA (CALL)</span>`;
    }
    const map = {
      INTERESTED:'badge-green', PRICING:'badge-blue', REPLIED:'badge-purple',
      SENT:'badge-cyan', QUEUED:'badge-amber', BLACKLISTED:'badge-rose',
      INVALID_NUMBER:'badge-rose', NEW:'badge-default', READY:'badge-default'
    };
    return `<span class="badge ${map[status]||'badge-default'}" style="font-size:10px;">${status}</span>`;
  }

  renderTable(list) {
    const tbody = document.getElementById('audience-table-body');
    if (!tbody) return;
    this.selectedIds.clear();
    this.updateDeleteBtn();

    if (!list.length) {
      const msg = this.selectedProjectId
        ? `No contacts in this ${this.selectedCategory !== 'all' ? 'category' : 'project'} yet. Click "Add Contact" to get started.`
        : 'Select a project from the left panel to view contacts.';
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
        <div class="empty-state-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <div class="empty-state-title">No contacts found</div>
        <div class="empty-state-desc">${msg}</div>
      </div></td></tr>`;
      return;
    }

    const products = this.app.products || [];

    tbody.innerHTML = list.map(c => {
      const prod = products.find(p => p.id === c.productId);
      const prodDot = prod ? `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${prod.color};margin-right:4px;"></span>` : '';
      const date = c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString('en-IN') : '—';
      const isInvalid = c.status === 'INVALID_NUMBER';

      return `
        <tr style="${isInvalid ? 'background:rgba(234,67,53,0.03);' : ''}">
          <td><input type="checkbox" class="audience-row-chk" data-id="${c.id}" style="width:14px;height:14px;cursor:pointer;accent-color:var(--accent);" /></td>
          <td class="font-mono" style="font-size:12px;">${c.phone}</td>
          <td style="font-weight:600;">${c.name || '—'}</td>
          <td style="color:var(--text-secondary);font-size:12.5px;">${c.company || '—'}</td>
          <td>
            <span style="display:inline-flex;align-items:center;font-size:11px;font-weight:600;color:var(--accent);background:var(--accent-light);padding:2px 8px;border-radius:99px;">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              ${c.category || 'Uncategorised'}
            </span>
          </td>
          <td>${this.statusBadge(c.status)}</td>
          <td style="font-size:12px;color:var(--text-muted);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${c.notes||''}">${c.notes||'—'}</td>
          <td style="text-align:right;white-space:nowrap;">
            ${isInvalid ? `
              <a href="tel:+${c.phone}" class="btn btn-xs" style="padding:3px 9px;font-size:11px;margin-right:4px;gap:4px;color:#fca5a5;border:1px solid rgba(234,67,53,0.5);background:rgba(234,67,53,0.15);text-decoration:none;display:inline-flex;align-items:center;border-radius:5px;font-weight:600;" title="Not on WhatsApp - Click to call +${c.phone} directly">
                Call
              </a>
            ` : `
              <button class="btn btn-xs btn-primary send-contact-btn" data-id="${c.id}" title="Send WhatsApp Outreach" style="padding:3px 8px;font-size:11px;margin-right:4px;gap:4px;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Send
              </button>
            `}
            <button class="btn btn-xs btn-ghost edit-contact-btn" data-id="${c.id}" title="Edit" style="padding:4px 7px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn btn-xs btn-danger del-contact-btn" data-id="${c.id}" title="Delete" style="padding:4px 7px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Checkbox listeners
    tbody.querySelectorAll('.audience-row-chk').forEach(chk => {
      chk.addEventListener('change', e => {
        if (e.target.checked) this.selectedIds.add(e.target.dataset.id);
        else this.selectedIds.delete(e.target.dataset.id);
        this.updateDeleteBtn();
      });
    });

    // Send single outreach listener
    tbody.querySelectorAll('.send-contact-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const c = this.contacts.find(c => c.id === btn.dataset.id);
        if (!c) return;
        if (!confirm(`Send WhatsApp campaign outreach message to ${c.name || 'Prospect'} (${c.phone}) now?`)) return;
        btn.disabled = true;
        btn.textContent = 'Sending…';
        try {
          const r = await fetch(`/api/contacts/${c.id}/send`, { method: 'POST' });
          const d = await r.json();
          if (d.success) {
            alert(` Message successfully dispatched to ${c.phone}!`);
            await this.fetchAndRender();
          } else {
            alert(`Dispatch failed: ${d.error || 'Check WhatsApp connection'}`);
            btn.disabled = false;
            btn.textContent = 'Send';
          }
        } catch(err) {
          alert(`Network error: ${err.message}`);
          btn.disabled = false;
          btn.textContent = 'Send';
        }
      });
    });

    // Edit listeners
    tbody.querySelectorAll('.edit-contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = this.contacts.find(c => c.id === btn.dataset.id);
        if (c) this.openContactModal(c);
      });
    });

    // Delete single
    tbody.querySelectorAll('.del-contact-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this contact? This cannot be undone.')) return;
        await this.deleteContactById(btn.dataset.id);
      });
    });
  }

  updateDeleteBtn() {
    const btn = document.getElementById('audience-delete-selected-btn');
    if (btn) btn.style.display = this.selectedIds.size > 0 ? 'flex' : 'none';
  }

  // ─── CRUD Operations ──────────────────────────────────────────────────────

  openContactModal(contact = null) {
    const modal       = document.getElementById('contact-modal');
    const titleEl     = document.getElementById('contact-modal-title');
    const idEl        = document.getElementById('contact-modal-id');
    const phoneEl     = document.getElementById('contact-modal-phone');
    const nameEl      = document.getElementById('contact-modal-name');
    const companyEl   = document.getElementById('contact-modal-company');
    const categoryEl  = document.getElementById('contact-modal-category');
    const statusEl    = document.getElementById('contact-modal-status');
    const notesEl     = document.getElementById('contact-modal-notes');
    const projSelect  = document.getElementById('contact-modal-project');

    // Populate project dropdown
    const products = this.app.products || [];
    projSelect.innerHTML = products.map(p =>
      `<option value="${p.id}" ${(contact?.productId || this.selectedProjectId) === p.id ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    if (contact) {
      titleEl.textContent    = 'Edit Contact';
      idEl.value             = contact.id || '';
      phoneEl.value          = contact.phone || '';
      nameEl.value           = contact.name  || '';
      companyEl.value        = contact.company || '';
      categoryEl.value       = contact.category || this.selectedCategory !== 'all' ? this.selectedCategory : 'Uncategorised';
      statusEl.value         = contact.status || 'READY';
      notesEl.value          = contact.notes  || '';
      phoneEl.readOnly       = true; // phone is the PK
      phoneEl.style.opacity  = '0.6';
    } else {
      titleEl.textContent    = 'Add Contact';
      idEl.value             = '';
      phoneEl.value          = '';
      nameEl.value           = '';
      companyEl.value        = '';
      categoryEl.value       = this.selectedCategory !== 'all' ? this.selectedCategory : '';
      statusEl.value         = 'READY';
      notesEl.value          = '';
      phoneEl.readOnly       = false;
      phoneEl.style.opacity  = '1';
    }

    this.updateCategoryDatalist();
    modal.classList.add('open');
    (contact ? nameEl : phoneEl).focus();
  }

  async updateCategoryDatalist() {
    if (!this.selectedProjectId) return;
    try {
      const r = await fetch(`/api/contacts/categories?product=${this.selectedProjectId}`);
      const d = await r.json();
      const dl = document.getElementById('category-datalist');
      if (dl && d.categories) {
        dl.innerHTML = d.categories.map(c => `<option value="${c}">`).join('');
      }
    } catch(e) {}
  }

  async saveContactModal() {
    const id         = document.getElementById('contact-modal-id').value;
    const phone      = document.getElementById('contact-modal-phone').value.trim();
    const name       = document.getElementById('contact-modal-name').value.trim();
    const company    = document.getElementById('contact-modal-company').value.trim();
    const category   = document.getElementById('contact-modal-category').value.trim() || 'Uncategorised';
    const productId  = document.getElementById('contact-modal-project').value;
    const status     = document.getElementById('contact-modal-status').value;
    const notes      = document.getElementById('contact-modal-notes').value.trim();

    if (!phone) { alert('Phone number is required.'); return; }

    const payload = { phone, name, company, category, productId, status, notes };
    const btn     = document.getElementById('save-contact-btn');
    btn.disabled  = true;
    btn.textContent = 'Saving…';

    try {
      let r;
      if (id) {
        r = await fetch(`/api/contacts/${id}`, {
          method: 'PUT', headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
      } else {
        r = await fetch('/api/contacts', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
      }
      const d = await r.json();
      if (d.success) {
        document.getElementById('contact-modal').classList.remove('open');
        await this.renderCategoryTree();
        await this.fetchAndRender();
        this.app.composer?.loadCustomerList(this.selectedProjectId || productId);
        this.showToast(id ? '✓ Contact updated successfully' : '✓ Contact added successfully');
      } else {
        alert(d.error || 'Failed to save contact.');
      }
    } catch(e) {
      alert('Error saving contact: ' + e.message);
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Save Contact';
    }
  }

  async deleteContactById(id) {
    try {
      const r = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      const d = await r.json();
      if (d.success) {
        await this.renderCategoryTree();
        await this.fetchAndRender();
        this.app.composer?.loadCustomerList(this.selectedProjectId);
        this.showToast('✓ Contact deleted successfully');
      } else {
        alert(d.error || 'Failed to delete contact');
      }
    } catch(e) {
      alert('Network error deleting contact: ' + e.message);
    }
  }

  async deleteSelected() {
    if (!this.selectedIds.size) return;
    const count = this.selectedIds.size;
    if (!confirm(`Delete ${count} selected contact(s)? This cannot be undone.`)) return;
    for (const id of Array.from(this.selectedIds)) {
      try {
        await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      } catch(e) {}
    }
    this.selectedIds.clear();
    this.updateDeleteBtn();
    await this.renderCategoryTree();
    await this.fetchAndRender();
    this.app.composer?.loadCustomerList(this.selectedProjectId);
    this.showToast(`✓ Deleted ${count} contacts`);
  }

  // ─── Bulk Import & CSV Engine ──────────────────────────────────────────────

  initImportModal() {
    const tabCsv = document.getElementById('import-tab-csv');
    const tabText = document.getElementById('import-tab-text');
    const csvSection = document.getElementById('import-csv-section');
    const textSection = document.getElementById('import-text-section');
    const dropzone = document.getElementById('csv-dropzone');
    const fileInput = document.getElementById('csv-file-input');
    const removeBtn = document.getElementById('remove-csv-file-btn');
    const sampleBtn = document.getElementById('download-sample-csv-btn');
    const textarea = document.getElementById('import-textarea');
    const projectSelect = document.getElementById('import-project-select');

    // Tab Switch: CSV File
    tabCsv?.addEventListener('click', () => {
      this.importMode = 'csv';
      tabCsv.classList.add('active');
      tabText?.classList.remove('active');
      if (csvSection) csvSection.style.display = 'flex';
      if (textSection) textSection.style.display = 'none';
      this.updateImportSubmitState();
    });

    // Tab Switch: Paste Text
    tabText?.addEventListener('click', () => {
      this.importMode = 'text';
      tabText.classList.add('active');
      tabCsv?.classList.remove('active');
      if (csvSection) csvSection.style.display = 'none';
      if (textSection) textSection.style.display = 'flex';
      this.updateImportSubmitState();
    });

    // Dropzone Click
    dropzone?.addEventListener('click', e => {
      if (e.target.closest('#download-sample-csv-btn')) return;
      fileInput?.click();
    });

    // File Input Changed
    fileInput?.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (file) this.processCSVFile(file);
    });

    // Drag & Drop Listeners
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone?.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone?.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone?.addEventListener('drop', e => {
      const file = e.dataTransfer?.files?.[0];
      if (file) this.processCSVFile(file);
    });

    // Remove file / Reset
    removeBtn?.addEventListener('click', () => {
      this.resetCSVState();
      if (fileInput) fileInput.value = '';
    });

    // Download Sample CSV
    sampleBtn?.addEventListener('click', e => {
      e.stopPropagation();
      this.downloadSampleCSV();
    });

    // Mapping Dropdowns Changed
    ['map-col-phone', 'map-col-name', 'map-col-company', 'map-col-category'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => this.updateCSVPreview());
    });

    // Textarea input
    textarea?.addEventListener('input', () => {
      if (this.importMode === 'text') this.updateImportSubmitState();
    });

    // Project selection in modal changed
    projectSelect?.addEventListener('change', () => {
      this.updateImportCategoryDatalist();
      if (this.importMode === 'csv' && this.csvDataRows?.length) {
        this.updateCSVPreview();
      }
    });

    // Default category input changed
    document.getElementById('import-category-input')?.addEventListener('input', () => {
      if (this.importMode === 'csv' && this.csvDataRows?.length) {
        this.updateCSVPreview();
      }
    });
  }

  downloadSampleCSV() {
    const csvContent = "Phone,Name,Company,District,Notes\n" +
      "919629661668,SreeRam,KarurFitnessGym,Karur District,Interested in gym software\n" +
      "919842123456,Dr. Mohan,Apollo Clinic,Chennai District,Hospital outreach\n" +
      "919788112233,Priya Sharma,FitLife Studio,Coimbatore District,Cold lead\n" +
      "919443221100,Vikas Patel,Apex Fitness,Madurai District,Follow up next week";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_contacts.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  parseCSVText(text) {
    const lines = [];
    let row = [''];
    let inQuotes = false;
    let quoteChar = '"';

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (c === quoteChar) {
          if (next === quoteChar) {
            row[row.length - 1] += quoteChar;
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          row[row.length - 1] += c;
        }
      } else {
        if (c === '"' || c === "'") {
          inQuotes = true;
          quoteChar = c;
        } else if (c === ',' || c === ';' || c === '\t') {
          row.push('');
        } else if (c === '\r') {
          // ignore CR
        } else if (c === '\n') {
          lines.push(row);
          row = [''];
        } else {
          row[row.length - 1] += c;
        }
      }
    }
    if (row.length > 1 || (row.length === 1 && row[0].trim())) {
      lines.push(row);
    }
    return lines.filter(r => r.some(cell => (cell || '').trim().length > 0));
  }

  processCSVFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result;
      if (!content) return;
      const rawRows = this.parseCSVText(content);
      if (rawRows.length === 0) {
        alert('The uploaded file is empty.');
        return;
      }

      this.csvRawRows = rawRows;

      // Update UI: hide dropzone, show active file card
      const dropzone = document.getElementById('csv-dropzone');
      const fileCard = document.getElementById('csv-file-card');
      if (dropzone) dropzone.style.display = 'none';
      if (fileCard) fileCard.style.display = 'flex';

      const filenameLabel = document.getElementById('csv-filename-label');
      const metaLabel = document.getElementById('csv-meta-label');
      if (filenameLabel) filenameLabel.textContent = file.name;
      const sizeKb = (file.size / 1024).toFixed(1);
      if (metaLabel) metaLabel.textContent = `${sizeKb} KB • ${rawRows.length} lines parsed`;

      // Determine if row 0 is headers
      const firstRow = rawRows[0];
      const hasHeader = firstRow.some(cell => /name|phone|mobile|company|district|category|number|id|contact|hospital|gym/i.test(cell));

      let headers = [];
      let dataRows = [];
      if (hasHeader) {
        headers = firstRow.map((h, i) => (h || '').trim() || `Col ${i+1}`);
        dataRows = rawRows.slice(1);
      } else {
        headers = firstRow.map((_, i) => `Column ${i+1}`);
        dataRows = rawRows;
      }

      this.csvHeaders = headers;
      this.csvDataRows = dataRows;

      // Populate column mapping selectors
      this.populateColumnMappingSelectors(headers);

      // Show mapping & preview sections
      const mapSection = document.getElementById('csv-mapping-section');
      const previewBox = document.getElementById('csv-preview-box');
      if (mapSection) mapSection.style.display = 'flex';
      if (previewBox) previewBox.style.display = 'flex';

      // Render preview
      this.updateCSVPreview();
    };
    reader.readAsText(file);
  }

  populateColumnMappingSelectors(headers) {
    const mapPhone = document.getElementById('map-col-phone');
    const mapName  = document.getElementById('map-col-name');
    const mapComp  = document.getElementById('map-col-company');
    const mapCat   = document.getElementById('map-col-category');

    const createOptions = (allowNone = true, noneLabel = 'None / Auto') => {
      let html = allowNone ? `<option value="-1">${noneLabel}</option>` : '';
      headers.forEach((h, idx) => {
        html += `<option value="${idx}">${h}</option>`;
      });
      return html;
    };

    if (mapPhone) mapPhone.innerHTML = createOptions(false);
    if (mapName)  mapName.innerHTML  = createOptions(true, 'None (Default: Prospect)');
    if (mapComp)  mapComp.innerHTML  = createOptions(true, 'None (Blank)');
    if (mapCat)   mapCat.innerHTML   = createOptions(true, 'None (Use Default Category)');

    // Smart Auto-detection
    let phoneIdx = -1, nameIdx = -1, compIdx = -1, catIdx = -1;

    headers.forEach((h, idx) => {
      const lower = h.toLowerCase().trim();
      if (phoneIdx === -1 && /phone|mobile|cell|number|whatsapp|contact|ph/i.test(lower)) {
        phoneIdx = idx;
      } else if (nameIdx === -1 && /name|owner|client|person|lead/i.test(lower)) {
        nameIdx = idx;
      } else if (compIdx === -1 && /company|business|gym|hospital|firm|clinic|org/i.test(lower)) {
        compIdx = idx;
      } else if (catIdx === -1 && /category|district|city|location|zone|group/i.test(lower)) {
        catIdx = idx;
      }
    });

    // Fallbacks if not matched by name
    if (phoneIdx === -1 && headers.length > 0) phoneIdx = 0;
    if (nameIdx  === -1 && headers.length > 1) nameIdx  = 1;
    if (compIdx  === -1 && headers.length > 2) compIdx  = 2;
    if (catIdx   === -1 && headers.length > 3) catIdx   = 3;

    if (mapPhone && phoneIdx !== -1) mapPhone.value = phoneIdx;
    if (mapName  && nameIdx  !== -1) mapName.value  = nameIdx;
    if (mapComp  && compIdx  !== -1) mapComp.value  = compIdx;
    if (mapCat   && catIdx   !== -1) mapCat.value   = catIdx;
  }

  updateCSVPreview() {
    if (!this.csvDataRows || !this.csvDataRows.length) return;

    const phoneCol = parseInt(document.getElementById('map-col-phone')?.value ?? -1);
    const nameCol  = parseInt(document.getElementById('map-col-name')?.value ?? -1);
    const compCol  = parseInt(document.getElementById('map-col-company')?.value ?? -1);
    const catCol   = parseInt(document.getElementById('map-col-category')?.value ?? -1);

    const defaultCat    = (document.getElementById('import-category-input')?.value || '').trim() || 'Uncategorised';
    const targetProduct = document.getElementById('import-project-select')?.value || 'prod_1';

    const validContacts = [];
    const previewTbody = document.getElementById('csv-preview-tbody');

    for (const row of this.csvDataRows) {
      const rawPhone = phoneCol >= 0 && row[phoneCol] !== undefined ? String(row[phoneCol]) : '';
      let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone)) {
        cleanPhone = '91' + cleanPhone;
      }

      if (cleanPhone.length >= 7) {
        const name     = (nameCol >= 0 && row[nameCol] !== undefined ? String(row[nameCol]).trim() : '') || 'Prospect';
        const company  = (compCol >= 0 && row[compCol] !== undefined ? String(row[compCol]).trim() : '');
        const rowCat   = (catCol >= 0 && row[catCol] !== undefined ? String(row[catCol]).trim() : '');
        const category = rowCat || defaultCat;

        validContacts.push({
          phone: cleanPhone,
          name,
          company,
          category,
          productId: targetProduct,
          status: 'READY'
        });
      }
    }

    this.csvContactsReady = validContacts;

    // Render Preview Table (first 4 items)
    if (previewTbody) {
      if (validContacts.length === 0) {
        previewTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--rose-text);padding:10px;">No valid phone numbers found in the selected Phone column.</td></tr>`;
      } else {
        const previewSlice = validContacts.slice(0, 4);
        previewTbody.innerHTML = previewSlice.map((c, i) => `
          <tr>
            <td style="color:var(--text-muted);font-weight:600;">${i+1}</td>
            <td class="font-mono" style="font-weight:600;color:var(--text-primary);">${c.phone}</td>
            <td>${c.name}</td>
            <td style="color:var(--text-secondary);">${c.company || '—'}</td>
            <td><span class="badge badge-default" style="font-size:10px;">${c.category}</span></td>
          </tr>
        `).join('');
      }
    }

    // Update Valid count badge
    const badge = document.getElementById('csv-valid-count-badge');
    if (badge) {
      badge.textContent = `${validContacts.length} valid contacts`;
      badge.className = validContacts.length > 0 ? 'badge badge-green' : 'badge badge-rose';
    }

    this.updateImportSubmitState();
  }

  resetCSVState() {
    this.csvRawRows = [];
    this.csvHeaders = [];
    this.csvDataRows = [];
    this.csvContactsReady = [];

    const dropzone   = document.getElementById('csv-dropzone');
    const fileCard   = document.getElementById('csv-file-card');
    const mapSection = document.getElementById('csv-mapping-section');
    const previewBox = document.getElementById('csv-preview-box');
    const previewTbody = document.getElementById('csv-preview-tbody');

    if (dropzone) dropzone.style.display = 'flex';
    if (fileCard) fileCard.style.display = 'none';
    if (mapSection) mapSection.style.display = 'none';
    if (previewBox) previewBox.style.display = 'none';
    if (previewTbody) previewTbody.innerHTML = '';

    this.updateImportSubmitState();
  }

  updateImportSubmitState() {
    const btn = document.getElementById('submit-import-btn');
    const statusText = document.getElementById('import-status-text');
    if (!btn || !statusText) return;

    if (this.importMode === 'csv') {
      const count = this.csvContactsReady ? this.csvContactsReady.length : 0;
      if (count > 0) {
        btn.disabled = false;
        btn.textContent = `Import ${count} Contacts`;
        statusText.textContent = `Ready to import ${count} contact${count !== 1 ? 's' : ''}`;
        statusText.style.color = 'var(--accent)';
      } else {
        btn.disabled = true;
        btn.textContent = 'Import Contacts';
        statusText.textContent = this.csvDataRows?.length ? 'No valid numbers in selected Phone column' : 'Select a CSV file to begin';
        statusText.style.color = 'var(--text-muted)';
      }
    } else {
      const rawText = document.getElementById('import-textarea')?.value || '';
      const lines = rawText.split('\n').filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        btn.disabled = false;
        btn.textContent = `Import ${lines.length} Contacts`;
        statusText.textContent = `${lines.length} lines entered`;
        statusText.style.color = 'var(--accent)';
      } else {
        btn.disabled = true;
        btn.textContent = 'Import Contacts';
        statusText.textContent = 'Enter numbers one per line';
        statusText.style.color = 'var(--text-muted)';
      }
    }
  }

  async updateImportCategoryDatalist() {
    const sel = document.getElementById('import-project-select');
    const dl  = document.getElementById('import-category-datalist');
    if (!sel || !dl) return;

    const pid = sel.value;
    try {
      const r = await fetch(`/api/contacts/categories?product=${pid}`);
      const d = await r.json();
      if (d.categories) {
        dl.innerHTML = d.categories.map(c => `<option value="${c}">`).join('');
      }
    } catch(e) {}
  }

  populateProjectDropdowns() {
    const products = this.app.products || [];
    ['import-project-select', 'contact-modal-project'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = products.map(p =>
        `<option value="${p.id}" ${p.id === (this.selectedProjectId || 'prod_1') ? 'selected' : ''}>${p.name}</option>`
      ).join('');
    });

    const catInput = document.getElementById('import-category-input');
    if (catInput) {
      catInput.value = (this.selectedCategory && this.selectedCategory !== 'all') ? this.selectedCategory : '';
    }
    this.updateImportCategoryDatalist();
    this.updateImportSubmitState();
  }

  async handleImport() {
    const productId = document.getElementById('import-project-select')?.value || 'prod_1';
    const defaultCategory = (document.getElementById('import-category-input')?.value || '').trim() || 'Uncategorised';
    let contactsToImport = [];

    if (this.importMode === 'csv') {
      contactsToImport = this.csvContactsReady || [];
      contactsToImport.forEach(c => {
        c.productId = productId;
        if (!c.category || c.category === 'Uncategorised') c.category = defaultCategory;
      });
    } else {
      const rawText = document.getElementById('import-textarea')?.value || '';
      contactsToImport = rawText.split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .map(line => {
          const parts = line.split(',');
          let phone = (parts[0] || '').trim().replace(/[^0-9]/g, '');
          if (phone.length === 10 && /^[6-9]/.test(phone)) phone = '91' + phone;
          return {
            phone,
            name:     (parts[1] || 'Prospect').trim(),
            company:  (parts[2] || '').trim(),
            category: (parts[3] || '').trim() || defaultCategory,
            productId,
            status:   'READY'
          };
        })
        .filter(c => c.phone.length >= 7);
    }

    if (!contactsToImport.length) {
      alert('No valid contacts to import. Please check your data or column mapping.');
      return;
    }

    const btn = document.getElementById('submit-import-btn');
    btn.disabled = true;
    btn.textContent = `Importing ${contactsToImport.length} contacts…`;

    try {
      const r = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: contactsToImport, defaultProductId: productId, defaultCategory })
      });
      const d = await r.json();
      if (d.success) {
        document.getElementById('import-modal').classList.remove('open');
        this.resetCSVState();
        const fileInput = document.getElementById('csv-file-input');
        if (fileInput) fileInput.value = '';
        const textarea = document.getElementById('import-textarea');
        if (textarea) textarea.value = '';

        // Switch to the project imported into so user immediately sees the contacts
        this.selectedProjectId = productId;
        await this.renderCategoryTree();
        await this.fetchAndRender();
        this.app.composer?.loadCustomerList(productId);

        const prod = (this.app.products || []).find(p => p.id === productId);
        this.showToast(`✓ Successfully imported ${d.importedCount} contacts into ${prod?.name || 'Project'}!`);
      } else {
        alert(`Import failed: ${d.error || 'Unknown error'}`);
      }
    } catch(e) {
      alert(`Import error: ${e.message}`);
    } finally {
      btn.disabled = false;
      this.updateImportSubmitState();
    }
  }

  showToast(msg) {
    let t = document.getElementById('crm-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'crm-toast';
      t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:var(--green);color:#fff;padding:10px 18px;border-radius:10px;font-weight:600;font-size:13px;box-shadow:0 4px 20px rgba(0,0,0,.15);z-index:9999;transition:opacity .3s;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3000);
  }
}
