import { ButtonManager } from './buttonManager.js';
import { CampaignComposer } from './composer.js';
import { UnifiedInbox } from './inbox.js';
import { SafeguardsStudio } from './safeguards.js';
import { AudienceManager } from './audience.js';
import { AutoPilotEngine } from './autopilot.js?v=4.2';

class App {
  constructor() {
    this.products      = [];
    this.activeTab     = 'campaigns';
    this.activeProject = null; // currently selected project (for composer)
    this.waStatus      = 'DISCONNECTED';
    this.init();
  }

  async init() {
    await this.fetchProducts();
    await this.fetchSessionStatus();
    this.setupNavigation();
    this.setupQRModal();
    this.setupNewProjectModal();
    this.initSSE();

    this.buttonManager = new ButtonManager(this);
    this.composer      = new CampaignComposer(this);
    this.inbox         = new UnifiedInbox(this);
    this.safeguards    = new SafeguardsStudio(this);
    this.audience      = new AudienceManager(this);
    this.autopilot     = new AutoPilotEngine(this);

    this.fetchQueueStatus();
    this.setupQueueControls();
    this.setupAnalyticsFilter();

    // Automatically select initial project so Campaign Studio loads template, buttons & recipients!
    if (this.activeProject) {
      this.selectProject(this.activeProject.id);
    }
  }

  // ── Products ──────────────────────────────────────────────────────────────
  async fetchProducts() {
    try {
      const r = await fetch('/api/products');
      const d = await r.json();
      if (d.success) {
        this.products = d.products || [];
        this.renderSidebarProjects();
        this.populateProductSelectors();

        if (this.activeProject) {
          this.activeProject = this.products.find(p => p.id === this.activeProject.id) || this.products[0] || null;
        } else if (this.products.length > 0) {
          this.activeProject = this.products[0];
        }

        if (this.audience) {
          this.audience.renderProjectTree();
          this.audience.renderCategoryTree();
          this.audience.fetchAndRender();
        }
      }
    } catch (e) { console.error('[App] fetchProducts', e); }
  }

