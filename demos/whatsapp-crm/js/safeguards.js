export class SafeguardsStudio {
  constructor(app) {
    this.app = app;
    this.safeguards = {};
    this.init();
  }

  async init() {
    try {
      const r = await fetch('/api/safeguards');
      const d = await r.json();
      if (d.success) this.safeguards = d.safeguards;
    } catch(e) { console.error(e); }
    this.render();
  }

  render() {
    const container = document.getElementById('safeguards-grid');
    if (!container) return;

    const shields = [
      { num:1,  title:'Simulated Typing Presence',     key:'typingSimulation',        desc:'Dispatches WhatsApp composing state for 3–6 seconds before every dispatch, mimicking real human keystrokes.' },
      { num:2,  title:'Randomized Jitter Delays',       key:'jitterDelayMinSec',       desc:'Enforces random 20–45s gaps between consecutive outbound messages to break fixed-interval fingerprinting.' },
      { num:3,  title:'Batching & Rest Windows',        key:'batchSize',               desc:'Pauses queue for 10 minutes after every 15 messages to prevent sudden volume spikes that trigger rate limits.' },
      { num:4,  title:'Daily Volume Cap & Warmup',      key:'warmupMode',              desc:'Restricts daily sends (default 60/day). Warmup mode scales volume gradually to build account trust with Meta.' },
      { num:5,  title:'Spintax Variation Hashing',      key:'spintaxEnabled',          desc:'Parses {Hi|Hello|Hey} syntax so no two outgoing messages share identical byte hashes or text payloads.' },
      { num:6,  title:'Instant Auto-Blacklist Engine',  key:'autoBlacklistOnOptOut',   desc:'Immediately adds recipient to suppression list when they tap "Not Interested" or reply STOP/CANCEL.' },
      { num:7,  title:'Business Hours Restriction',     key:'businessHoursEnabled',    desc:'Automatically holds dispatches outside configured business hours (09:30 AM – 06:30 PM local time).' },
      { num:8,  title:'WhatsApp Number Pre-Validation', key:'preValidationCheck',      desc:'Calls onWhatsApp() before queueing each recipient to eliminate high bounce rates from inactive numbers.' },
      { num:9,  title:'Emergency Circuit Breaker',      key:'circuitBreakerConsecutiveErrors', desc:'Freezes outbound queue and alerts admin if 3 consecutive socket or message delivery errors occur.' },
      { num:10, title:'Interactive Fallback Engine',    key:null,                      desc:'Auto-degrades to single-choice polls or numbered text if native buttons fail on recipient device.', alwaysOn:true },
      { num:11, title:'Duplicate Suppression Window',  key:'duplicateWindowDays',     desc:'Blocks re-pitching the same lead for the same product within the configured cooldown window (default 30 days).' },
      { num:12, title:'Multi-File Session Persistence', key:null,                      desc:'Stores Baileys credentials across multiple auth files with rotation to prevent accidental disconnects.', alwaysOn:true },
      { num:13, title:'Media Compression & Pre-Check', key:'mediaCompression',        desc:'Compresses images/video to safe byte limits before upload, avoiding socket transfer timeouts.' },
      { num:14, title:'Inbound Priority Queueing',     key:'prioritizeInboundReplies',desc:'Prioritizes processing of incoming prospect replies ahead of cold outbound broadcast batches.' },
      { num:15, title:'Cross-Product Collision Guard',  key:'productCollisionGuard',   desc:'Blocks pitching a new product to a contact who is actively in conversation for a different product campaign.' }
    ];

    container.innerHTML = shields.map(s => {
      const isToggle   = s.key && typeof this.safeguards[s.key] === 'boolean';
      const isAlwaysOn = s.alwaysOn;
      const isEnabled  = isAlwaysOn || (s.key ? Boolean(this.safeguards[s.key]) : false);

      return `
        <div class="safeguard-card">
          <div class="safeguard-head">
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="safeguard-icon-box" style="width:26px;height:26px;border-radius:6px;font-size:10px;font-weight:800;font-family:'JetBrains Mono',monospace;color:var(--accent);">${String(s.num).padStart(2,'0')}</div>
              <div class="safeguard-name">${s.title}</div>
            </div>
            ${isAlwaysOn
              ? `<span class="badge badge-green" style="font-size:10px;">Always On</span>`
              : isToggle
                ? `<label class="toggle" title="Toggle ${s.title}">
                     <input type="checkbox" data-key="${s.key}" ${isEnabled ? 'checked' : ''}>
                     <span class="toggle-track"></span>
                   </label>`
                : `<span class="badge badge-green" style="font-size:10px;">Active</span>`
            }
          </div>
          <div class="safeguard-desc">${s.desc}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('input[type="checkbox"][data-key]').forEach(chk => {
      chk.addEventListener('change', async e => {
        const key = e.target.dataset.key;
        this.safeguards[key] = e.target.checked;
        try {
          await fetch('/api/safeguards', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify(this.safeguards)
          });
        } catch(err) { console.error(err); }
      });
    });
  }
}
