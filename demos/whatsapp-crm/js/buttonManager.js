export class ButtonManager {
  constructor(app) {
    this.app = app;
    this.buttons = [];
    this.currentProductId = null;
    this.setupModal();
  }

  async loadProject(productId) {
    this.currentProductId = productId;
    try {
      const r = await fetch(`/api/products/${productId}/buttons`);
      const d = await r.json();
      if (d.success) {
        this.buttons = d.buttons;
        this.renderEditorList();
      }
    } catch(e) { console.error('[BtnMgr] loadProject', e); }
  }

  renderEditorList() {
    const container = document.getElementById('composer-buttons-list');
    if (!container) return;

    const actionColors = {
      AUTO_TAG:   'badge-green',
      AUTO_REPLY: 'badge-blue',
      BLACKLIST:  'badge-rose'
    };

    container.innerHTML = this.buttons.map((btn, idx) => `
      <div class="btn-editor-item" data-idx="${idx}">
        <div style="width:28px;height:28px;border-radius:8px;background:${this.getBtnColor(btn.actionType)};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${this.getBtnIcon(btn.actionType)}
        </div>
        <input type="text" class="btn-editor-label-input" value="${btn.label}" data-idx="${idx}" placeholder="Button Label" />
        <span class="badge ${actionColors[btn.actionType] || 'badge-default'} btn-editor-action-tag">${btn.actionType}</span>
        <button type="button" class="btn btn-secondary btn-icon-sm open-btn-config-btn" data-idx="${idx}" title="Configure action">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>
    `).join('');

    // Inline label edits
    container.querySelectorAll('.btn-editor-label-input').forEach(inp => {
      inp.addEventListener('input', e => {
        const idx = parseInt(e.target.dataset.idx);
        this.buttons[idx].label = e.target.value;
        this.app.composer?.updatePreview();
      });
      inp.addEventListener('change', () => {
        this.saveButtons();
      });
    });

    // Config modal open
    container.querySelectorAll('.open-btn-config-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        this.openConfigModal(parseInt(e.currentTarget.dataset.idx));
      });
    });

    // Save buttons CTA
    document.getElementById('save-project-buttons-btn')?.removeEventListener('click', this._saveBtnHandler);
    this._saveBtnHandler = () => this.saveButtons();
    document.getElementById('save-project-buttons-btn')?.addEventListener('click', this._saveBtnHandler);

    // Update phone preview
    this.app.composer?.updatePreview();
  }

  getBtnColor(actionType) {
    return { AUTO_TAG:'#ECFDF5', AUTO_REPLY:'#EFF6FF', BLACKLIST:'#FFF1F3' }[actionType] || '#F5F5F5';
  }

  getBtnIcon(actionType) {
    if (actionType === 'AUTO_TAG')
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    if (actionType === 'AUTO_REPLY')
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`;
  }

  setupModal() {
    const modal   = document.getElementById('btn-config-modal');
    const closeEl = () => modal?.classList.remove('open');

    document.getElementById('close-btn-config-modal')?.addEventListener('click',   closeEl);
    document.getElementById('close-btn-config-modal-2')?.addEventListener('click', closeEl);

    // Image upload trigger for auto-reply
    const fileInput = document.getElementById('modal-btn-reply-media-file');
    const uploadTrigger = document.getElementById('modal-btn-upload-trigger');
    const uploadLabel = document.getElementById('modal-btn-upload-label');
    const mediaInput = document.getElementById('modal-btn-reply-media');
    const previewRow = document.getElementById('modal-btn-media-preview-row');
    const mediaImg = document.getElementById('modal-btn-media-img');
    const mediaName = document.getElementById('modal-btn-media-name');
    const removeBtn = document.getElementById('modal-btn-media-remove');

    uploadTrigger?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (uploadLabel) uploadLabel.textContent = 'Uploading…';
      const formData = new FormData();
      formData.append('media', file);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success && data.url) {
          mediaInput.value = data.url;
          if (mediaImg) mediaImg.src = data.url;
          if (mediaName) mediaName.textContent = file.name || 'uploaded_image.jpg';
          if (previewRow) previewRow.style.display = 'flex';
        } else {
          alert('Failed to upload image: ' + (data.error || 'Server error'));
        }
      } catch (err) {
        console.error('[ButtonManager] Upload error:', err);
        alert('Upload failed: ' + err.message);
      } finally {
        if (uploadLabel) uploadLabel.textContent = 'Change Photo / Flyer';
        fileInput.value = '';
      }
    });

    removeBtn?.addEventListener('click', () => {
      mediaInput.value = '';
      if (previewRow) previewRow.style.display = 'none';
      if (uploadLabel) uploadLabel.textContent = 'Upload Photo / Flyer';
    });

    document.getElementById('save-btn-config')?.addEventListener('click', async () => {
      const idx = parseInt(document.getElementById('modal-btn-index').value);
      this.buttons[idx] = {
        ...this.buttons[idx],
        label:        document.getElementById('modal-btn-label').value,
        actionType:   document.getElementById('modal-btn-action').value,
        actionPayload: {
          ...this.buttons[idx]?.actionPayload,
          tag:           document.getElementById('modal-btn-tag').value,
          replyMessage:  document.getElementById('modal-btn-reply').value,
          replyMediaUrl: document.getElementById('modal-btn-reply-media').value || null
        }
      };
      this.renderEditorList();
      closeEl();
      await this.saveButtons();
    });
  }

  openConfigModal(idx) {
    const btn = this.buttons[idx];
    if (!btn) return;
    document.getElementById('modal-btn-index').value   = idx;
    document.getElementById('modal-btn-label').value   = btn.label;
    document.getElementById('modal-btn-action').value  = btn.actionType;
    document.getElementById('modal-btn-tag').value     = btn.actionPayload?.tag || '';
    document.getElementById('modal-btn-reply').value   = btn.actionPayload?.replyMessage || '';

    // Populate media preview
    const mediaUrl = btn.actionPayload?.replyMediaUrl || '';
    const mediaInput = document.getElementById('modal-btn-reply-media');
    const previewRow = document.getElementById('modal-btn-media-preview-row');
    const mediaImg = document.getElementById('modal-btn-media-img');
    const mediaName = document.getElementById('modal-btn-media-name');
    const uploadLabel = document.getElementById('modal-btn-upload-label');

    if (mediaInput) mediaInput.value = mediaUrl;
    if (mediaUrl) {
      if (mediaImg) mediaImg.src = mediaUrl;
      if (mediaName) mediaName.textContent = mediaUrl.split('/').pop() || 'photo_flyer.jpg';
      if (previewRow) previewRow.style.display = 'flex';
      if (uploadLabel) uploadLabel.textContent = 'Change Photo / Flyer';
    } else {
      if (previewRow) previewRow.style.display = 'none';
      if (uploadLabel) uploadLabel.textContent = 'Upload Photo / Flyer';
    }

    document.getElementById('btn-config-modal').classList.add('open');
  }

  async saveButtons() {
    if (!this.currentProductId) return;
    try {
      const r = await fetch(`/api/products/${this.currentProductId}/buttons`, {
        method: 'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ buttons: this.buttons })
      });
      const d = await r.json();
      if (d.success) {
        this.buttons = d.buttons;
        this.renderEditorList();
        const saveBtn = document.getElementById('save-project-buttons-btn');
        if (saveBtn) {
          const orig = saveBtn.innerHTML;
          saveBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Saved!`;
          saveBtn.style.background = '#10B981';
          saveBtn.style.borderColor = '#10B981';
          saveBtn.style.color = '#fff';
          setTimeout(() => {
            saveBtn.innerHTML = orig;
            saveBtn.style.background = '';
            saveBtn.style.borderColor = '';
            saveBtn.style.color = '';
          }, 1800);
        }
      }
    } catch(e) { console.error('[BtnMgr] saveButtons error:', e); }
  }

  getButtons() { return this.buttons; }
}
