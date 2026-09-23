export class UnifiedInbox {
  constructor(app) {
    this.app = app;
    this.contacts = [];
    this.selectedContact = null;
    this.activeProduct = 'all';
    this.activeStatus  = 'all';
    this.searchQuery   = '';
    this._searchDebounceTimer = null;
    this.init();
  }

  init() {
    this.setupListeners();
    this.fetchContacts(true);
  }

  setupListeners() {
    document.getElementById('inbox-project-filter')?.addEventListener('change', e => {
      this.activeProduct = e.target.value;
      this.fetchContacts(true);
    });

    document.getElementById('inbox-search-input')?.addEventListener('input', e => {
      this.searchQuery = e.target.value;
      clearTimeout(this._searchDebounceTimer);
      this._searchDebounceTimer = setTimeout(() => {
        this.fetchContacts(true);
      }, 200);
    });

    const statusTabs = document.getElementById('inbox-status-tabs');
    if (statusTabs) {
      statusTabs.querySelectorAll('.status-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          document.querySelectorAll('#inbox-status-tabs .status-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.activeStatus = tab.dataset.status;
          this.fetchContacts(true);
        });
      });

      // Smooth horizontal mouse wheel scroll for tabs
      statusTabs.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          statusTabs.scrollLeft += e.deltaY;
        }
      }, { passive: false });
    }

    document.getElementById('inbox-send-reply-btn')?.addEventListener('click', () => this.sendReply());

    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && document.activeElement?.id === 'inbox-reply-input') {
        e.preventDefault();
        this.sendReply();
      }
    });
  }

  async fetchContacts(autoSelect = true) {
    try {
      const url = `/api/contacts?product=${this.activeProduct}&status=${this.activeStatus}&search=${encodeURIComponent(this.searchQuery)}`;
      const r   = await fetch(url);
      const d   = await r.json();
      if (d.success) {
        this.contacts = d.contacts;
        this.renderContactsList(true);

        if (this.selectedContact) {
          const updated = this.contacts.find(c => c.phone === this.selectedContact.phone);
          if (updated) {
            this.selectedContact = updated;
            this.updateHeaderMeta(updated);
          }
        } else if (autoSelect && this.contacts.length > 0) {
          this.selectContact(this.contacts[0]);
        }
      }
    } catch(e) { console.error('fetchContacts error:', e); }
  }

  statusBadge(status, hasReplied = false) {
    const map = {
      INTERESTED:     'badge-green',
      PRICING:        'badge-blue',
      REPLIED:        'badge-purple',
      SENT:           'badge-cyan',
      QUEUED:         'badge-amber',
      BLACKLISTED:    'badge-rose',
      INVALID_NUMBER: 'badge-rose',
      NEW:            'badge-default',
      READY:          'badge-default'
    };

    let label = status;
    if (status === 'SENT' && !hasReplied) {
      label = 'Sent (Waiting)';
    }

    return `<span class="badge ${map[status]||'badge-default'}" style="font-size:10px;font-weight:600;">${label}</span>`;
  }

  renderContactItemHtml(c, isActive, products) {
    const prod     = products.find(p => p.id === c.productId);
    const timeStr  = c.lastMessageAt
      ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
      : '';

    // Last message preview snippet
    let snippetHtml = '';
    if (c.lastChat) {
      const isInbound = c.lastChat.direction === 'inbound';
      const cleanSnippet = (c.lastChat.content || '').replace(/\n/g, ' ').slice(0, 42);
      snippetHtml = `
        <div class="contact-snippet-row" style="font-size:11px;margin:3px 0;display:flex;align-items:center;gap:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${isInbound ? '#10b981' : 'var(--text-muted)'};font-weight:${isInbound ? '600' : '400'};">
          <span>${isInbound ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block;"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block;"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>'}</span>
          <span style="overflow:hidden;text-overflow:ellipsis;">${cleanSnippet || (isInbound ? 'Customer Reply' : 'Campaign Message')}</span>
        </div>
      `;
    } else {
      snippetHtml = `
        <div class="contact-snippet-row" style="font-size:11px;color:var(--text-muted);margin:3px 0;font-style:italic;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${c.company || 'No messages yet'}
        </div>
      `;
    }

    // Replied vs Awaiting Reply pill
    let responsePill = '';
    if (c.hasReplied) {
      responsePill = `<span class="badge badge-green" style="font-size:9.5px;padding:2px 6px;font-weight:700;"> REPLIED (${c.inboundCount})</span>`;
    } else if (c.status === 'SENT' || c.outboundCount > 0) {
      responsePill = `<span class="badge badge-amber" style="font-size:9.5px;padding:2px 6px;font-weight:600;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block;margin-right:2px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> NOT REPLIED</span>`;
    }

    const categoryPill = c.category && c.category !== 'Uncategorised'
      ? `<span class="badge" style="background:#eef2ff;color:#4f46e5;border:1px solid #c7d2fe;font-size:9.5px;padding:1px 5px;font-weight:600;"> ${c.category}</span>`
      : '';

    return `
      <div class="contact-item ${isActive ? 'active' : ''}" data-phone="${c.phone}">
        <div class="contact-item-top">
          <div style="display:flex;align-items:center;gap:5px;min-width:0;">
            <span class="contact-name" style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name || 'Prospect'}</span>
            ${categoryPill}
          </div>
          <div class="contact-time" style="font-size:11px;color:var(--text-muted);flex-shrink:0;">${timeStr}</div>
        </div>
        <div style="font-size:11px;color:var(--text-secondary);display:flex;justify-content:space-between;align-items:center;">
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${c.company || c.phone}</span>
          <span style="font-size:10.5px;color:var(--text-muted);">${c.phone}</span>
        </div>
        ${snippetHtml}
        <div class="contact-footer" style="display:flex;gap:5px;align-items:center;margin-top:4px;flex-wrap:wrap;">
          ${responsePill}
          ${this.statusBadge(c.status, c.hasReplied)}
          ${prod ? `<span class="badge" style="font-size:9.5px;color:${prod.color};border:1px solid ${prod.color}30;background:${prod.color}10;">${prod.name}</span>` : ''}
        </div>
      </div>
    `;
  }

  renderContactsList(preserveScroll = true) {
    const container = document.getElementById('inbox-contacts-list');
    if (!container) return;

    if (!this.contacts.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
          </div>
          <div class="empty-state-title">No conversations found</div>
          <div class="empty-state-desc">No contacts match the "${this.activeStatus}" filter.</div>
        </div>`;
      return;
    }

    const products = this.app.products || [];

    // Check if we can do a seamless in-place patch without touching scroll or recreating DOM
    const existingItems = container.querySelectorAll('.contact-item');
    if (existingItems.length === this.contacts.length && existingItems.length > 0) {
      let canPatch = true;
      for (let i = 0; i < this.contacts.length; i++) {
        if (existingItems[i].dataset.phone !== this.contacts[i].phone) {
          canPatch = false;
          break;
        }
      }

      if (canPatch) {
        // Fast in-place patch: only updates dirty items, scroll momentum is 100% uninterrupted!
        this.contacts.forEach((c, idx) => {
          const itemEl = existingItems[idx];
          const isActive = this.selectedContact?.phone === c.phone;
          if (isActive !== itemEl.classList.contains('active')) {
            itemEl.classList.toggle('active', isActive);
          }
          const itemKey = `${c.status}:${c.hasReplied}:${c.inboundCount}:${c.lastMessageAt || ''}:${c.lastChat?.content || ''}`;
          if (itemEl.dataset.key !== itemKey) {
            itemEl.dataset.key = itemKey;
            const temp = document.createElement('div');
            temp.innerHTML = this.renderContactItemHtml(c, isActive, products);
            const newInner = temp.firstElementChild.innerHTML;
            itemEl.innerHTML = newInner;
          }
        });
        return;
      }
    }

    // Full render needed (filter change, first load, or reordering)
    const prevScrollTop = preserveScroll ? container.scrollTop : 0;
    const html = this.contacts.map(c => {
      const isActive = this.selectedContact?.phone === c.phone;
      return this.renderContactItemHtml(c, isActive, products);
    }).join('');

    container.innerHTML = html;

    // Stamp keys for future in-place patches
    container.querySelectorAll('.contact-item').forEach((itemEl, idx) => {
      const c = this.contacts[idx];
      if (c) {
        itemEl.dataset.key = `${c.status}:${c.hasReplied}:${c.inboundCount}:${c.lastMessageAt || ''}:${c.lastChat?.content || ''}`;
      }
    });

    if (preserveScroll && prevScrollTop > 0) {
      container.scrollTop = prevScrollTop;
    }

    // Setup event delegation once
    if (!container._hasClickDelegate) {
      container._hasClickDelegate = true;
      container.addEventListener('click', (e) => {
        const item = e.target.closest('.contact-item');
        if (!item) return;
        const phone = item.dataset.phone;
        const contact = this.contacts.find(c => c.phone === phone);
        if (contact) {
          this.selectContact(contact);
        }
      });
    }
  }

  async selectContact(contact) {
    this.selectedContact = contact;
    const container = document.getElementById('inbox-contacts-list');
    if (container) {
      container.querySelectorAll('.contact-item.active').forEach(i => i.classList.remove('active'));
      const target = container.querySelector(`.contact-item[data-phone="${contact.phone}"]`);
      if (target) target.classList.add('active');
    }
    this.renderChatPane(contact);
    await this.loadChatThread(contact.phone);
  }

  updateHeaderMeta(contact) {
    const metaEl = document.getElementById('chat-contact-meta');
    if (metaEl) {
      const prod = (this.app.products || []).find(p => p.id === contact.productId);
      metaEl.innerHTML = `
        <span>${contact.phone}</span> &bull; 
        <span>${contact.company || 'No Company'}</span> &bull;
        <span class="badge" style="background:#eef2ff;color:#4f46e5;font-size:10.5px;padding:2px 7px;"> ${contact.category || 'General'}</span>
        ${this.statusBadge(contact.status, contact.hasReplied)}
        ${contact.hasReplied ? '<span class="badge badge-green" style="font-size:10px;"> Replied</span>' : ''}
        ${prod ? `<span class="badge" style="font-size:10px;color:${prod.color};border:1px solid ${prod.color}20;background:${prod.color}12;">${prod.name}</span>` : ''}
      `;
    }
  }

  renderChatPane(contact) {
    const pane = document.getElementById('inbox-chat-pane');
    if (!pane) return;
    const prod = (this.app.products || []).find(p => p.id === contact.productId);

    pane.innerHTML = `
      <div class="chat-header" style="padding:12px 18px;border-bottom:1px solid var(--b1);display:flex;justify-content:space-between;align-items:center;background:var(--bg-3);">
        <div>
          <div class="chat-contact-name-lg" style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:8px;color:var(--t1);">
            <span>${contact.name || 'Prospect'}</span>
            ${contact.category ? `<span class="badge" style="background:rgba(99,102,241,0.15);color:#a5b4fc;border:1px solid rgba(99,102,241,0.3);font-size:11px;padding:2px 8px;"> ${contact.category}</span>` : ''}
          </div>
          <div class="chat-meta" id="chat-contact-meta" style="font-size:12px;color:var(--t2);display:flex;align-items:center;gap:6px;margin-top:3px;">
            <span>${contact.phone}</span> &bull; 
            <span>${contact.company || 'No Company'}</span> &bull;
            ${this.statusBadge(contact.status, contact.hasReplied)}
            ${contact.hasReplied ? '<span class="badge badge-green" style="font-size:10px;"> Replied</span>' : ''}
            ${prod ? `<span class="badge" style="font-size:10px;color:${prod.color};border:1px solid ${prod.color}20;background:${prod.color}12;">${prod.name}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <select class="form-select" id="inbox-status-select" style="font-size:11.5px;padding:5px 8px;width:135px;background:var(--bg-4);color:var(--t1);border:1px solid var(--b1);">
            <option value="READY" ${contact.status === 'READY' ? 'selected' : ''}>Ready</option>
            <option value="NEW" ${contact.status === 'NEW' ? 'selected' : ''}>New</option>
            <option value="SENT" ${contact.status === 'SENT' ? 'selected' : ''}>Sent</option>
            <option value="REPLIED" ${contact.status === 'REPLIED' ? 'selected' : ''}>Replied</option>
            <option value="INTERESTED" ${contact.status === 'INTERESTED' ? 'selected' : ''}>Interested</option>
            <option value="PRICING" ${contact.status === 'PRICING' ? 'selected' : ''}>Pricing</option>
            <option value="BLACKLISTED" ${contact.status === 'BLACKLISTED' ? 'selected' : ''}>Opted Out</option>
          </select>
          <button class="btn btn-secondary btn-sm" id="inbox-send-outreach-btn" title="Send WhatsApp Campaign Template" style="font-size:11.5px;gap:4px;padding:5px 10px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Send Pitch
          </button>
          <button class="btn btn-ghost btn-sm" id="inbox-copy-phone-btn" title="Copy Number" style="padding:5px 8px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      </div>
      <div class="chat-messages" id="chat-thread-canvas" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#0e0e0e;"></div>
      <div class="chat-reply-bar" style="padding:10px 16px;background:var(--bg-3);border-top:1px solid var(--b1);display:flex;gap:10px;align-items:center;">
        <input type="text" class="chat-reply-input" id="inbox-reply-input" placeholder="Type a message to ${contact.name || contact.phone}… (Press Enter to Send)" autocomplete="off" style="flex:1;padding:9px 14px;border:1px solid var(--b1);border-radius:8px;font-size:13px;background:var(--bg-4);color:var(--t1);" />
        <button class="btn btn-primary btn-sm" id="inbox-send-reply-btn" style="gap:6px;padding:9px 18px;font-weight:600;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Send
        </button>
      </div>
    `;

    // Copy phone button
    document.getElementById('inbox-copy-phone-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(contact.phone);
      alert(`Copied ${contact.phone} to clipboard`);
    });

    // Change status listener
    document.getElementById('inbox-status-select')?.addEventListener('change', async (e) => {
      const newStatus = e.target.value;
      try {
        const r = await fetch(`/api/contacts/${contact.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        const d = await r.json();
        if (d.success) {
          contact.status = newStatus;
          this.updateHeaderMeta(contact);
          await this.fetchContacts(false);
        }
      } catch(err) { console.error(err); }
    });

    // Send pitch button
    document.getElementById('inbox-send-outreach-btn')?.addEventListener('click', async () => {
      if (!confirm(`Dispatch campaign outreach message to ${contact.name || 'Prospect'} (${contact.phone})?`)) return;
      const btn = document.getElementById('inbox-send-outreach-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      try {
        const res = await fetch(`/api/contacts/${contact.id}/send`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          await this.loadChatThread(contact.phone);
          await this.fetchContacts(false);
        } else {
          alert(`Dispatch failed: ${data.error || 'Check connection'}`);
        }
      } catch(e) {
        alert('Network error: ' + e.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send Pitch`;
        }
      }
    });

    // Re-attach listeners after DOM re-render
    document.getElementById('inbox-send-reply-btn')?.addEventListener('click', () => this.sendReply());
    document.getElementById('inbox-reply-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendReply(); }
    });
  }

  async loadChatThread(phone) {
    const canvas = document.getElementById('chat-thread-canvas');
    if (!canvas) return;
    try {
      const r = await fetch(`/api/chats/${phone}`);
      const d = await r.json();
      const messages = d.chats || [];

      if (!messages.length) {
        canvas.innerHTML = `
          <div class="empty-state" style="margin:auto;text-align:center;padding:40px 20px;">
            <div class="empty-state-title" style="font-size:15px;font-weight:600;margin-bottom:6px;">No messages in this thread</div>
            <div class="empty-state-desc" style="font-size:12.5px;color:var(--text-muted);max-width:320px;margin:0 auto;">
              Dispatch your promotional campaign template or type a personalized message below.
            </div>
            <button class="btn btn-primary btn-sm" id="inbox-quick-outreach-btn" style="margin-top:14px;gap:6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Send Campaign Pitch Now
            </button>
          </div>`;
        document.getElementById('inbox-quick-outreach-btn')?.addEventListener('click', async () => {
          if (!this.selectedContact) return;
          const btn = document.getElementById('inbox-quick-outreach-btn');
          btn.disabled = true;
          btn.textContent = 'Sending…';
          try {
            const res = await fetch(`/api/contacts/${this.selectedContact.id}/send`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
              await this.loadChatThread(phone);
              await this.fetchContacts(false);
            } else {
              alert(`Failed: ${data.error || 'Check connection'}`);
              btn.disabled = false;
              btn.textContent = 'Send Campaign Pitch Now';
            }
          } catch(e) {
            alert(e.message);
            btn.disabled = false;
          }
        });
        return;
      }

      canvas.innerHTML = messages.map(msg => {
        const isOut = msg.direction === 'outbound';
        const time  = new Date(msg.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
        const content = (msg.content || '').replace(/\n/g, '<br/>').replace(/\*(.*?)\*/g, '<strong>$1</strong>');
        const buttonsHtml = msg.buttons && msg.buttons.length > 0
          ? `<div style="font-size:11px;margin-top:6px;opacity:0.9;border-top:1px solid rgba(255,255,255,0.12);padding-top:5px;color:${isOut ? '#e0e7ff' : '#cbd5e1'};">Options: <strong>${msg.buttons.join(' · ')}</strong></div>` : '';

        // Distinct styling for Customer Replies vs Outreach
        let replyIndicator = '';
        if (!isOut) {
          replyIndicator = `<div style="font-size:10px;font-weight:700;color:#10b981;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.05em;">Customer Reply </div>`;
        }

        return `
          <div class="chat-bubble-wrap ${isOut ? 'out' : 'in'}" style="display:flex;justify-content:${isOut ? 'flex-end' : 'flex-start'};margin-bottom:4px;">
            <div class="chat-bubble ${isOut ? 'out' : 'in'}" style="max-width:72%;padding:10px 14px;border-radius:${isOut ? '14px 2px 14px 14px' : '2px 14px 14px 14px'};background:${isOut ? '#4f46e5' : '#1e1e1e'};color:${isOut ? '#ffffff' : '#f0f0f0'};border:${isOut ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.08)'};box-shadow:0 2px 8px rgba(0,0,0,0.35);font-size:13px;line-height:1.45;">
              ${replyIndicator}
              ${msg.mediaUrl ? `<img src="${msg.mediaUrl}" style="width:100%;max-height:240px;object-fit:cover;border-radius:8px;margin-bottom:7px;" />` : ''}
              <div>${content}</div>
              ${buttonsHtml}
              <div class="chat-bubble-time" style="font-size:10px;margin-top:5px;text-align:right;opacity:${isOut ? '0.85' : '0.6'};color:${isOut ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)'};">
                ${time} &bull; ${isOut ? 'Delivered' : 'Received'}
              </div>
            </div>
          </div>
        `;
      }).join('');

      canvas.scrollTop = canvas.scrollHeight;
    } catch(e) { console.error('loadChatThread error:', e); }
  }

  async sendReply() {
    if (!this.selectedContact) return;
    const input   = document.getElementById('inbox-reply-input');
    const sendBtn = document.getElementById('inbox-send-reply-btn');
    const content = input?.value?.trim();
    if (!content) return;

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending…';
    }

    try {
      const r = await fetch('/api/chats/send', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          phone: this.selectedContact.phone,
          content,
          productId: this.selectedContact.productId
        })
      });
      const d = await r.json();
      if (d.success) {
        if (input) input.value = '';
        await this.loadChatThread(this.selectedContact.phone);
        await this.fetchContacts(false);
      } else {
        alert(d.error || 'Failed to dispatch message via WhatsApp');
      }
    } catch(e) {
      console.error(e);
      alert('Network error: ' + e.message);
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send`;
      }
      if (input) input.focus();
    }
  }
}