  renderSidebarProjects() {
    const container = document.getElementById('sidebar-projects-list');
    if (!container) return;

    container.innerHTML = this.products.map(p => `
      <div class="nav-link project-nav-link" data-project-id="${p.id}" style="position:relative;">
        <span class="nav-icon">
          <span style="width:10px;height:10px;border-radius:50%;background:${p.color || '#00ff55'};display:block;box-shadow:0 0 6px ${p.color || '#00ff55'};"></span>
        </span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.name}</span>
        <span class="nav-badge" style="font-size:10px;">${p.price || ''}</span>
      </div>
    `).join('');

    container.querySelectorAll('.project-nav-link').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.projectId;
        this.selectProject(id);
        this.switchTab('campaigns');
      });
    });
  }

  selectProject(productId) {
    this.activeProject = this.products.find(p => p.id === productId);
    if (!this.activeProject) return;

    // Highlight sidebar
    document.querySelectorAll('.project-nav-link').forEach(el => {
      el.classList.toggle('active', el.dataset.projectId === productId);
    });

    // Sync composer dropdown
    const sel = document.getElementById('composer-product-select');
    if (sel && sel.value !== productId) sel.value = productId;

    // Update composer banner
    this.updateCampaignBanner();

    // Load project's template & buttons & recipients into composer
    this.buttonManager?.loadProject(productId);
    this.composer?.loadProject(productId);

    // Update project stats row
    this.fetchProjectStats(productId);
  }

  updateCampaignBanner() {
    const p = this.activeProject;
    if (!p) return;

    const banner = document.getElementById('campaign-project-banner');
    const nameEl = document.getElementById('campaign-project-name');
    const descEl = document.getElementById('campaign-project-desc');

    if (banner) banner.style.background = "#181818";
    if (banner && p.color) banner.style.borderColor = "rgba(255,255,255,0.08)";
    if (nameEl) nameEl.textContent = p.name;
    if (descEl) descEl.textContent = p.description || 'No description set';
  }

  lightenColor(hex, pct) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (num >> 16) + pct);
    const g = Math.min(255, ((num >> 8) & 0xFF) + pct);
    const b = Math.min(255, (num & 0xFF) + pct);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6,'0')}`;
  }

  populateProductSelectors() {
    const opts = `<option value="">Select Project…</option>` +
      this.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    const selIds = ['composer-product-select', 'inbox-project-filter', 'import-project-select', 'analytics-project-filter'];
    selIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const extra = ['inbox-project-filter', 'analytics-project-filter'].includes(id)
        ? '<option value="all">All Projects</option>' : '';
      el.innerHTML = extra + this.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    });
  }

  async fetchProjectStats(productId) {
    try {
      const r = await fetch(`/api/stats?product=${productId}`);
      const d = await r.json();
      if (!d.success) return;
      const s = d.stats;
      const bind = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
      bind('ps-total',      s.total);
      bind('ps-sent',       s.sent);
      bind('ps-noreply',    s.noReply);
      bind('ps-replied',    s.replied);
      bind('ps-interested', s.interested);
      bind('ps-optout',     s.optOut);
    } catch(e) { console.error(e); }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  setupNavigation() {
    document.querySelectorAll('.nav-link[data-tab]').forEach(el => {
      el.addEventListener('click', () => this.switchTab(el.dataset.tab));
    });
  }

  switchTab(id) {
    this.activeTab = id;

    document.querySelectorAll('.nav-link[data-tab]').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === id);
    });

    document.querySelectorAll('.view-page').forEach(page => {
      page.classList.toggle('active', page.id === `view-${id}`);
    });

    const titles = {
      campaigns:  'Campaign Studio',
      inbox:      'Unified Multi-Product Inbox',
      safeguards: '15 Anti-Ban Safeguards Studio',
      audience:   'Audiences & Contact Lists',
      analytics:  'Funnel Analytics'
    };
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = titles[id] || 'Dashboard';

    if (id === 'campaigns') {
      if (this.activeProject) this.selectProject(this.activeProject.id);
    }
    if (id === 'inbox')     this.inbox?.fetchContacts();
    if (id === 'audience') {
      this.audience?.renderProjectTree();
      this.audience?.renderCategoryTree();
      this.audience?.fetchAndRender();
    }
    if (id === 'analytics') this.fetchAnalyticsStats();
  }

  // ── QR Modal ───────────────────────────────────────────────────────────────
  setupQRModal() {
    const openModal  = () => { document.getElementById('qr-modal').classList.add('open'); this.fetchSessionStatus(); };
    const closeModal = () => document.getElementById('qr-modal').classList.remove('open');

    document.getElementById('open-qr-modal-btn')?.addEventListener('click', openModal);
    document.getElementById('topbar-qr-btn')?.addEventListener('click', openModal);
    document.getElementById('close-qr-modal')?.addEventListener('click', closeModal);

    document.getElementById('btn-logout-wa')?.addEventListener('click', async () => {
      if (!confirm('Disconnect and clear WhatsApp session?')) return;
      await fetch('/api/session/logout', { method:'POST' });
      this.fetchSessionStatus();
    });

    document.getElementById('btn-reconnect-wa')?.addEventListener('click', async () => {
      await fetch('/api/session/connect', { method:'POST' });
      this.fetchSessionStatus();
    });
  }

  async fetchSessionStatus() {
    try {
      const r = await fetch('/api/session/status');
      const d = await r.json();
      this.updateWAState(d);
    } catch(e) { console.error(e); }
  }

  updateWAState(d) {
    this.waStatus = d.status || 'DISCONNECTED';

    const dot  = document.getElementById('global-status-dot');
    const text = document.getElementById('global-status-text');
    const modalText = document.getElementById('modal-wa-status-text');
    const qrImg = document.getElementById('modal-qr-img');
    const qrPh  = document.getElementById('modal-qr-placeholder');

    const statusClass = (d.status || 'disconnected').toLowerCase();
    if (dot)  { dot.className = `session-dot ${statusClass}`; }

    const textMap = {
      CONNECTED:    'WhatsApp Connected',
      QR_READY:     'Scan QR Code Now',
      CONNECTING:   'Connecting…',
      DISCONNECTED: 'Not Connected'
    };
    if (text)      text.textContent = textMap[d.status] || 'Not Connected';
    if (modalText) modalText.textContent = `Status: ${d.status || 'DISCONNECTED'}`;

    if (d.qr && d.status === 'QR_READY') {
      if (qrImg) { qrImg.src = d.qr; qrImg.style.display = 'block'; }
      if (qrPh)  qrPh.style.display = 'none';
    } else if (d.status === 'CONNECTED') {
      if (qrImg) qrImg.style.display = 'none';
      if (qrPh)  qrPh.innerHTML = `
        <div style="text-align:center;padding:32px;color:var(--green);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <div style="font-weight:800;font-size:15px;margin-top:8px;color:var(--text-primary);">Device Paired</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${d.user?.id || 'Connected Account'}</div>
        </div>`;
    } else {
      if (qrImg) qrImg.style.display = 'none';
      if (qrPh)  qrPh.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:40px;color:var(--text-muted);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <span style="font-size:13px;font-weight:600;">Awaiting Baileys handshake…</span>
        </div>`;
    }
  }

  // ── New / Edit / Delete Project ───────────────────────────────────────────
  setupNewProjectModal() {
    const modal = document.getElementById('new-project-modal');
    const close = () => {
      if (modal) modal.classList.remove('open');
      const editInput = document.getElementById('edit-project-id');
      if (editInput) editInput.value = '';
    };

    document.getElementById('close-new-project-modal')?.addEventListener('click', close);
    document.getElementById('close-new-project-modal-2')?.addEventListener('click', close);

    // Sync color picker ↔ hex input
    document.getElementById('new-project-color')?.addEventListener('input', e => {
      const hexInput = document.getElementById('new-project-color-hex');
      if (hexInput) hexInput.value = e.target.value;
    });

    document.getElementById('new-project-color-hex')?.addEventListener('input', e => {
      const picker = document.getElementById('new-project-color');
      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value) && picker) picker.value = e.target.value;
    });

    // Wire trigger buttons
    document.getElementById('sidebar-add-project-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openCreateProjectModal();
    });

    document.getElementById('audience-new-project-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openCreateProjectModal();
    });

    document.getElementById('btn-edit-project-settings')?.addEventListener('click', () => {
      if (this.activeProject) this.openEditProjectModal(this.activeProject.id);
      else this.openCreateProjectModal();
    });

    // Save project button
    document.getElementById('save-new-project-btn')?.addEventListener('click', async () => {
      const name = document.getElementById('new-project-name').value.trim();
      if (!name) { alert('Project name is required.'); return; }

      const editId = document.getElementById('edit-project-id').value;
      const payload = {
        name,
        description: document.getElementById('new-project-desc').value.trim(),
        price:       document.getElementById('new-project-price').value.trim(),
        color:       document.getElementById('new-project-color-hex').value.trim() || '#00ff55',
        active:      true
      };

      try {
        const url = editId ? `/api/products/${editId}` : '/api/products';
        const method = editId ? 'PUT' : 'POST';
        const r = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const d = await r.json();
        if (d.success) {
          await this.fetchProducts();
          close();

          if (editId) {
            this.activeProject = this.products.find(p => p.id === editId) || this.products[0];
            this.updateCampaignBanner();
            if (this.audience) {
              this.audience.renderProjectTree();
              this.audience.renderCategoryTree();
              this.audience.fetchAndRender();
            }
          } else {
            const newProd = d.products ? d.products[d.products.length - 1] : (d.product || this.products[this.products.length - 1]);
            if (newProd) {
              this.selectProject(newProd.id);
              if (this.audience) {
                this.audience.selectedProjectId = newProd.id;
                this.audience.selectedCategory = 'all';
                this.audience.renderProjectTree();
                this.audience.renderCategoryTree();
                this.audience.fetchAndRender();
              }
            }
          }
        } else {
          alert(d.error || 'Failed to save project');
        }
      } catch(e) {
        console.error(e);
        alert('Error: ' + e.message);
      }
    });
  }

  openCreateProjectModal() {
    const modal = document.getElementById('new-project-modal');
    if (!modal) return;
    document.getElementById('edit-project-id').value = '';
    document.getElementById('new-project-modal-title').textContent = 'Create New Project';
    document.getElementById('new-project-name').value  = '';
    document.getElementById('new-project-desc').value  = '';
    document.getElementById('new-project-price').value = '';
    const defColor = '#10B981';
    const colorPicker = document.getElementById('new-project-color');
    const colorHex    = document.getElementById('new-project-color-hex');
    if (colorPicker) colorPicker.value = defColor;
    if (colorHex)    colorHex.value    = defColor;
    const saveBtn = document.getElementById('save-new-project-btn');
    if (saveBtn) saveBtn.textContent = 'Create Project';
    modal.classList.add('open');
    setTimeout(() => document.getElementById('new-project-name')?.focus(), 50);
  }

  openEditProjectModal(projectId) {
    const p = this.products.find(x => x.id === projectId) || this.activeProject;
    if (!p) { alert('Please select a project to edit.'); return; }
    const modal = document.getElementById('new-project-modal');
    if (!modal) return;
    document.getElementById('edit-project-id').value = p.id;
    document.getElementById('new-project-modal-title').textContent = 'Edit Project';
    document.getElementById('new-project-name').value  = p.name || '';
    document.getElementById('new-project-desc').value  = p.description || '';
    document.getElementById('new-project-price').value = p.price || '';
    const colorPicker = document.getElementById('new-project-color');
    const colorHex    = document.getElementById('new-project-color-hex');
    if (colorPicker) colorPicker.value = p.color || '#10B981';
    if (colorHex)    colorHex.value    = p.color || '#10B981';
    const saveBtn = document.getElementById('save-new-project-btn');
    if (saveBtn) saveBtn.textContent = 'Save Changes';
    modal.classList.add('open');
    setTimeout(() => document.getElementById('new-project-name')?.focus(), 50);
  }

  async deleteProject(projectId) {
    const p = this.products.find(x => x.id === projectId);
    if (!p) return;
    if (this.products.length <= 1) {
      alert('You must have at least one project in the CRM.');
      return;
    }
    if (!confirm(`Are you sure you want to delete project "${p.name}" and all its contacts?\n\nThis action cannot be undone.`)) return;

    try {
      const r = await fetch(`/api/products/${projectId}`, { method: 'DELETE' });
      const d = await r.json();
      if (d.success) {
        await this.fetchProducts();
        if (this.activeProject?.id === projectId) {
          this.selectProject(this.products[0]?.id);
        }
        if (this.audience) {
          this.audience.selectedProjectId = this.products[0]?.id || null;
          this.audience.selectedCategory = 'all';
          this.audience.renderProjectTree();
          this.audience.renderCategoryTree();
          this.audience.fetchAndRender();
        }
      } else {
        alert(d.error || 'Failed to delete project');
      }
    } catch(e) {
      console.error(e);
      alert('Error: ' + e.message);
    }
  }

  // ── SSE Real-time streaming ────────────────────────────────────────────────
  initSSE() {
    const es = new EventSource('/api/events');
    let inboxThrottleTimer = null;
    const throttledInboxFetch = () => {
      if (inboxThrottleTimer) return;
      inboxThrottleTimer = setTimeout(() => {
        inboxThrottleTimer = null;
        this.inbox?.fetchContacts(false);
      }, 700);
    };

    es.onmessage = (e) => {
      try {
        const { type, data } = JSON.parse(e.data);
        if (type === 'INIT') {
          this.updateWAState(data.waStatus);
          this.updateQueueBadge(data.queueStatus);
        }
        if (type === 'WA_STATUS')       this.updateWAState(data);
        if (type === 'WA_QR')           this.updateWAState({ status:'QR_READY', qr: data.qr });
        if (type === 'QUEUE_UPDATED')   this.updateQueueBadge(data);
        if (type === 'MESSAGE_RECEIVED' || type === 'MESSAGE_SENT') {
          throttledInboxFetch();
          if (this.inbox?.selectedContact && data?.phone) {
            const cleanTarget = (data.phone || '').replace(/[^0-9]/g, '');
            const cleanSelected = (this.inbox.selectedContact.phone || '').replace(/[^0-9]/g, '');
            if (cleanTarget === cleanSelected) {
              this.inbox.loadChatThread(this.inbox.selectedContact.phone);
            }
          }
        }
        if (type === 'QUEUE_ALERT') {
          const el = document.getElementById('queue-pill-text');
          if (el) el.textContent = data.message;
        }
      } catch(_) {}
    };
  }

  setupQueueControls() {
    const btn = document.getElementById('topbar-queue-action-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      try {
        const action = btn.dataset.action;
        if (action === 'resume') {
          await fetch('/api/queue/resume', { method: 'POST' });
        } else if (action === 'pause') {
          await fetch('/api/queue/pause', { method: 'POST' });
        }
        await this.fetchQueueStatus();
      } catch (e) { console.error('Queue control error:', e); }
    });
  }

  updateQueueBadge(q) {
    const pill = document.getElementById('queue-pill');
    const text = document.getElementById('queue-pill-text');
    const actionBtn = document.getElementById('topbar-queue-action-btn');
    const actionText = document.getElementById('topbar-queue-action-text');
    if (!pill || !text) return;

    if (q?.isRunning && q?.queueLength > 0) {
      pill.classList.add('running');
      text.textContent = `Sending — ${q.queueLength} queued`;
      if (actionBtn && actionText) {
        actionBtn.style.display = 'inline-flex';
        actionBtn.style.background = '#F59E0B';
        actionBtn.style.borderColor = '#F59E0B';
        actionBtn.dataset.action = 'pause';
        actionText.textContent = 'Pause Queue';
      }
    } else if (q?.isPaused && q?.queueLength > 0) {
      pill.classList.remove('running');
      text.textContent = `Paused (${q.queueLength} pending)`;
      if (actionBtn && actionText) {
        actionBtn.style.display = 'inline-flex';
        actionBtn.style.background = '#10B981';
        actionBtn.style.borderColor = '#10B981';
        actionBtn.dataset.action = 'resume';
        actionText.textContent = `Resume Queue (${q.queueLength} left)`;
      }
    } else {
      pill.classList.remove('running');
      text.textContent = `Queue Idle (${q?.sentTodayCount || 0} sent today)`;
      if (actionBtn) {
        actionBtn.style.display = 'none';
      }
    }
  }

  showPacingTimer(seconds) {
    const text = document.getElementById('queue-pill-text');
    if (!text) return;
    let s = seconds;
    text.textContent = `Safeguard wait: ${s}s…`;
    const t = setInterval(() => {
      s--;
      if (s > 0) text.textContent = `Safeguard wait: ${s}s…`;
      else clearInterval(t);
    }, 1000);
  }

  async fetchQueueStatus() {
    try {
      const r = await fetch('/api/queue/status');
      const d = await r.json();
      if (d.success) this.updateQueueBadge(d);
    } catch(_) {}
  }

  setupAnalyticsFilter() {
    document.getElementById('analytics-project-filter')?.addEventListener('change', () => this.fetchAnalyticsStats());
  }

  async fetchAnalyticsStats() {
    try {
      const productId = document.getElementById('analytics-project-filter')?.value || 'all';
      const r = await fetch(`/api/stats?product=${productId}`);
      const d = await r.json();
      if (!d.success) return;
      const s = d.stats;
      const bind = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };
      bind('a-total',     s.total);
      bind('a-sent',      s.sent);
      bind('a-noreply',   s.noReply);
      bind('a-replied',   s.replied);
      bind('a-interested',s.interested);
      bind('a-pricing',   s.pricing);
      bind('a-optout',    s.optOut);
      bind('a-replyrate', `${s.replyRate}%`);
    } catch(e) { console.error(e); }
  }
}

document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
