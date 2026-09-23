/**
 * PC DESKTOP SHOWCASE SCRIPT
 * - Mobile: wraps in centered 1280px desktop window with warm cream showcase cards
 * - Desktop PC: wraps in a macOS-style browser window frame with rounded corners,
 *   drop shadow, title bar, and the portfolio's Warm Cream background (#F5EFEB)
 */
(function() {
  const DESKTOP_WIDTH = 1280;

  function isMobileDevice() {
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent);
    if (isMobileUA) return true;

    // Touch device with narrow screen (phone)
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = Math.min(window.screen.width, window.screen.height) < 768;
    if (hasTouch && isSmallScreen) return true;

    // Viewport width for responsive mobile testing
    if (window.innerWidth <= 768) return true;

    return false;
  }

  function setupViewport() {
    let screenW = window.screen.width;
    if (window.orientation === 90 || window.orientation === -90) {
      screenW = Math.max(window.screen.width, window.screen.height);
    } else {
      screenW = Math.min(window.screen.width, window.screen.height);
    }

    const scale = Math.max(0.18, Math.min(1.0, screenW / DESKTOP_WIDTH)).toFixed(4);

    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }

    meta.setAttribute(
      'content',
      `width=${DESKTOP_WIDTH}, initial-scale=${scale}, minimum-scale=0.1, maximum-scale=3.0, user-scalable=yes`
    );
  }

  /* =========================================================
     DESKTOP PC: Browser Window Frame
     ========================================================= */
  function wrapDesktopFrame() {
    // Prevent duplicate wrapping
    if (document.querySelector('.pc-browser-frame')) return;

    const topBanner = document.querySelector('.demo-top-banner');
    const projectTitleEl = topBanner ? topBanner.querySelector('.demo-title-pill strong') : null;
    const projectTitle = projectTitleEl ? projectTitleEl.textContent.trim() : document.title;

    // Mark body for desktop frame mode
    document.body.classList.add('is-desktop-pc-frame');
    document.documentElement.classList.add('is-desktop-pc-frame');

    // --- Build the browser-window wrapper ---
    const frame = document.createElement('div');
    frame.className = 'pc-browser-frame';

    // Detect dark theme
    const isDark = document.body.classList.contains('dark-theme') ||
                   document.querySelector('#app-shell') ||
                   window.location.pathname.includes('whatsapp') ||
                   window.location.pathname.includes('spotdown');
    if (isDark) frame.classList.add('dark-app');

    // Title bar with traffic-light dots + URL bar
    const titleBar = document.createElement('div');
    titleBar.className = 'pc-browser-titlebar';
    titleBar.innerHTML = `
      <div class="pc-browser-dots">
        <span class="pc-dot dot-close"></span>
        <span class="pc-dot dot-min"></span>
        <span class="pc-dot dot-max"></span>
      </div>
      <div class="pc-browser-urlbar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.6;">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span class="pc-url-text">demo/${projectTitle}</span>
      </div>
      <div class="pc-browser-tabs-area">
        <div class="pc-browser-tab-active">
          <span>${projectTitle}</span>
        </div>
      </div>
    `;

    // Content area (clips app to the rounded frame)
    const content = document.createElement('div');
    content.className = 'pc-browser-content';

    // Collect ALL existing body children (except banner)
    const children = Array.from(document.body.childNodes);
    children.forEach(node => {
      if (node === topBanner) return;
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'SCRIPT') return;
      }
      content.appendChild(node);
    });

    frame.appendChild(titleBar);
    frame.appendChild(content);

    // Insert frame after banner (or at body start)
    if (topBanner && topBanner.nextSibling) {
      document.body.insertBefore(frame, topBanner.nextSibling);
    } else {
      document.body.appendChild(frame);
    }
  }

  /* =========================================================
     MOBILE: Full showcase with warm cream cards
     ========================================================= */
  function wrapMobileShowcase() {
    document.documentElement.classList.add('is-mobile-pc-view');
    document.body.classList.add('is-mobile-pc-view');

    if (document.querySelector('.pc-desktop-stage')) return;

    const topBanner = document.querySelector('.demo-top-banner');
    const projectTitleEl = topBanner ? topBanner.querySelector('.demo-title-pill strong') : null;
    const projectTitle = projectTitleEl ? projectTitleEl.textContent.trim() : 'PC Desktop Application';
    const repoLinkEl = topBanner ? topBanner.querySelector('.demo-repo-link') : null;
    const repoHref = repoLinkEl ? repoLinkEl.getAttribute('href') : '#';

    const stage = document.createElement('div');
    stage.className = 'pc-desktop-stage';

    const header = document.createElement('div');
    header.className = 'pc-showcase-header';
    header.innerHTML = `
      <div class="pc-showcase-badge">
        <span class="pc-pulse-dot"></span>
        <span>Original PC Desktop Simulation &bull; 1280 &times; 800</span>
      </div>
      <h1 class="pc-showcase-title">${projectTitle}</h1>
      <p class="pc-showcase-subtitle">Pinch to zoom into any section or rotate your phone to landscape for full screen.</p>
    `;
    stage.appendChild(header);

    const win = document.createElement('div');
    win.className = 'pc-desktop-window';

    const isDark = document.body.classList.contains('dark-theme') ||
                   document.querySelector('#app-shell') ||
                   window.location.pathname.includes('whatsapp') ||
                   window.location.pathname.includes('spotdown');
    if (isDark) win.classList.add('dark-app');

    const children = Array.from(document.body.childNodes);
    children.forEach(node => {
      if (node === topBanner || node === stage) return;
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'SCRIPT' ||
            node.classList.contains('modal-backdrop') ||
            node.id?.includes('modal') ||
            node.classList.contains('modal')) {
          return;
        }
      }
      win.appendChild(node);
    });

    stage.appendChild(win);

    const footer = document.createElement('div');
    footer.className = 'pc-showcase-footer';
    footer.innerHTML = `
      <div class="pc-showcase-controls">
        <div class="pc-control-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          <span>Pinch to Zoom In</span>
        </div>
        <span class="pc-control-sep">&bull;</span>
        <div class="pc-control-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          <span>Rotate Device for Full-Width</span>
        </div>
        <span class="pc-control-sep">&bull;</span>
        <div class="pc-control-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>100% Fully Interactive</span>
        </div>
      </div>

      <div class="pc-feature-cards-grid">
        <div class="pc-spec-card">
          <div class="pc-spec-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
          </div>
          <div class="pc-spec-content">
            <div class="pc-spec-title">Hardware &amp; Desktop Architecture</div>
            <div class="pc-spec-desc">Sub-15ms local billing loop, serial COM thermal receipt printing, and multithreaded offline caching.</div>
          </div>
        </div>

        <div class="pc-spec-card">
          <div class="pc-spec-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <div class="pc-spec-content">
            <div class="pc-spec-title">Zero Server Overhead</div>
            <div class="pc-spec-desc">Runs 100% in client memory. Real production database &amp; endpoints remain completely safe and unexposed.</div>
          </div>
        </div>

        <div class="pc-spec-card">
          <div class="pc-spec-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          </div>
          <div class="pc-spec-content">
            <div class="pc-spec-title">Production Source Code</div>
            <div class="pc-spec-desc">100% authentic architecture engineered by SreeRam. Inspect implementation files on GitHub.</div>
          </div>
        </div>
      </div>

      <div class="pc-showcase-actions">
        <a href="../../#projects" class="pc-btn-portfolio">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          <span>Back to Portfolio Projects</span>
        </a>
        <a href="${repoHref}" class="pc-btn-github" target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          <span>View GitHub Repository</span>
        </a>
      </div>
    `;
    stage.appendChild(footer);

    if (topBanner && topBanner.nextSibling) {
      document.body.insertBefore(stage, topBanner.nextSibling);
    } else {
      document.body.appendChild(stage);
    }
  }

  /* =========================================================
     ENTRY POINT
     ========================================================= */
  function init() {
    if (isMobileDevice()) {
      setupViewport();
      wrapMobileShowcase();
    } else {
      // Desktop PC: show windowed browser frame
      wrapDesktopFrame();
    }
  }

  if (document.readyState === 'loading') {
    // Run setupViewport immediately (before DOMContentLoaded) for mobile
    if (isMobileDevice()) setupViewport();
    document.addEventListener('DOMContentLoaded', init);
  } else {
    if (isMobileDevice()) setupViewport();
    init();
  }

  window.addEventListener('resize', () => {
    if (isMobileDevice()) setupViewport();
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => { if (isMobileDevice()) setupViewport(); }, 200);
  });
})();
