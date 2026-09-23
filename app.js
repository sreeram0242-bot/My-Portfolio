/**
 * SREERAM PORTFOLIO - INTERACTIVE ENGINE
 * Instagram Ratio Project Modal, Compact Tab Filtering,
 * Animated Icons, and Compact AI Protocol Terminal.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ========================================================================
     1. COMPACT GLASSMORHPISM TAB FILTERING
     ======================================================================== */
  const tabButtons = document.querySelectorAll('.glass-tab-btn');
  const projectCards = document.querySelectorAll('.insta-project-card');
  const projectsGrid = document.getElementById('projects-grid');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const categories = (card.getAttribute('data-category') || '').split(' ');
        const matches = filterValue === 'all' || categories.includes(filterValue);
        
        if (matches) {
          card.classList.remove('card-hidden');
          card.style.display = '';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(6px) scale(0.97)';
          setTimeout(() => {
            card.classList.add('card-hidden');
          }, 180);
        }
      });

      if (projectsGrid) {
        projectsGrid.scrollTo({ left: 0, behavior: 'smooth' });
      }
    });
  });

  /* ========================================================================
     2. INSTAGRAM POST CARD TAP -> PROJECT DETAILS MODAL / BOTTOM SHEET
     ======================================================================== */
  const modal = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalImg = document.getElementById('modal-img');
  const modalBannerWrap = document.getElementById('modal-banner-wrap');
  const modalBadge = document.getElementById('modal-badge');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalFeaturesList = document.getElementById('modal-features-list');
  const modalTechList = document.getElementById('modal-tech-list');
  const modalDemoBtn = document.getElementById('modal-demo-btn');
  const modalGithubBtn = document.getElementById('modal-github-btn');

  function openProjectModal(card) {
    const title = card.getAttribute('data-title') || 'Project Overview';
    const badge = card.getAttribute('data-badge') || 'Production';
    const img = card.getAttribute('data-img') || '';
    const desc = card.getAttribute('data-desc') || '';
    const features = (card.getAttribute('data-features') || '').split(',');
    const tech = (card.getAttribute('data-tech') || '').split(',');
    const github = card.getAttribute('data-github') || '#';
    const demo = card.getAttribute('data-demo') || '';

    modalTitle.textContent = title;
    modalBadge.textContent = badge;
    modalImg.src = img;
    modalImg.alt = title;
    modalDesc.textContent = desc;

    // Populate Key Highlights
    modalFeaturesList.innerHTML = '';
    features.forEach(f => {
      const trimmed = f.trim();
      if (!trimmed) return;
      const li = document.createElement('li');
      li.className = 'modal-feature-item';
      li.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${trimmed}</span>
      `;
      modalFeaturesList.appendChild(li);
    });

    // Populate Tech Chips
    modalTechList.innerHTML = '';
    tech.forEach(t => {
      const trimmed = t.trim();
      if (!trimmed) return;
      const span = document.createElement('span');
      span.className = 'insta-chip';
      span.textContent = trimmed;
      modalTechList.appendChild(span);
    });

    // Action Buttons
    modalGithubBtn.href = github;
    if (modalDemoBtn) {
      if (demo && demo.trim() !== '') {
        modalDemoBtn.href = demo;
        modalDemoBtn.style.display = 'inline-flex';
      } else {
        modalDemoBtn.style.display = 'none';
      }
    }

    if (modalBannerWrap) {
      modalBannerWrap.onclick = () => {
        if (demo && demo.trim() !== '') {
          window.open(demo, '_blank');
        }
      };
    }

    // Open Modal
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Lock background scroll
  }

  function closeProjectModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  projectCards.forEach(card => {
    const canvas = card.querySelector('.card-canvas');
    const demoUrl = card.getAttribute('data-demo');

    // Clicking the photo / canvas launches the interactive demo UI in a new tab
    if (canvas && demoUrl) {
      canvas.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(demoUrl, '_blank');
      });
    }

    // Clicking top badge or bottom details opens project modal
    card.addEventListener('click', () => openProjectModal(card));
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProjectModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeProjectModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeProjectModal();
    }
  });

  /* ========================================================================
     3. COMPACT AI LAB SCENARIO SWITCHER
     ======================================================================== */
  const aiScenarios = {
    biometric: {
      latency: "10ms",
      code: `
<span class="stream-comment">// [Hardware Socket] ZKTeco Biometric Event Daemon</span>
<span class="stream-keyword">import</span> { ZKDriver } <span class="stream-keyword">from</span> <span class="stream-string">'@zkteco/hardware-socket'</span>;
<span class="stream-keyword">import</span> { prisma } <span class="stream-keyword">from</span> <span class="stream-string">'@/lib/prisma'</span>;

<span class="stream-keyword">export async function</span> <span class="stream-func">listenAttendance</span>(deviceIp: <span class="stream-accent">string</span>) {
  <span class="stream-keyword">const</span> zk = <span class="stream-keyword">new</span> <span class="stream-func">ZKDriver</span>({ ip: deviceIp, port: <span class="stream-accent">4370</span> });
  <span class="stream-keyword">await</span> zk.<span class="stream-func">connect</span>();
  
  zk.<span class="stream-func">on</span>(<span class="stream-string">'punch'</span>, <span class="stream-keyword">async</span> ({ uid }) => {
    <span class="stream-keyword">const</span> m = <span class="stream-keyword">await</span> prisma.member.<span class="stream-func">findUnique</span>({ where: { biometricUid: uid } });
    <span class="stream-keyword">if</span> (m?.isActive) {
      <span class="stream-keyword">await</span> prisma.attendance.<span class="stream-func">create</span>({ data: { memberId: m.id } });
      zk.<span class="stream-func">triggerRelay</span>({ durationMs: <span class="stream-accent">1200</span> });
    }
  });
}`
    },

    mobile: {
      latency: "6ms",
      code: `
<span class="stream-comment">// [Mobile Gesture] Instagram 4:5 Touch Responsive Card Engine</span>
<span class="stream-keyword">export function</span> <span class="stream-func">initTouchHaptics</span>() {
  <span class="stream-keyword">const</span> cards = document.<span class="stream-func">querySelectorAll</span>(<span class="stream-string">'.insta-project-card'</span>);
  cards.<span class="stream-func">forEach</span>(c => {
    c.<span class="stream-func">addEventListener</span>(<span class="stream-string">'touchstart'</span>, () => {
      <span class="stream-keyword">if</span> (window.navigator?.vibrate) window.navigator.<span class="stream-func">vibrate</span>(<span class="stream-accent">8</span>);
    }, { passive: <span class="stream-keyword">true</span> });
  });
}`
    },

    offline: {
      latency: "4ms",
      code: `
<span class="stream-comment">// [Offline POS] SQLite Local-First Ledger & Bluetooth Thermal Print</span>
<span class="stream-keyword">import</span> { SQLiteConnection } <span class="stream-keyword">from</span> <span class="stream-string">'@capacitor-community/sqlite'</span>;

<span class="stream-keyword">export async function</span> <span class="stream-func">commitInvoice</span>(invoice) {
  <span class="stream-keyword">await</span> db.<span class="stream-func">run</span>(<span class="stream-string">'INSERT INTO bills VALUES (?, ?, "OFFLINE")'</span>, [invoice.id, invoice.total]);
  printer.<span class="stream-func">dispatchEscPos</span>(invoice); <span class="stream-comment">// instant physical receipt</span>
  backgroundSync.<span class="stream-func">queue</span>(invoice.id);
}`
    },

    agent: {
      latency: "15ms",
      code: `
<span class="stream-comment">// [AI Rigor] Strict Type-Safe Verification Loop</span>
<span class="stream-keyword">const</span> validator = <span class="stream-keyword">new</span> <span class="stream-func">VerificationPipeline</span>({
  tests: [<span class="stream-func">runTypeCheck</span>(), <span class="stream-func">validateMobileSafeAreas</span>(), <span class="stream-func">verifyNoEmojiPolicy</span>()]
});
<span class="stream-keyword">const</span> res = <span class="stream-keyword">await</span> validator.<span class="stream-func">executeAutonomousLoop</span>();
console.<span class="stream-func">log</span>(\`Verified \${res.checks} checks. 0 runtime flaws.\`);`
    }
  };

  const pillButtons = document.querySelectorAll('.ai-pill-btn');
  const codeStreamElement = document.getElementById('code-stream-content');
  const latencyBadge = document.getElementById('terminal-latency');

  function renderScenario(key) {
    const data = aiScenarios[key] || aiScenarios.biometric;
    if (codeStreamElement) {
      codeStreamElement.innerHTML = data.code.trim();
    }
    if (latencyBadge) {
      latencyBadge.textContent = `Latency: ${data.latency} • Zero Hallucinations`;
    }
  }

  // Initial render
  renderScenario('biometric');

  pillButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pillButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const scenario = btn.getAttribute('data-scenario');
      
      if (codeStreamElement) {
        codeStreamElement.style.opacity = '0.3';
        setTimeout(() => {
          renderScenario(scenario);
          codeStreamElement.style.opacity = '1';
        }, 100);
      }
    });
  });

  /* ========================================================================
     4. SCROLL-SPY FOR ACTIVE NAVIGATION
     ======================================================================== */
  const sections = document.querySelectorAll('section[id]');
  const desktopLinks = document.querySelectorAll('.nav-link');
  const mobileDockLinks = document.querySelectorAll('.mobile-dock-link');

  function updateActiveNav() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        desktopLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });

        mobileDockLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('data-nav') === sectionId) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* ========================================================================
     5. CONTACT FORM & TOAST NOTIFICATION
     ======================================================================== */
  const contactForm = document.getElementById('contact-form');
  const toast = document.getElementById('toast-notify');
  const toastMessage = document.getElementById('toast-message');

  function showToast(message) {
    if (!toast) return;
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-submit-contact');
      const originalText = submitBtn ? submitBtn.innerHTML : '';

      if (submitBtn) {
        submitBtn.innerHTML = `<span>Sending...</span>`;
        submitBtn.style.opacity = '0.7';
        submitBtn.disabled = true;
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.innerHTML = originalText;
          submitBtn.style.opacity = '1';
          submitBtn.disabled = false;
        }
        contactForm.reset();
        showToast('Thank you! Message received. Sreeram will respond directly.');
      }, 600);
    });
  }

  /* ========================================================================
     7. TACTILE HAPTIC TOUCH FEEDBACK
     ======================================================================== */
  const touchInteractiveElements = document.querySelectorAll('.btn, .glass-tab-btn, .mobile-dock-link, .quick-contact-btn, .insta-project-card');
  touchInteractiveElements.forEach(el => {
    el.addEventListener('click', () => {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(8);
      }
    });
  });

  /* ========================================================================
     8. SCROLL REVEAL — IntersectionObserver
     ======================================================================== */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    // Mark all section headers and content blocks for reveal
    const revealTargets = [
      { sel: '.section-header',       cls: 'reveal' },
      { sel: '.tabs-container',       cls: 'reveal' },
      { sel: '.insta-project-card',   cls: 'reveal reveal-scale' },
      { sel: '.terminal-compact-card',cls: 'reveal' },
      { sel: '.skill-scroll-card',    cls: 'reveal reveal-scale' },
      { sel: '.agency-card',          cls: 'reveal' },
      { sel: '.agency-stats-list',    cls: 'reveal' },
      { sel: '.contact-card-info',    cls: 'reveal reveal-left' },
      { sel: '.contact-form-panel',   cls: 'reveal reveal-right' },
      { sel: '.footer',               cls: 'reveal' },
      { sel: '.quick-contact-btn',    cls: 'reveal' },
    ];

    revealTargets.forEach(({ sel, cls }) => {
      document.querySelectorAll(sel).forEach(el => {
        cls.split(' ').forEach(c => el.classList.add(c));
      });
    });

    // Stagger the projects grid children
    const pgrid = document.getElementById('projects-grid');
    if (pgrid) pgrid.classList.add('reveal-stagger');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '0px 0px 100px 0px' });

    document.querySelectorAll('.reveal').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 80) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      }
    });

    // Safety fallback: ensure any element unrevealed after 2.5s is made visible
    setTimeout(() => {
      document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => el.classList.add('is-visible'));
    }, 2500);
  }

  /* ========================================================================
     9. HERO CARD 3D PARALLAX TILT (Desktop)
     ======================================================================== */
  const heroCard = document.getElementById('hero-card');
  if (heroCard && !prefersReducedMotion && window.innerWidth >= 768) {
    heroCard.addEventListener('mousemove', (e) => {
      const rect = heroCard.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      heroCard.style.transform = `perspective(600px) rotateX(${-dy * 5}deg) rotateY(${dx * 7}deg) scale(1.02)`;
    });
    heroCard.addEventListener('mouseleave', () => {
      heroCard.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
    });
  }

  /* ========================================================================
     10. METRIC NUMBER COUNT-UP ANIMATION
     ======================================================================== */
  function animateCounter(el, target, suffix) {
    if (prefersReducedMotion) { el.textContent = target + suffix; return; }
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = 1 - Math.pow(2, -10 * progress);
      const current = Math.round(eased * target);
      el.innerHTML = current + '<span>' + suffix + '</span>';
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const metricObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const numEl = entry.target.querySelector('.metric-number');
        if (!numEl || numEl.dataset.counted) return;
        numEl.dataset.counted = '1';
        const text = numEl.textContent.trim();
        const num = parseInt(text.replace(/\D/g,''), 10);
        const suffix = text.replace(/[0-9]/g, '').trim();
        animateCounter(numEl, num, suffix);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.metric-item').forEach(el => metricObserver.observe(el));

  /* ========================================================================
     11. SKILL BAR ANIMATED FILL ON SCROLL
     ======================================================================== */
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
          // Pull the original width from the inline style
          const originalWidth = bar.getAttribute('data-width') || bar.style.width;
          if (originalWidth) {
            bar.style.setProperty('--bar-width', originalWidth);
            bar.style.width = '0';
            requestAnimationFrame(() => {
              setTimeout(() => bar.classList.add('bar-animated'), 80);
            });
          }
        });
        barObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.skill-scroll-card').forEach(card => {
    // Save original bar widths before we reset them
    card.querySelectorAll('.skill-bar-fill').forEach(bar => {
      if (!bar.dataset.width) {
        bar.dataset.width = bar.style.width || '80%';
        bar.classList.add('skill-bar-fill');
      }
    });
    barObserver.observe(card);
  });

  /* ========================================================================
     12. CURSOR GLOW ORB (Desktop Only)
     ======================================================================== */
  if (!prefersReducedMotion && window.innerWidth >= 1024) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let glowX = 0, glowY = 0;
    let targetX = 0, targetY = 0;

    document.addEventListener('mousemove', e => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    (function animateGlow() {
      glowX += (targetX - glowX) * 0.1;
      glowY += (targetY - glowY) * 0.1;
      glow.style.transform = `translate(${glowX - 160}px, ${glowY - 160}px)`;
      requestAnimationFrame(animateGlow);
    })();
  }

});

