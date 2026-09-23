export class AutoPilotEngine {
  constructor(app) {
    this.app = app;
    this.queue = [];
    this.currentIndex = 0;
    this.sentCount = 0;
    this.batchLimit = 25;
    this.pacingDelaySec = 20;
    this.isRunning = false;
    this.isPaused = false;
    this.waWindow = null;
    this.timer = null;
    this.countdownRemaining = 0;
    this.init();
  }

  init() {
    this.setupListeners();
    this.populateHelperCode();
  }

  setupListeners() {
    // Launch & Resume buttons in Composer & Topbar
    document.getElementById('launch-autopilot-btn')?.addEventListener('click', () => this.openModal(false));
    document.getElementById('resume-autopilot-btn')?.addEventListener('click', () => this.openModal(true));
    document.getElementById('topbar-autopilot-btn')?.addEventListener('click', () => this.openModal(true));
    document.getElementById('banner-autopilot-btn')?.addEventListener('click', () => this.openModal(true));

    // Modal close
    document.getElementById('close-autopilot-modal')?.addEventListener('click', () => this.closeModal());

    // Controls
    document.getElementById('ap-start-btn')?.addEventListener('click', () => {
      if (this.isPaused) this.resume();
      else this.start();
    });

    document.getElementById('ap-pause-btn')?.addEventListener('click', () => this.pause());
    document.getElementById('ap-skip-btn')?.addEventListener('click', () => this.skip());

    // Pacing & Batch selectors
    document.getElementById('ap-delay-select')?.addEventListener('change', (e) => {
      this.pacingDelaySec = parseInt(e.target.value, 10) || 20;
      const el = document.getElementById('ap-stat-delay');
      if (el) el.textContent = `${this.pacingDelaySec}s`;
    });

    document.getElementById('ap-batch-select')?.addEventListener('change', (e) => {
      this.batchLimit = parseInt(e.target.value, 10) || 25;
    });

    // Helper modal
    document.getElementById('ap-helper-btn')?.addEventListener('click', () => {
      document.getElementById('autopilot-helper-modal')?.classList.add('open');
    });
    document.getElementById('close-helper-modal')?.addEventListener('click', () => {
      document.getElementById('autopilot-helper-modal')?.classList.remove('open');
    });
    document.getElementById('copy-helper-script-btn')?.addEventListener('click', () => {
      const code = document.getElementById('ap-script-code')?.value;
      if (code) {
        navigator.clipboard.writeText(code);
        alert('1-Click Helper Script copied to clipboard! Paste it into Tampermonkey.');
      }
    });

    // Listen for postMessage from WhatsApp Web Helper
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'AUTOPILOT_MESSAGE_SENT') {
        this.log(`[WA Web] Message sent confirmation received from tab!`);
      }
    });

    // Call List modal in CRM
    const openCallList = async () => {
      const modal = document.getElementById('autopilot-calllist-modal');
      const tbody = document.getElementById('ap-calllist-tbody');
      if (modal) modal.classList.add('open');
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--t3);">Fetching call list...</td></tr>';
      try {
        const r = await fetch('/api/autopilot/call-list');
        const d = await r.json();
        const list = d.callList || [];
        const countEl = document.getElementById('ap-stat-calllist');
        const countEl2 = document.getElementById('sb-calllist-badge');
        const countEl3 = document.getElementById('audience-calllist-count');
        if (countEl) countEl.textContent = list.length;
        if (countEl2) countEl2.textContent = list.length;
        if (countEl3) countEl3.textContent = list.length;
        if (!list.length) {
          if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--t3);">No non-WhatsApp numbers detected yet! All processed leads are valid.</td></tr>';
        } else {
          if (tbody) {
            tbody.innerHTML = list.map((c, i) => `
              <tr style="border-bottom:1px solid var(--b1);">
                <td style="padding:8px 10px;color:var(--t3);">${i + 1}</td>
                <td style="padding:8px 10px;font-weight:700;color:var(--t1);">${c.name || 'Prospect'}</td>
                <td style="padding:8px 10px;">
                  <a href="tel:+${c.phone}" style="color:var(--green);font-family:monospace;font-weight:700;text-decoration:none;">
                    +${c.phone}
                  </a>
                </td>
                <td style="padding:8px 10px;color:var(--t2);">${c.category || 'Erode'}</td>
                <td style="padding:8px 10px;text-align:right;">
                  <button class="btn btn-ghost btn-xs" onclick="navigator.clipboard.writeText('+${c.phone}');alert('Copied +${c.phone}!')">Copy</button>
                </td>
              </tr>
            `).join('');
          }
        }
      } catch(err) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:#ef4444;">Error loading call list: ${err.message}</td></tr>`;
      }
    };

    document.getElementById('ap-stat-calllist-card')?.addEventListener('click', openCallList);
    document.getElementById('close-calllist-modal')?.addEventListener('click', () => {
      document.getElementById('autopilot-calllist-modal')?.classList.remove('open');
    });

    document.getElementById('ap-copy-all-calls-btn')?.addEventListener('click', async () => {
      try {
        const r = await fetch('/api/autopilot/call-list');
        const d = await r.json();
        const list = d.callList || [];
        if (!list.length) return alert('No numbers in call list.');
        const txt = list.map(c => `${c.name}: +${c.phone}`).join('\n');
        navigator.clipboard.writeText(txt);
        alert(`Copied ${list.length} phone numbers to clipboard!`);
      } catch(e) {
        alert('Could not copy call list.');
      }
    });

    document.getElementById('ap-export-calls-csv-btn')?.addEventListener('click', async () => {
      try {
        const r = await fetch('/api/autopilot/call-list');
        const d = await r.json();
        const list = d.callList || [];
        if (!list.length) return alert('No numbers to export.');
        const csv = 'Name,Phone,Category,Notes\n' + list.map(c => `"${c.name}","+${c.phone}","${c.category || ''}","${(c.notes || '').replace(/"/g, '""')}"`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Non_WhatsApp_Call_List_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
      } catch(e) {
        alert('Export failed.');
      }
    });
  }

  populateHelperCode() {
    const codeArea = document.getElementById('ap-script-code');
    if (!codeArea) return;
    codeArea.value = `// ==UserScript==
// @name         Aura CRM Single-Tab WhatsApp Auto-Pilot
// @namespace    http://tampermonkey.net/
// @version      4.5
// @description  Automates WhatsApp Web outreach in a SINGLE tab with instant invalid-number auto-skip, manual calling list, and 100% hands-free sending!
// @match        https://web.whatsapp.com/*
// @match        https://*.whatsapp.com/*
// @match        http://web.whatsapp.com/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      localhost
// @connect      127.0.0.1
// @connect      *
// ==/UserScript==

(function() {
  'use strict';
  console.log('[Aura Auto-Pilot v4.5] Human-Paced Single-Tab Engine Initializing...');

  let isSending = false;
  let countdownTimer = null;
  let preSendTimer = null;
  let isPreSendWaiting = false;
  let hud = null;
  let isMinimized = false;
  let currentLeadPhone = '';
  let chatLoadStartTime = 0;
  let hasSkippedCurrentLead = false;
  const sentPhonesInSession = new Set();

  // 1. API Helper supporting GM_xmlhttpRequest and fetch with localhost/127.0.0.1 fallbacks
  function apiCall(endpoint, method = 'GET', data = null) {
    return new Promise((resolve) => {
      const url127 = 'http://127.0.0.1:3000' + endpoint;
      const urlLocal = 'http://localhost:3000' + endpoint;

      function tryGMXhr(targetUrl, next) {
        if (typeof GM_xmlhttpRequest !== 'undefined') {
          try {
            GM_xmlhttpRequest({
              method: method,
              url: targetUrl,
              headers: { 'Content-Type': 'application/json' },
              data: data ? JSON.stringify(data) : null,
              timeout: 3000,
              onload: function(r) {
                try { resolve(JSON.parse(r.responseText)); } catch(_) { next(); }
              },
              onerror: next,
              ontimeout: next
            });
            return;
          } catch(e) { next(); return; }
        }
        next();
      }

      function tryFetch(targetUrl, next) {
        fetch(targetUrl, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: data ? JSON.stringify(data) : null
        })
        .then(r => r.json())
        .then(resolve)
        .catch(next);
      }

      tryGMXhr(url127, () => {
        tryGMXhr(urlLocal, () => {
          tryFetch(url127, () => {
            tryFetch(urlLocal, () => {
              resolve(null);
            });
          });
        });
      });
    });
  }

  // 2. Capture incoming queue payload from URL hash if launched from CRM
  if (window.location.hash.includes('ap_queue=')) {
    try {
      const raw = decodeURIComponent(window.location.hash.split('ap_queue=')[1]);
      const payload = JSON.parse(raw);
      if (payload && Array.isArray(payload.leads) && payload.leads.length > 0) {
        sessionStorage.setItem('aura_ap_leads', JSON.stringify(payload.leads));
        sessionStorage.setItem('aura_ap_index', '0');
        sessionStorage.setItem('aura_ap_delay', String(payload.delay || 20));
        sessionStorage.setItem('aura_ap_active', '1');
        sessionStorage.setItem('aura_ap_paused', '0');
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch (e) {
      console.warn('[Auto-Pilot] Payload hash parse error:', e);
    }
  }

  function getLeads() {
    try { return JSON.parse(sessionStorage.getItem('aura_ap_leads') || '[]'); } catch(_) { return []; }
  }
  function getIndex() {
    return parseInt(sessionStorage.getItem('aura_ap_index') || '0', 10);
  }
  function isActive() {
    return sessionStorage.getItem('aura_ap_active') === '1';
  }
  function isPaused() {
    return sessionStorage.getItem('aura_ap_paused') === '1';
  }
  function getCallList() {
    try { return JSON.parse(sessionStorage.getItem('aura_call_list') || '[]'); } catch(_) { return []; }
  }

  // Natural human jitter: randomly fluctuates per lead (e.g. 18s, 27s, 21s, 25s, 19s)
  function getDelay() {
    const base = parseInt(sessionStorage.getItem('aura_ap_delay') || '20', 10);
    const jitter = Math.floor(Math.random() * 11) - 3; // -3s to +7s random variation
    return Math.max(18, base + jitter);
  }

  // Floating HUD (Head-Up Display) positioned in TOP-RIGHT - GUARANTEED VISIBILITY
  function renderHud() {
    if (!document.body) return null;
    let el = document.getElementById('aura-hud');
    if (!el) {
      el = document.createElement('div');
      el.id = 'aura-hud';
      el.style.cssText = 'position:fixed !important;top:15px !important;right:20px !important;z-index:999999999 !important;background:#111b21 !important;color:#e9edef !important;border:1.5px solid #00a884 !important;border-radius:12px !important;padding:12px 16px !important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif !important;font-size:13px !important;box-shadow:0 10px 35px rgba(0,0,0,0.85),0 0 15px rgba(0,168,132,0.2) !important;display:block !important;min-width:330px !important;max-width:390px !important;line-height:1.4 !important;transition:all 0.2s ease !important;pointer-events:auto !important;visibility:visible !important;opacity:1 !important;';
      document.body.appendChild(el);
    } else if (!document.body.contains(el)) {
      document.body.appendChild(el);
    }
    hud = el;
    return el;
  }

  function updateHud(title, subtitle, badge) {
    const el = renderHud();
    if (!el) return;
    badge = badge || (isPaused() ? 'Paused' : (isActive() ? 'Auto-Pilot Active' : 'Standby'));
    el.style.display = 'block';

    const callList = getCallList();
    const callCount = callList.length;

    if (isMinimized) {
      el.innerHTML = '<div style="display:flex;align-items:center;gap:8px;cursor:pointer;" id="aura-hud-expand">' +
        '<strong style="color:#00a884;font-size:12.5px;">Auto-Pilot</strong>' +
        '<span style="background:rgba(0,168,132,0.2);color:#00a884;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:8px;">' + badge + '</span>' +
        '<button style="background:none;border:none;color:#8696a0;cursor:pointer;font-size:14px;padding:0;">+</button>' +
        '</div>';
      document.getElementById('aura-hud-expand')?.addEventListener('click', () => {
        isMinimized = false;
        updateHud(title, subtitle, badge);
      });
      return;
    }

    let actionButtons = '';
    if (isActive()) {
      actionButtons = 
        '<button id="aura-hud-pause" style="background:#202c33;color:#e9edef;border:1px solid #00a884;border-radius:6px;padding:4px 9px;font-size:11px;cursor:pointer;font-weight:600;">' + (isPaused() ? 'Resume' : 'Pause') + '</button>' +
        '<button id="aura-hud-send" style="background:#202c33;color:#00a884;border:1px solid #00a884;border-radius:6px;padding:4px 9px;font-size:11px;cursor:pointer;font-weight:600;" title="Outreach is 100% automated. Click only if you want to skip the human pause.">Send Now</button>' +
        '<button id="aura-hud-skip" style="background:#202c33;color:#e9edef;border:1px solid #536471;border-radius:6px;padding:4px 9px;font-size:11px;cursor:pointer;">Skip</button>' +
        (callCount > 0 ? '<button id="aura-hud-calllist" style="background:rgba(234,67,53,0.18);color:#fca5a5;border:1px solid rgba(234,67,53,0.5);border-radius:6px;padding:4px 9px;font-size:11px;cursor:pointer;font-weight:700;">Call List (' + callCount + ')</button>' : '') +
        '<button id="aura-hud-stop" style="background:#202c33;color:#ea4335;border:1px solid #ea4335;border-radius:6px;padding:4px 9px;font-size:11px;cursor:pointer;">Stop</button>';
    } else {
      actionButtons = 
        '<button id="aura-hud-start-btn" style="background:#00a884;color:#111b21;font-weight:700;border:none;border-radius:6px;padding:5px 12px;font-size:11px;cursor:pointer;">Launch Campaign</button>' +
        (callCount > 0 ? '<button id="aura-hud-calllist" style="background:rgba(234,67,53,0.18);color:#fca5a5;border:1px solid rgba(234,67,53,0.5);border-radius:6px;padding:5px 9px;font-size:11px;cursor:pointer;font-weight:700;">Call List (' + callCount + ')</button>' : '') +
        '<button id="aura-hud-refresh-btn" style="background:#202c33;color:#e9edef;border:1px solid #536471;border-radius:6px;padding:5px 9px;font-size:11px;cursor:pointer;">Sync Server</button>';
    }

    el.innerHTML = 
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<strong style="color:#00a884;font-size:13.5px;display:flex;align-items:center;gap:5px;">CRM Auto-Pilot (v4.5)</strong>' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="background:rgba(0,168,132,0.2);color:#00a884;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:10px;">' + badge + '</span>' +
          '<button id="aura-hud-min" title="Minimize" style="background:none;border:none;color:#8696a0;cursor:pointer;font-size:12px;padding:0 3px;">-</button>' +
        '</div>' +
      '</div>' +
      '<div style="font-weight:700;color:#fff;font-size:13px;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + title + '</div>' +
      '<div style="font-size:11.5px;color:#8696a0;margin-bottom:9px;">' + subtitle + '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' +
        actionButtons +
      '</div>';

    document.getElementById('aura-hud-min')?.addEventListener('click', (e) => {
      e.stopPropagation();
      isMinimized = true;
      updateHud(title, subtitle, badge);
    });

    document.getElementById('aura-hud-calllist')?.addEventListener('click', showCallListModal);

    document.getElementById('aura-hud-pause')?.addEventListener('click', async () => {
      const willPause = !isPaused();
      sessionStorage.setItem('aura_ap_paused', willPause ? '1' : '0');
      apiCall('/api/autopilot/pause', 'POST', { paused: willPause });
      if (willPause) {
        if (countdownTimer) clearInterval(countdownTimer);
        if (preSendTimer) clearTimeout(preSendTimer);
        isSending = false;
        isPreSendWaiting = false;
      }
      const leads = getLeads();
      const idx = getIndex();
      updateHud(leads[idx]?.name || 'Auto-Pilot', willPause ? 'Paused. Click Resume to continue.' : 'Resumed...', willPause ? 'Paused' : 'Auto-Pilot Active');
    });

    document.getElementById('aura-hud-send')?.addEventListener('click', () => {
      isSending = false;
      isPreSendWaiting = false;
      if (preSendTimer) clearTimeout(preSendTimer);
      executeSend();
    });

    document.getElementById('aura-hud-skip')?.addEventListener('click', () => {
      if (countdownTimer) clearInterval(countdownTimer);
      if (preSendTimer) clearTimeout(preSendTimer);
      isSending = false;
      isPreSendWaiting = false;
      hasSkippedCurrentLead = true;
      const leads = getLeads();
      const idx = getIndex();
      const lead = leads[idx] || {};
      apiCall('/api/autopilot/mark-sent', 'POST', {
        contactId: lead.id,
        phone: lead.phone,
        messageContent: '[Skipped by User]',
        index: idx + 1
      });
      dismissOkButton();
      triggerArchive();
      setTimeout(advanceLead, 400);
    });

    document.getElementById('aura-hud-stop')?.addEventListener('click', () => {
      sessionStorage.setItem('aura_ap_active', '0');
      if (countdownTimer) clearInterval(countdownTimer);
      if (preSendTimer) clearTimeout(preSendTimer);
      isSending = false;
      isPreSendWaiting = false;
      apiCall('/api/autopilot/stop', 'POST');
      updateHud('Campaign Stopped', 'Stopped. Ready to launch again.', 'Stopped');
    });

    document.getElementById('aura-hud-start-btn')?.addEventListener('click', async () => {
      updateHud('Launching Campaign...', 'Requesting 119 Erode leads from CRM...', 'Starting');
      const res = await apiCall('/api/autopilot/start', 'POST', { category: 'Erode', pacingDelaySec: 20 });
      if (res && res.queue && res.queue.length > 0) {
        sessionStorage.setItem('aura_ap_leads', JSON.stringify(res.queue));
        sessionStorage.setItem('aura_ap_index', '0');
        sessionStorage.setItem('aura_ap_delay', String(res.pacingDelaySec || 20));
        sessionStorage.setItem('aura_ap_active', '1');
        sessionStorage.setItem('aura_ap_paused', '0');
        const firstLead = res.queue[0];
        const cleanPhone = String(firstLead.phone || '').replace(/[^0-9]/g, '');
        sessionStorage.setItem('aura_opened_phone', cleanPhone);
        window.location.href = 'https://web.whatsapp.com/send?phone=' + cleanPhone + '&text=' + encodeURIComponent(firstLead.message) + '&autopilot=1';
      } else {
        alert('Could not start campaign from CRM. Please make sure CRM software is running at http://localhost:3000');
      }
    });

    document.getElementById('aura-hud-refresh-btn')?.addEventListener('click', () => {
      syncServerState(true);
    });
  }

  // POPUP MODAL: NON-WHATSAPP MANUAL CALLING LIST IN WHATSAPP WEB
  async function showCallListModal() {
    let modal = document.getElementById('aura-call-list-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'aura-call-list-modal';
      modal.style.cssText = 'position:fixed !important;top:0 !important;left:0 !important;right:0 !important;bottom:0 !important;background:rgba(0,0,0,0.85) !important;z-index:9999999999 !important;display:flex !important;align-items:center !important;justify-content:center !important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif !important;padding:20px !important;';
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';

    // Fetch call list from server
    let list = [];
    try {
      const res = await apiCall('/api/autopilot/call-list');
      if (res && Array.isArray(res.callList)) list = res.callList;
    } catch(_) {}
    if (!list.length) list = getCallList();

    let rowsHtml = '';
    if (!list.length) {
      rowsHtml = '<tr><td colspan="5" style="text-align:center;padding:28px;color:#8696a0;">No non-WhatsApp numbers detected yet! All processed leads are valid.</td></tr>';
    } else {
      rowsHtml = list.map((c, i) =>
        '<tr style="border-bottom:1px solid #202c33;">' +
          '<td style="padding:10px 8px;color:#8696a0;">' + (i + 1) + '</td>' +
          '<td style="padding:10px 8px;font-weight:700;color:#e9edef;">' + (c.name || 'Prospect') + '</td>' +
          '<td style="padding:10px 8px;">' +
            '<a href="tel:+' + c.phone + '" style="color:#00a884;font-weight:700;text-decoration:none;font-family:monospace;font-size:13px;" title="Click to call via dialer">' +
              '+' + c.phone +
            '</a>' +
          '</td>' +
          '<td style="padding:10px 8px;color:#8696a0;font-size:12px;">' + (c.category || 'Erode') + '</td>' +
          '<td style="padding:10px 8px;text-align:right;">' +
            '<button class="aura-call-copy-btn" data-phone="+' + c.phone + '" style="background:#202c33;color:#e9edef;border:1px solid #536471;border-radius:4px;padding:3px 8px;font-size:11px;cursor:pointer;">Copy</button>' +
          '</td>' +
        '</tr>'
      ).join('');
    }

    modal.innerHTML = 
      '<div style="background:#111b21;border:1px solid #00a884;border-radius:14px;max-width:650px;width:100%;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,0.9);overflow:hidden;">' +
        '<div style="padding:16px 20px;border-bottom:1px solid #202c33;display:flex;align-items:center;justify-content:space-between;">' +
          '<div>' +
            '<div style="font-size:16px;font-weight:800;color:#e9edef;display:flex;align-items:center;gap:8px;">' +
              '<span style="font-weight:700;">[Call List]</span> Non-WhatsApp Manual Calling List (' + list.length + ')' +
            '</div>' +
            '<div style="font-size:12px;color:#8696a0;margin-top:2px;">' +
              'These prospects are not on WhatsApp — click to call or copy numbers directly:' +
            '</div>' +
          '</div>' +
          '<button id="aura-close-call-modal" style="background:none;border:none;color:#8696a0;font-size:22px;cursor:pointer;line-height:1;">&times;</button>' +
        '</div>' +
        '<div style="padding:12px 20px;overflow-y:auto;flex:1;">' +
          '<table style="width:100%;border-collapse:collapse;font-size:12.5px;text-align:left;">' +
            '<thead>' +
              '<tr style="border-bottom:1px solid #3b4a54;color:#8696a0;font-size:11px;text-transform:uppercase;">' +
                '<th style="padding:6px 8px;">#</th>' +
                '<th style="padding:6px 8px;">Gym / Prospect</th>' +
                '<th style="padding:6px 8px;">Phone Number</th>' +
                '<th style="padding:6px 8px;">Location</th>' +
                '<th style="padding:6px 8px;text-align:right;">Action</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + rowsHtml + '</tbody>' +
          '</table>' +
        '</div>' +
        '<div style="padding:14px 20px;border-top:1px solid #202c33;display:flex;align-items:center;justify-content:space-between;background:#0c1317;flex-wrap:wrap;gap:8px;">' +
          '<div style="display:flex;gap:8px;">' +
            '<button id="aura-copy-call-list" style="background:#00a884;color:#111b21;font-weight:700;border:none;border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer;">' +
              'Copy All Numbers' +
            '</button>' +
            '<button id="aura-export-call-list" style="background:#202c33;color:#00a884;border:1px solid #00a884;border-radius:8px;padding:8px 14px;font-size:12px;cursor:pointer;font-weight:600;">' +
              'Export CSV' +
            '</button>' +
          '</div>' +
          '<button id="aura-close-call-modal-btn" style="background:#202c33;color:#e9edef;border:1px solid #536471;border-radius:8px;padding:8px 16px;font-size:12px;cursor:pointer;">' +
            'Close' +
          '</button>' +
        '</div>' +
      '</div>';

    document.getElementById('aura-close-call-modal')?.addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('aura-close-call-modal-btn')?.addEventListener('click', () => modal.style.display = 'none');
    
    document.getElementById('aura-copy-call-list')?.addEventListener('click', () => {
      const text = list.map(c => (c.name || 'Lead') + ': +' + c.phone).join('\n');
      navigator.clipboard.writeText(text);
      alert('Copied ' + list.length + ' phone numbers to clipboard! You can paste them into your phone or spreadsheet.');
    });

    document.getElementById('aura-export-call-list')?.addEventListener('click', () => {
      if (!list.length) return alert('No numbers to export.');
      const csv = 'Name,Phone,Category,Notes\n' + list.map(c => '"' + (c.name || '').replace(/"/g, '""') + '","+' + c.phone + '","' + (c.category || '') + '","' + (c.notes || '').replace(/"/g, '""') + '"').join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Non_WhatsApp_Call_List_' + new Date().toISOString().slice(0,10) + '.csv';
      a.click();
    });

    modal.querySelectorAll('.aura-call-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const phone = btn.getAttribute('data-phone');
        navigator.clipboard.writeText(phone);
        const originalText = btn.innerText;
        btn.innerText = 'Copied!';
        setTimeout(() => { btn.innerText = originalText; }, 1200);
      });
    });
  }

  // 1. IMMEDIATE INVALID / NON-WHATSAPP NUMBER DETECTOR & AUTO-DISMISS
  function dismissOkButton() {
    const allElements = Array.from(document.querySelectorAll('button, div[role="button"], [role="button"], span, div'));
    for (const el of allElements) {
      if (el.closest('#aura-hud') || el.closest('#aura-call-list-modal')) continue;
      const txt = (el.innerText || el.textContent || '').trim().toUpperCase();
      if (txt === 'OK' || txt === 'OKAY') {
        console.log('[Auto-Pilot] Found OK button! Dismissing invalid dialog...', el);
        try {
          el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        } catch(_) {}
        el.click();
        break;
      }
    }
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true }));
    } catch(_) {}
  }

  function detectAndDismissInvalidNumber(lead, cleanPhone, index) {
    if (hasSkippedCurrentLead) return false;

    const fullText = (document.body?.innerText || '').replace(/[\u2018\u2019]/g, "'").toLowerCase();

    const isInvalid = 
      fullText.includes("isn't on whatsapp") ||
      fullText.includes("is not on whatsapp") ||
      fullText.includes("not on whatsapp") ||
      fullText.includes("phone number shared via url is invalid") ||
      fullText.includes("url is invalid") ||
      fullText.includes("couldn't find") ||
      fullText.includes("not found");

    if (!isInvalid || fullText.includes('starting chat') || fullText.includes('loading chat')) {
      return false;
    }

    hasSkippedCurrentLead = true;
    console.warn('[Auto-Pilot] Non-WhatsApp number detected for ' + cleanPhone + '! Auto-skipping...');

    // 1. Record to Call List in sessionStorage
    let callList = getCallList();
    if (!callList.some(c => c.phone === cleanPhone)) {
      callList.push({
        id: lead?.id,
        name: lead?.name || cleanPhone,
        phone: cleanPhone,
        category: lead?.category || 'Erode',
        reason: 'Not registered on WhatsApp'
      });
      sessionStorage.setItem('aura_call_list', JSON.stringify(callList));
    }

    // 2. Click the OK button on the dialog immediately
    dismissOkButton();

    // 3. Update HUD with Call List alert
    updateHud(
      'Skipping: ' + (lead?.name || cleanPhone),
      'Not on WhatsApp! Added to Call List (' + callList.length + ' leads). Moving to next lead...',
      'Not on WhatsApp'
    );

    // 4. Report to server so DB records it with status INVALID_NUMBER
    apiCall('/api/autopilot/mark-sent', 'POST', {
      contactId: lead?.id,
      name: lead?.name,
      phone: cleanPhone,
      reason: 'NOT_ON_WHATSAPP',
      messageContent: '[Skipped: Number Not on WhatsApp - Add to Call List]',
      index: index + 1
    });

    // 5. Advance to next lead smoothly
    setTimeout(advanceLead, 800);
    return true;
  }

  // REAL-TIME 2-WAY SYNCHRONIZATION WITH CRM SOFTWARE
  let lastServerSyncTime = 0;
  async function syncServerState(force = false) {
    const now = Date.now();
    if (!force && now - lastServerSyncTime < 1200) return;
    lastServerSyncTime = now;

    try {
      const state = await apiCall('/api/autopilot/state');
      if (!state) {
        if (!isActive()) {
          updateHud('CRM Not Connected', 'Waiting for http://localhost:3000...', 'Offline');
        }
        return;
      }

      if (state.callList && Array.isArray(state.callList)) {
        sessionStorage.setItem('aura_call_list', JSON.stringify(state.callList));
      }

      const localLeads = getLeads();
      const needsHydration = (!localLeads.length || !isActive() || (state.active && localLeads.length !== state.queue?.length));

      if (needsHydration && state.active && Array.isArray(state.queue) && state.queue.length > 0) {
        sessionStorage.setItem('aura_ap_leads', JSON.stringify(state.queue));
        sessionStorage.setItem('aura_ap_index', String(state.currentIndex || 0));
        sessionStorage.setItem('aura_ap_delay', String(state.pacingDelaySec || 20));
        sessionStorage.setItem('aura_ap_active', '1');
        sessionStorage.setItem('aura_ap_paused', state.isPaused ? '1' : '0');
        
        const lead = state.queue[state.currentIndex || 0];
        updateHud(lead?.name || 'Auto-Pilot', 'Lead ' + ((state.currentIndex || 0) + 1) + ' of ' + state.queue.length, 'Auto-Pilot Active');

        if (!window.location.search.includes('phone=')) {
          const cleanPhone = String(lead.phone || '').replace(/[^0-9]/g, '');
          sessionStorage.setItem('aura_opened_phone', cleanPhone);
          window.location.href = 'https://web.whatsapp.com/send?phone=' + cleanPhone + '&text=' + encodeURIComponent(lead.message) + '&autopilot=1';
        }
        return;
      }

      if (!state.active && !isActive()) {
        const localIdx = getIndex();
        if (localLeads.length > 0 && localIdx < localLeads.length) {
          updateHud('Auto-Pilot Standby', localLeads.length + ' leads queued. Click Launch Campaign to begin.', 'Standby');
        } else {
          updateHud('Auto-Pilot Standby', 'Connected to CRM. Start campaign from CRM or click Launch.', 'Standby');
        }
        return;
      }

      if (!state.active && isActive()) {
        sessionStorage.setItem('aura_ap_active', '0');
        if (countdownTimer) clearInterval(countdownTimer);
        if (preSendTimer) clearTimeout(preSendTimer);
        isSending = false;
        isPreSendWaiting = false;
        updateHud('Campaign Stopped', 'Stopped from CRM dashboard.', 'Stopped');
        return;
      }

      if (state.isPaused && !isPaused() && isActive()) {
        sessionStorage.setItem('aura_ap_paused', '1');
        if (countdownTimer) clearInterval(countdownTimer);
        if (preSendTimer) clearTimeout(preSendTimer);
        isSending = false;
        isPreSendWaiting = false;
        const leads = getLeads();
        const idx = getIndex();
        updateHud(leads[idx]?.name || 'Auto-Pilot', 'Campaign is paused in CRM. Click Resume to continue.', 'Paused');
        return;
      }

      if (!state.isPaused && isPaused() && isActive()) {
        sessionStorage.setItem('aura_ap_paused', '0');
        const leads = getLeads();
        const idx = getIndex();
        updateHud(leads[idx]?.name || 'Auto-Pilot', 'Campaign resumed from CRM. Continuing...', 'Auto-Pilot Active');
        return;
      }

      if (state.pacingDelaySec) {
        sessionStorage.setItem('aura_ap_delay', String(state.pacingDelaySec));
      }
    } catch (_) {}
  }

  function triggerArchive() {
    try {
      const target = document.querySelector('#main') || document.activeElement || document.body;
      ['keydown', 'keyup'].forEach(eventType => {
        const evt = new KeyboardEvent(eventType, {
          key: 'E', code: 'KeyE', keyCode: 69, which: 69,
          ctrlKey: true, altKey: true, shiftKey: true,
          bubbles: true, cancelable: true, composed: true
        });
        target.dispatchEvent(evt);
      });
      console.log('[Auto-Pilot] Chat Auto-Archived via Ctrl+Alt+Shift+E!');
    } catch (e) {
      console.warn('[Auto-Pilot] Archive error:', e);
    }
  }

  function getInput() {
    const mainInput = document.querySelector('#main div[contenteditable="true"], #main [contenteditable="true"]');
    if (mainInput) return mainInput;
    const testId = document.querySelector('div[data-testid="conversation-compose-box-input"], div[data-tab="10"], div[role="textbox"]');
    if (testId) return testId;
    const editables = Array.from(document.querySelectorAll('#main div[contenteditable="true"]'));
    return editables[editables.length - 1] || null;
  }

  function findSendButton() {
    const selectors = [
      '#main span[data-icon="send"]',
      '#main span[data-icon="wds-ic-send-filled"]',
      '#main span[data-icon*="send"]',
      'span[data-icon="send"]',
      'span[data-icon="wds-ic-send-filled"]',
      '#main [data-testid="send"]',
      '#main [data-testid="compose-btn-send"]',
      '#main button[aria-label*="Send" i]',
      'button[aria-label*="Send" i]',
      '#main button[data-tab="11"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && !el.closest('#aura-hud') && !el.closest('#aura-call-list-modal')) {
        return el.tagName === 'BUTTON' ? el : (el.closest('button') || el);
      }
    }
    const footer = document.querySelector('footer, #main footer');
    if (footer) {
      const btns = Array.from(footer.querySelectorAll('button')).filter(b => !b.closest('#aura-hud') && !b.closest('#aura-call-list-modal'));
      if (btns.length > 0) return btns[btns.length - 1];
    }
    return null;
  }

  function isWhatsAppReady() {
    return Boolean(
      document.querySelector('#side') ||
      document.querySelector('#main') ||
      document.querySelector('[data-testid="chat-list"]') ||
      document.querySelector('div[contenteditable="true"]')
    );
  }

  function triggerInputEnter(input) {
    if (!input) return;
    try {
      input.focus?.();
      const opts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true, composed: true };
      input.dispatchEvent(new KeyboardEvent('keydown', opts));
      input.dispatchEvent(new KeyboardEvent('keypress', opts));
      input.dispatchEvent(new KeyboardEvent('keyup', opts));
    } catch(_) {}
  }

  function startPacingCountdown(lead, cleanPhone) {
    let sentStreak = parseInt(sessionStorage.getItem('aura_ap_streak') || '0', 10);
    sentStreak++;
    sessionStorage.setItem('aura_ap_streak', String(sentStreak));

    let delaySec = getDelay();
    let isMicroBreak = false;

    if (sentStreak > 0 && sentStreak % 10 === 0) {
      delaySec = Math.floor(Math.random() * 11) + 45;
      isMicroBreak = true;
    }

    let countdown = delaySec;
    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      if (isPaused()) return;
      countdown--;

      if (isMicroBreak) {
        updateHud(
          'Sent: ' + (lead.name || cleanPhone) + '',
          'Natural break (' + countdown + 's remaining)... Anti-ban safety active',
          'Micro-Break'
        );
      } else {
        updateHud(
          'Sent: ' + (lead.name || cleanPhone) + '',
          'Resting for ' + countdown + 's (Randomized human anti-ban delay)... Hands-Free',
          'Paced Delay'
        );
      }

      if (countdown <= 0) {
        clearInterval(countdownTimer);
        advanceLead();
      }
    }, 1000);
  }

  // 100% HANDS-FREE AUTOMATIC SEND
  function executeSend() {
    const leads = getLeads();
    const index = getIndex();
    const lead = leads[index] || {};
    const cleanPhone = String(lead.phone || '').replace(/[^0-9]/g, '');

    if (isSending || sentPhonesInSession.has(cleanPhone)) {
      return;
    }
    isSending = true;
    sentPhonesInSession.add(cleanPhone);

    updateHud('Sending: ' + (lead.name || cleanPhone), 'Dispatching message now...', 'Sending');

    const sendBtn = findSendButton();
    if (sendBtn) {
      try {
        sendBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        sendBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      } catch(_) {}
      sendBtn.click();
      console.log('[Auto-Pilot] Dispatched message via Send button to ' + cleanPhone);
    } else {
      const input = getInput();
      if (input) {
        triggerInputEnter(input);
        console.log('[Auto-Pilot] Dispatched message via Enter key to ' + cleanPhone);
      }
    }

    try {
      apiCall('/api/autopilot/mark-sent', 'POST', {
        contactId: lead.id,
        phone: cleanPhone,
        messageContent: lead.message,
        index: index + 1
      });
      if (lead.id) {
        apiCall('/api/contacts/' + lead.id + '/autopilot-sent', 'POST', {
          messageContent: lead.message
        });
      }
    } catch(_) {}

    const archiveDelayMs = Math.floor(Math.random() * 800) + 1600;
    setTimeout(() => {
      triggerArchive();
      startPacingCountdown(lead, cleanPhone);
    }, archiveDelayMs);
  }

  function advanceLead() {
    clearInterval(countdownTimer);
    if (preSendTimer) clearTimeout(preSendTimer);
    isSending = false;
    isPreSendWaiting = false;
    hasSkippedCurrentLead = false;

    const leads = getLeads();
    let index = getIndex() + 1;
    sessionStorage.setItem('aura_ap_index', String(index));

    if (index >= leads.length) {
      sessionStorage.setItem('aura_ap_active', '0');
      sessionStorage.removeItem('aura_opened_phone');
      updateHud('Campaign Complete!', 'All ' + leads.length + ' leads processed safely!', 'Done');
      alert('Auto-Pilot Finished!\n\nAll ' + leads.length + ' contacts processed safely.\n\nNow displaying the Manual Calling List for non-WhatsApp numbers so you can call and reach them directly.');
      showCallListModal();
      return;
    }

    const nextLead = leads[index];
    const cleanPhone = String(nextLead.phone).replace(/[^0-9]/g, '');
    sessionStorage.setItem('aura_opened_phone', cleanPhone);
    currentLeadPhone = cleanPhone;
    chatLoadStartTime = Date.now();
    updateHud('Loading ' + (nextLead.name || cleanPhone), 'Lead ' + (index + 1) + ' of ' + leads.length + ' (Hands-Free)...', 'Loading');
    const nextUrl = 'https://web.whatsapp.com/send?phone=' + cleanPhone + '&text=' + encodeURIComponent(nextLead.message) + '&autopilot=1';
    window.location.href = nextUrl;
  }

  async function checkLoop() {
    if (!isActive() || getLeads().length === 0) {
      await syncServerState();
    }

    if (!isActive() || isPaused() || isSending) {
      if (isPaused() && isActive()) {
        const leads = getLeads();
        const index = getIndex();
        updateHud(leads[index]?.name || 'Auto-Pilot', 'Campaign is paused. Click Resume to continue.', 'Paused');
      }
      return;
    }

    const leads = getLeads();
    const index = getIndex();
    if (!leads.length || index >= leads.length) {
      return;
    }

    const lead = leads[index];
    const cleanPhone = String(lead.phone || '').replace(/[^0-9]/g, '');

    // 1. FIRST PRIORITY: Instant Invalid / Non-WhatsApp Number Check
    if (detectAndDismissInvalidNumber(lead, cleanPhone, index)) {
      return;
    }

    if (!isWhatsAppReady()) {
      return;
    }

    if (currentLeadPhone !== cleanPhone) {
      currentLeadPhone = cleanPhone;
      chatLoadStartTime = Date.now();
      isPreSendWaiting = false;
      hasSkippedCurrentLead = false;
      if (preSendTimer) clearTimeout(preSendTimer);
    }

    if (hasSkippedCurrentLead) return;

    // Check URL navigation
    const openedPhone = sessionStorage.getItem('aura_opened_phone') || '';
    if (openedPhone !== cleanPhone) {
      sessionStorage.setItem('aura_opened_phone', cleanPhone);
      chatLoadStartTime = Date.now();
      updateHud('Opening ' + (lead.name || cleanPhone), 'Lead ' + (index + 1) + ' of ' + leads.length + '...', 'Loading');
      const targetUrl = 'https://web.whatsapp.com/send?phone=' + cleanPhone + '&text=' + encodeURIComponent(lead.message) + '&autopilot=1';
      window.location.href = targetUrl;
      return;
    }

    // 2. DEDUPLICATION GUARD: Check if contact ALREADY has previous message history in chat
    const existingOutbound = document.querySelectorAll('#main .message-out');
    if (existingOutbound.length > 0 && !sentPhonesInSession.has(cleanPhone)) {
      hasSkippedCurrentLead = true;
      isSending = true;
      updateHud('Skipping: ' + (lead.name || cleanPhone), 'Already messaged previously ', 'Skipped');

      const input = getInput();
      if (input) {
        try {
          input.focus();
          document.execCommand('selectAll', false, null);
          document.execCommand('delete', false, null);
        } catch(_) {
          input.innerText = '';
        }
      }

      setTimeout(() => {
        triggerArchive();
        try {
          apiCall('/api/autopilot/mark-sent', 'POST', {
            contactId: lead.id,
            phone: cleanPhone,
            messageContent: '[Already Messaged Previously - Auto-Skipped]',
            index: index + 1
          });
        } catch(_) {}
        setTimeout(advanceLead, 1200);
      }, 800);
      return;
    }

    // 3. WATCHDOG: Chat Load Timeout (8 seconds)
    const waitElapsedMs = Date.now() - chatLoadStartTime;
    const mainChatExists = Boolean(document.querySelector('#main'));
    const input = getInput();
    const sendBtn = findSendButton();

    if (!mainChatExists && !input && !sendBtn && waitElapsedMs > 8000 && !hasSkippedCurrentLead) {
      detectAndDismissInvalidNumber(lead, cleanPhone, index);
      return;
    }

    // 4. HUMAN-LIKE AUTOMATIC SEND (Hands-Free verification)
    const text = (input?.innerText || input?.textContent || '').trim();
    if ((sendBtn || (input && text.length > 0)) && !sentPhonesInSession.has(cleanPhone)) {
      if (!isPreSendWaiting) {
        isPreSendWaiting = true;
        const humanCheckSec = (Math.random() * 1.2 + 2.2).toFixed(1);
        updateHud(lead.name || cleanPhone, 'Auto-Sending in ' + humanCheckSec + 's (Hands-Free)...', 'Auto-Sending');
        preSendTimer = setTimeout(() => {
          if (!isPaused() && isActive() && !sentPhonesInSession.has(cleanPhone)) {
            executeSend();
          }
        }, parseFloat(humanCheckSec) * 1000);
        return;
      }
    } else {
      const elapsed = Math.round(waitElapsedMs / 1000);
      updateHud(lead.name || cleanPhone, 'Waiting for chat to load (' + elapsed + 's)...', 'Initializing');
    }
  }

  //  Reliable Primary Heartbeat Loop (1.2s Interval - 100% immune to CSP restrictions)
  setInterval(async () => {
    try {
      renderHud();
      await syncServerState();
      await checkLoop();
    } catch (e) {
      console.warn('[Auto-Pilot] Loop tick error:', e);
    }
  }, 1200);

  // Real-Time MutationObserver: Detects invalid/non-WhatsApp dialog the millisecond it enters DOM!
  try {
    const observer = new MutationObserver(() => {
      renderHud();
      if (isActive() && !isPaused() && !isSending && !hasSkippedCurrentLead) {
        const leads = getLeads();
        const index = getIndex();
        if (leads.length && index < leads.length) {
          const lead = leads[index];
          const cleanPhone = String(lead.phone || '').replace(/[^0-9]/g, '');
          detectAndDismissInvalidNumber(lead, cleanPhone, index);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch(_) {}

  // Initial HUD rendering & sync check
  function initHud() {
    renderHud();
    const leads = getLeads();
    const idx = getIndex();
    if (isActive() && leads.length > 0) {
      updateHud(leads[idx]?.name || 'Auto-Pilot', 'Lead ' + (idx + 1) + ' of ' + leads.length + ' (Hands-Free)', 'Auto-Pilot Active');
    } else {
      updateHud('Auto-Pilot Standby', 'Connecting to CRM (localhost:3000)...', 'Connecting');
    }
    syncServerState(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHud);
  } else {
    initHud();
  }
  setTimeout(initHud, 300);
  setTimeout(initHud, 800);
  setTimeout(initHud, 2000);
  setTimeout(initHud, 4000);
})();`;
  }

  async openModal(forceResume = false) {
    console.log('[AutoPilot] openModal triggered! forceResume:', forceResume);
    const composer = this.app?.composer;

    // 1. Gather contacts
    let contacts = composer?.allProjectContacts || [];
    if (!contacts.length) {
      try {
        const prodId = this.app?.activeProject?.id || 'prod_1';
        const r = await fetch(`/api/contacts?product=${prodId}`);
        const d = await r.json();
        if (d.success && d.contacts) {
          contacts = d.contacts;
          if (composer) composer.allProjectContacts = contacts;
        }
      } catch (err) {
        console.warn('[AutoPilot] Could not pre-fetch contacts:', err);
      }
    }

    // Strict filter: EXCLUDE any contact who has already been messaged, replied, skipped, or invalid
    const excludedStatuses = ['SENT', 'REPLIED', 'INTERESTED', 'PRICING', 'BLACKLISTED', 'INVALID_NUMBER', 'SKIPPED'];
    const isUnsentLead = (c) => {
      if (!c) return false;
      if (excludedStatuses.includes(c.status)) return false;
      if (c.outboundCount && c.outboundCount > 0) return false;
      if (c.lastMessageAt) return false;
      return true;
    };

    const selectedIds = composer?.selectedContactIds || new Set();
    let queueList = [];
    const queuedLeads = contacts.filter(c => c.status === 'QUEUED' && isUnsentLead(c));

    if (forceResume || (selectedIds.size === 0 && queuedLeads.length > 0)) {
      queueList = queuedLeads;
    } else if (selectedIds.size > 0) {
      queueList = contacts.filter(c => selectedIds.has(c.id) && isUnsentLead(c));
    } else if (composer?.activeCategory && composer.activeCategory !== 'all') {
      queueList = contacts.filter(c => (c.category || 'Uncategorised') === composer.activeCategory && isUnsentLead(c));
    } else {
      queueList = contacts.filter(isUnsentLead);
    }

    if (!queueList.length) {
      alert('No pending leads found in this project.');
      return;
    }

    let template = document.getElementById('composer-message-text')?.value;
    if (!template || !template.trim()) {
      template = `{Hi|Hello|Hey} {{name}}! \n\nIntroducing *GYMFLOW* – Smart Gym Management Software \n\n• NFC Card Check-in\n• Fingerprint Attendance\n• Members & Memberships\n• Auto Payments & Fee Alerts\n• WhatsApp Automation\n\n*FREE DEMO available.*`;
      const ta = document.getElementById('composer-message-text');
      if (ta) ta.value = template;
    }

    this.queue = queueList;
    this.currentIndex = 0;
    this.sentCount = 0;
    this.isRunning = false;
    this.isPaused = false;
    clearInterval(this.timer);

    // Update batch dropdown to include exact count
    const batchSelect = document.getElementById('ap-batch-select');
    if (batchSelect) {
      let opt = batchSelect.querySelector('option[data-dynamic="true"]');
      if (!opt) {
        opt = document.createElement('option');
        opt.setAttribute('data-dynamic', 'true');
        batchSelect.appendChild(opt);
      }
      opt.value = queueList.length;
      opt.textContent = `All Remaining (${queueList.length} leads)`;

      if (forceResume) {
        batchSelect.value = queueList.length;
        this.batchLimit = queueList.length;
      } else {
        this.batchLimit = parseInt(batchSelect.value, 10) || 25;
      }
    }

    // Update UI Stats
    document.getElementById('ap-stat-queue').textContent = queueList.length;
    document.getElementById('ap-stat-sent').textContent = '0';
    document.getElementById('ap-stat-delay').textContent = `${this.pacingDelaySec}s`;

    this.updateLeadCard(queueList[0]);
    this.log(`Ready: ${queueList.length} leads loaded (${queuedLeads.length > 0 ? 'Resuming ' + queuedLeads.length + ' queued leads' : 'Fresh list'}).`);

    const modal = document.getElementById('autopilot-modal');
    if (modal) {
      modal.classList.add('open');
      modal.style.setProperty('display', 'flex', 'important');
    }
  }

  closeModal() {
    if (this.isRunning && !confirm('Stop running Auto-Pilot campaign?')) return;
    this.stop();
    const modal = document.getElementById('autopilot-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.setProperty('display', 'none', 'important');
    }
  }

  updateLeadCard(contact) {
    const nameEl = document.getElementById('ap-current-name');
    const phoneEl = document.getElementById('ap-current-phone');
    const catEl = document.getElementById('ap-current-category');
    const progLabel = document.getElementById('ap-progress-label');
    const progBar = document.getElementById('ap-progress-bar');
    const badge = document.getElementById('ap-status-badge');

    if (!contact) {
      if (nameEl) nameEl.textContent = 'Batch Finished';
      if (phoneEl) phoneEl.textContent = 'All scheduled leads processed';
      if (catEl) catEl.textContent = 'Completed';
      if (progLabel) progLabel.textContent = `Completed ${this.sentCount} of ${this.queue.length}`;
      if (progBar) progBar.style.width = '100%';
      if (badge) badge.textContent = 'Finished';
      return;
    }

    const totalToProcess = Math.min(this.queue.length, this.batchLimit);
    const pct = Math.round((this.currentIndex / totalToProcess) * 100);

    if (nameEl) nameEl.textContent = contact.name || 'Prospect';
    if (phoneEl) phoneEl.textContent = `+${contact.phone}`;
    if (catEl) catEl.textContent = `${contact.category || 'General'}`;
    if (progLabel) progLabel.textContent = `Lead ${this.currentIndex + 1} of ${totalToProcess}`;
    if (progBar) progBar.style.width = `${pct}%`;
    if (badge) badge.textContent = this.isRunning ? 'Active Processing' : 'Standing By';
  }

  parseSpintax(text) {
    if (!text) return '';
    return text.replace(/\{([^{}]+)\}/g, (match, choices) => {
      const options = choices.split('|');
      return options[Math.floor(Math.random() * options.length)];
    });
  }

  formatMessage(template, contact) {
    let msg = template || '';
    const product = this.app?.activeProject || { name: 'GYMFLOW' };

    // 1. Interpolate contact & project variables
    msg = msg.replace(/{{name}}/gi, contact.name || 'Prospect');
    msg = msg.replace(/{{company}}/gi, contact.company || 'your fitness center');
    msg = msg.replace(/{{phone}}/gi, contact.phone || '');
    msg = msg.replace(/{{category}}/gi, contact.category || '');
    msg = msg.replace(/{{product}}/gi, product?.name || 'GYMFLOW');

    // 2. Parse Spintax: {Hi|Hello|Hey} -> dynamically chosen word
    msg = this.parseSpintax(msg);

    // 3. Append interactive keywords & options (DEMO, Pricing, etc.)
    const buttons = this.app?.buttonManager?.buttons || product?.buttons || [];
    if (buttons && buttons.length > 0) {
      const optionList = buttons.map((b, idx) => {
        const label = typeof b === 'string' ? b : (b.label || b.id);
        return `• Reply *${idx + 1}* or *${label}*`;
      }).join('\n');

      if (!msg.includes('• Reply *1*')) {
        msg = `${msg.trim()}\n\n${optionList}`;
      }
    }

    return msg;
  }

  start() {
    if (!this.queue.length) return;
    this.isRunning = true;
    this.isPaused = false;

    // Prepare full queue payload with formatted messages (interpolating spintax, variables & reply buttons)
    const rawTemplate = document.getElementById('composer-message-text')?.value || '';
    const formattedQueue = this.queue.slice(0, this.batchLimit).map(contact => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      category: contact.category,
      message: this.formatMessage(rawTemplate, contact)
    }));

    const firstLead = formattedQueue[0];
    const cleanPhone = String(firstLead.phone).replace(/[^0-9]/g, '');

    const payload = {
      delay: this.pacingDelaySec || 20,
      leads: formattedQueue
    };
    const hashData = encodeURIComponent(JSON.stringify(payload));
    const launchUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(firstLead.message)}&autopilot=1#ap_queue=${hashData}`;

    // Open tab SYNCHRONOUSLY within click event so Chrome NEVER blocks it!
    let popupBlocked = false;
    try {
      this.waWindow = window.open(launchUrl, 'WhatsAppAutoPilotTab');
      if (!this.waWindow || this.waWindow.closed || typeof this.waWindow.closed === 'undefined') {
        popupBlocked = true;
      }
    } catch(e) {
      popupBlocked = true;
    }

    // Always configure direct fallback link in modal
    const noticeEl = document.getElementById('ap-popup-notice');
    const directLink = document.getElementById('ap-direct-wa-link');
    if (directLink) {
      directLink.href = launchUrl;
    }
    if (noticeEl) {
      noticeEl.style.display = 'block';
    }

    // Post to Server Auto-Pilot Controller in background
    fetch('/api/autopilot/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queue: formattedQueue,
        pacingDelaySec: this.pacingDelaySec
      })
    }).catch(e => console.error('Failed to start autopilot on server:', e));

    this.log(`Auto-Pilot launched! ${formattedQueue.length} leads queued.`);
    if (popupBlocked) {
      this.log(`Switch to your open WhatsApp Web tab (or click "Switch to WhatsApp Tab" above)`);
    } else {
      this.log(`[Lead 1/${formattedQueue.length}] Opening ${firstLead.name || cleanPhone} in WhatsApp Web tab...`);
    }

    // UI Buttons state
    document.getElementById('ap-start-btn').style.display = 'none';
    document.getElementById('ap-pause-btn').style.display = 'inline-flex';
    document.getElementById('ap-skip-btn').style.display = 'inline-flex';

    // Start polling server state to update UI in real-time
    this.startStatePoller();
  }

  async pause() {
    this.isPaused = true;
    try {
      await fetch('/api/autopilot/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: true })
      });
    } catch (_) {}
    document.getElementById('ap-start-btn').textContent = 'Resume';
    document.getElementById('ap-start-btn').style.display = 'inline-flex';
    document.getElementById('ap-pause-btn').style.display = 'none';
    document.getElementById('ap-countdown-label').textContent = 'Paused';
    this.log(`Auto-Pilot paused.`);
  }

  async resume() {
    this.isPaused = false;
    try {
      await fetch('/api/autopilot/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: false })
      });
    } catch (_) {}
    document.getElementById('ap-start-btn').style.display = 'none';
    document.getElementById('ap-pause-btn').style.display = 'inline-flex';
    this.log(`Auto-Pilot resumed.`);
  }

  async skip() {
    this.log(`Skipping current lead...`);
    try {
      await fetch('/api/autopilot/mark-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageContent: '[Skipped by User]' })
      });
    } catch (_) {}
  }

  async stop() {
    this.isRunning = false;
    this.isPaused = false;
    clearInterval(this.timer);
    try {
      await fetch('/api/autopilot/stop', { method: 'POST' });
    } catch (_) {}
    document.getElementById('ap-start-btn').textContent = 'Start Auto-Pilot';
    document.getElementById('ap-start-btn').style.display = 'inline-flex';
    document.getElementById('ap-pause-btn').style.display = 'none';
    document.getElementById('ap-skip-btn').style.display = 'none';
  }

  startStatePoller() {
    clearInterval(this.timer);
    let lastReportedIndex = -1;

    this.timer = setInterval(async () => {
      try {
        const r = await fetch('/api/autopilot/state');
        const state = await r.json();

        if (!state || !state.active) {
          if (this.isRunning && state.sentCount > 0) {
            this.finishBatch();
          }
          return;
        }

        this.sentCount = state.sentCount || 0;
        this.currentIndex = state.currentIndex || 0;
        this.isPaused = Boolean(state.isPaused);

        // Reflect paused/resumed state in CRM UI buttons
        const startBtn = document.getElementById('ap-start-btn');
        const pauseBtn = document.getElementById('ap-pause-btn');
        const cdLabel = document.getElementById('ap-countdown-label');

        if (this.isPaused) {
          if (startBtn) {
            startBtn.textContent = 'Resume';
            startBtn.style.display = 'inline-flex';
          }
          if (pauseBtn) pauseBtn.style.display = 'none';
          if (cdLabel) cdLabel.textContent = 'Paused';
        } else if (state.active) {
          if (startBtn) startBtn.style.display = 'none';
          if (pauseBtn) pauseBtn.style.display = 'inline-flex';
        }

        document.getElementById('ap-stat-sent').textContent = this.sentCount;

        if (state.callListCount !== undefined) {
          const c1 = document.getElementById('ap-stat-calllist');
          const c2 = document.getElementById('sb-calllist-badge');
          const c3 = document.getElementById('audience-calllist-count');
          if (c1) c1.textContent = state.callListCount;
          if (c2) c2.textContent = state.callListCount;
          if (c3) c3.textContent = state.callListCount;
        }

        const currentContact = state.queue ? state.queue[state.currentIndex] : null;
        if (currentContact) {
          this.updateLeadCard(currentContact);
          if (state.currentIndex !== lastReportedIndex) {
            lastReportedIndex = state.currentIndex;
            this.log(`[Lead ${state.currentIndex + 1}/${state.queue.length}] Active: ${currentContact.name || currentContact.phone}`);
          }
        }

        const total = state.queue ? state.queue.length : 1;
        const pct = Math.min(100, Math.round((this.currentIndex / total) * 100));
        const progLabel = document.getElementById('ap-progress-label');
        const progBar = document.getElementById('ap-progress-bar');
        if (progLabel) progLabel.textContent = `Lead ${Math.min(this.currentIndex + 1, total)} of ${total}`;
        if (progBar) progBar.style.width = `${pct}%`;

      } catch (e) {
        console.warn('Poller error:', e);
      }
    }, 1200);
  }

  async finishBatch() {
    this.stop();
    this.updateLeadCard(null);
    this.log(`Auto-Pilot Batch Complete! Successfully processed ${this.sentCount} leads safely.`);
    
    try {
      const r = await fetch('/api/autopilot/call-list');
      const d = await r.json();
      const list = d.callList || [];
      if (list.length > 0) {
        this.log(`Found ${list.length} leads not registered on WhatsApp. Opening Manual Call List...`);
        // Automatically pop up the call list modal in CRM!
        document.getElementById('ap-stat-calllist-card')?.click();
        alert(`Auto-Pilot Finished!\n\nProcessed ${this.sentCount} valid contacts on WhatsApp.\n\nFound ${list.length} non-WhatsApp numbers! The Manual Calling List is now displayed so you can call them directly.`);
        return;
      }
    } catch(e) {
      console.warn('Call list fetch error:', e);
    }

    alert(`Auto-Pilot Finished!\n\nSuccessfully processed ${this.sentCount} contacts via official WhatsApp Web.\nZero bot bans, 100% human-paced safety.`);
  }

  log(msg) {
    const logBox = document.getElementById('ap-activity-log');
    if (!logBox) return;
    const time = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    const line = document.createElement('div');
    line.style.marginBottom = '2px';
    line.innerHTML = `<span style="color:var(--t3);margin-right:6px;">[${time}]</span> <span style="color:var(--t1);">${msg}</span>`;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  }
}
