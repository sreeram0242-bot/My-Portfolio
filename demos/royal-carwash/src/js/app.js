/**
 * Royal Car Wash — Main Application Script
 * Handles: Nav, Hero Animations, Particles, Tracker, Before/After,
 *          Testimonials Carousel, Scroll Reveals, Booking Modal, Toast, Counters
 */

// GSAP reference (loads from window.gsap via CDN or uses graceful fallback)
const gsap = (typeof window !== 'undefined' && window.gsap) ? window.gsap : {
  fromTo(targets, fromVars, toVars) {
    const list = Array.isArray(targets) ? targets : (targets instanceof NodeList ? [...targets] : [targets]);
    list.forEach(el => {
      if (!el) return;
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.classList.add('revealed');
    });
    if (toVars && typeof toVars.onComplete === 'function') toVars.onComplete();
  },
  from(targets, vars) {
    const list = Array.isArray(targets) ? targets : (targets instanceof NodeList ? [...targets] : [targets]);
    list.forEach(el => { if (el) { el.style.opacity = '1'; el.style.transform = 'none'; el.classList.add('revealed'); } });
  },
  to(targets, vars) {
    const list = Array.isArray(targets) ? targets : (targets instanceof NodeList ? [...targets] : [targets]);
    list.forEach(el => { if (el) el.classList.add('revealed'); });
  },
  set(targets, vars) {}
};

function initAdminPortal() {
  // Admin portal is available at ./admin.html
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// ─────────────────────────────────────────────────────────────────────────────
// 0. INTRO VIDEO
// ─────────────────────────────────────────────────────────────────────────────

function initVideoIntro() {
  const introScreen = qs('#intro-screen');
  if (!introScreen) return;

  // Remove intro immediately — video file is not available in this demo build.
  // The actual live website (royal-carwash-five.vercel.app) plays the branded
  // intro video; here we jump straight to the website.
  introScreen.style.display = 'none';
  if (introScreen.parentNode) {
    introScreen.parentNode.removeChild(introScreen);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HEADER — scroll effect + mobile nav toggle
// ─────────────────────────────────────────────────────────────────────────────

function initHeader() {
  const header      = qs('#site-header');
  const mobileToggle = qs('#mobile-toggle');
  const navLinks    = qs('#nav-links');
  const overlay     = qs('#mobile-overlay');
  const navLinkEls  = qsa('.nav-link');

  // Scroll effect
  const onScroll = () => {
    if (window.scrollY > 50) {
      if (header) header.classList.add('scrolled');
    } else {
      if (header) header.classList.remove('scrolled');
    }

    // Active nav highlighting
    const sections = qsa('section[id]');
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) {
        current = s.id;
      }
    });
    navLinkEls.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  function openMenu() {
    if (navLinks) navLinks.classList.add('active');
    if (overlay) overlay.classList.add('active');
    if (mobileToggle) {
      mobileToggle.classList.add('open');
      mobileToggle.setAttribute('aria-expanded', 'true');
    }
    if (navLinks) navLinks.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (navLinks) navLinks.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    if (mobileToggle) {
      mobileToggle.classList.remove('open');
      mobileToggle.setAttribute('aria-expanded', 'false');
    }
    if (navLinks) navLinks.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      if (navLinks && navLinks.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (overlay) overlay.addEventListener('click', closeMenu);

  navLinkEls.forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Keyboard: close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeMenu();
      closeModal();
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PARTICLE CANVAS — lightweight animated dots
// ─────────────────────────────────────────────────────────────────────────────

function initParticles() {
  const canvas = qs('#particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles;
  const PARTICLE_COUNT = window.innerWidth < 640 ? 30 : 60;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.5 + 0.3,
      dx:    (Math.random() - 0.5) * 0.3,
      dy:    (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    }));
  }

  let raf;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const t = performance.now() / 1000;

    particles.forEach(p => {
      p.x += p.dx;
      p.y += p.dy;
      p.pulse += 0.01;

      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      const alpha = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,18,26,${alpha})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  const ro = new ResizeObserver(() => {
    resize();
    createParticles();
  });
  ro.observe(canvas);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. HERO ENTRANCE ANIMATION (GSAP)
// ─────────────────────────────────────────────────────────────────────────────

function initHeroAnimation() {
  const content = qs('#hero-content');
  const visual  = qs('#hero-visual');
  if (!content) return;

  const children = qsa('.reveal-up', content);

  gsap.fromTo(children,
    { opacity: 0, y: 35 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      delay: 0.2,
    }
  );

  if (visual) {
    gsap.fromTo(visual,
      { opacity: 0, x: 40 },
      { opacity: 1, x: 0, duration: 1, ease: 'power3.out', delay: 0.3 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. INTERSECTION OBSERVER — scroll reveal
// ─────────────────────────────────────────────────────────────────────────────

function initScrollReveals() {
  const targets = qsa('[data-reveal]');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(el => observer.observe(el));

  // Immediately reveal elements already visible in the viewport on load
  requestAnimationFrame(() => {
    targets.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95) {
        el.classList.add('revealed');
        observer.unobserve(el);
      }
    });
  });

  // Process steps
  const processSteps = qsa('.process-step');
  const stepObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        stepObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  processSteps.forEach(step => stepObserver.observe(step));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. NUMBER COUNTER ANIMATION
// ─────────────────────────────────────────────────────────────────────────────

function initCounters() {
  const counterEls = qsa('[data-target]');
  if (!counterEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const dur    = 1800;
      const start  = performance.now();

      function update(now) {
        const elapsed  = now - start;
        const progress = clamp(elapsed / dur, 0, 1);
        // Ease out quart
        const eased = 1 - Math.pow(1 - progress, 4);
        const value = Math.round(eased * target);
        el.textContent = value.toLocaleString('en-IN');
        if (progress < 1) requestAnimationFrame(update);
      }

      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.6 });

  counterEls.forEach(el => observer.observe(el));
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. LIVE VEHICLE TRACKER
// ─────────────────────────────────────────────────────────────────────────────

const VEHICLE_DB = {
  'TN 47 RC 8888': { name: 'BMW M4 Coupé',     step: 2, eta: 'Ready in 12 Mins' },
  'TN 47 RC 9999': { name: 'Toyota Camry',      step: 1, eta: 'Ready in 28 Mins' },
  'TN 47 AB 1234': { name: 'Honda City',        step: 3, eta: 'Ready in 8 Mins'  },
  'TN 47 XY 5678': { name: 'Mahindra XUV700',  step: 0, eta: 'Just Checked In'  },
  'TN 47 PQ 0001': { name: 'Royal Enfield',     step: 4, eta: 'READY FOR PICKUP' },
};

const STEP_LABELS = [
  'Checked-In',
  'In Wash Bay',
  'Foam & Hydro',
  'Polish & Detail',
  'Ready',
];

function initTracker() {
  const trackBtn    = qs('#btn-track');
  const plateInput  = qs('#input-plate');
  const resultBox   = qs('#tracking-result-box');
  const vehicleName = qs('#track-vehicle-name');
  const etaEl       = qs('#track-eta');
  const steps       = qsa('.step', resultBox);
  const fillLine    = qs('#stepper-fill');

  if (!trackBtn) return;

  function updateStepper(activeIdx) {
    steps.forEach((step, i) => {
      step.classList.remove('completed', 'active');
      const dot = qs('.step-dot', step);
      if (i < activeIdx) {
        step.classList.add('completed');
        if (dot) dot.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
      } else if (i === activeIdx) {
        step.classList.add('active');
        if (dot) dot.innerHTML = `<div class="active-pulse" aria-hidden="true"></div>${i + 1}`;
      } else {
        if (dot) {
          dot.innerHTML = i === 4 
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 4 3 12h14l3-12-6 7-4-8-4 8-6-7z"/></svg>` 
            : `${i + 1}`;
        }
      }
    });

    if (fillLine) {
      const ratio = activeIdx / (steps.length - 1);
      const dotWidth = (steps[0] && steps[0].querySelector('.step-dot')) ? steps[0].querySelector('.step-dot').offsetWidth : 46;
      fillLine.style.height = '';
      fillLine.style.width  = `calc((100% - ${dotWidth}px) * ${ratio})`;
    }
  }

  function runTrack() {
    const plate = plateInput.value.trim().toUpperCase().replace(/\s+/g, ' ');
    if (!plate) return;

    sessionStorage.setItem('royal_tracking_plate', plate);
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('track', plate);
    window.history.replaceState({}, '', newUrl);

    trackBtn.disabled = true;
    trackBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      LOCATING...
    `;

    const apiBase = import.meta.env.VITE_API_URL || 'https://royal-carwash.onrender.com';
    fetch(`${apiBase}/api/tracker/${encodeURIComponent(plate)}`)
      .then(res => res.json())
      .then(result => {
        trackBtn.disabled = false;
        trackBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          TRACK STATUS
        `;

        if (result.success && result.data) {
          const item = result.data;
          if (vehicleName) vehicleName.textContent = `${item.plate_number} — ${item.vehicle_name}`;
          if (etaEl) {
            etaEl.textContent = item.current_step === 4 ? 'READY FOR PICKUP' : `Ready in ~${item.eta_minutes} Mins`;
            etaEl.style.color = item.current_step === 4 ? '#4ade80' : '#4ade80';
          }
          updateStepper(item.current_step);
          gsap.from(resultBox, { opacity: 0, y: 15, duration: 0.45, ease: 'power2.out' });
        } else {
          // Fallback to local DB check
          checkLocalVehicle(plate);
        }
      })
      .catch(() => {
        trackBtn.disabled = false;
        trackBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          TRACK STATUS
        `;
        checkLocalVehicle(plate);
      });
  }

  function checkLocalVehicle(plate) {
    const vehicle = VEHICLE_DB[plate];
    if (!vehicle) {
      if (vehicleName) vehicleName.textContent = `${plate} — Not Registered`;
      if (etaEl) {
        etaEl.textContent = 'Vehicle not found in database';
        etaEl.style.color = '#ef4444';
      }
      updateStepper(-1);
      gsap.from(resultBox, { opacity: 0, y: 15, duration: 0.45, ease: 'power2.out' });
      showToast('Vehicle not found. Please check your plate number.');
      return;
    }

    if (vehicleName) vehicleName.textContent = `${plate} — ${vehicle.name}`;
    if (etaEl) {
      etaEl.textContent = vehicle.eta;
      etaEl.style.color = '#4ade80';
    }
    updateStepper(vehicle.step);
    gsap.from(resultBox, { opacity: 0, y: 15, duration: 0.45, ease: 'power2.out' });
  }

  // Real-Time WebSocket Customer Sync
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'https://royal-carwash.onrender.com';
    const wsUrl = apiBase.replace(/^http/, 'ws');
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'WASH_STEP_UPDATED') {
          const currentPlate = plateInput.value.trim().toUpperCase().replace(/\s+/g, ' ');
          if (currentPlate && msg.data.plate_number.toUpperCase().replace(/\s+/g, ' ') === currentPlate) {
            updateStepper(msg.data.current_step);
            if (etaEl) etaEl.textContent = msg.data.current_step === 4 ? 'READY FOR PICKUP' : `Ready in ~${msg.data.eta_minutes} Mins`;
            showToast(`Real-Time Update: ${msg.data.plate_number} step updated!`);
          }
        }
      } catch (e) {}
    };
  } catch (e) {}

  trackBtn.addEventListener('click', runTrack);
  plateInput.addEventListener('keydown', e => { if (e.key === 'Enter') runTrack(); });

  // Initial stepper fill
  updateStepper(2);

  // Auto-restore state on load
  const urlParams = new URLSearchParams(window.location.search);
  const trackParam = urlParams.get('track');
  const storedPlate = sessionStorage.getItem('royal_tracking_plate');
  if (trackParam || storedPlate) {
    plateInput.value = trackParam || storedPlate;
    runTrack();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. BEFORE / AFTER SLIDER
// ─────────────────────────────────────────────────────────────────────────────

function initBeforeAfter() {
  const container = qs('#ba-container');
  const afterEl   = qs('#ba-after', container);
  const handle    = qs('#ba-handle', container);
  if (!container || !afterEl || !handle) return;

  let isDragging = false;
  let currentPct = 50;

  function setPos(pct) {
    currentPct = clamp(pct, 2, 98);
    afterEl.style.clipPath = `polygon(${currentPct}% 0, 100% 0, 100% 100%, ${currentPct}% 100%)`;
    handle.style.left   = `${currentPct}%`;
    handle.setAttribute('aria-valuenow', Math.round(currentPct));
  }

  function getPercent(clientX) {
    const rect = container.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  // Mouse
  container.addEventListener('mousedown', e => {
    isDragging = true;
    setPos(getPercent(e.clientX));
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    setPos(getPercent(e.clientX));
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  // Touch
  container.addEventListener('touchstart', e => {
    isDragging = true;
    setPos(getPercent(e.touches[0].clientX));
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    setPos(getPercent(e.touches[0].clientX));
  }, { passive: true });

  window.addEventListener('touchend', () => { isDragging = false; });

  // Keyboard
  handle.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  setPos(currentPct - 2);
    if (e.key === 'ArrowRight') setPos(currentPct + 2);
  });

  // Animate in on reveal
  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      gsap.from(currentPct, {
        duration: 1.2,
        ease: 'power3.out',
        onUpdate: function() {
          // Auto-sweep from 10% to 50%
        }
      });
      // Auto-demo sweep
      let dir = -1;
      let sweepVal = 50;
      const sweepId = setInterval(() => {
        sweepVal += dir * 0.6;
        if (sweepVal <= 20) { dir = 1; clearTimeout(sweepId); return; }
        setPos(sweepVal);
        if (sweepVal <= 20) clearInterval(sweepId);
      }, 16);
      setTimeout(() => clearInterval(sweepId), 1800);

      observer.disconnect();
    }
  }, { threshold: 0.3 });

  observer.observe(container);

  setPos(50);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. TESTIMONIALS CAROUSEL
// ─────────────────────────────────────────────────────────────────────────────

function initTestimonials() {
  const track   = qs('#testimonials-track');
  const prevBtn = qs('#testi-prev');
  const nextBtn = qs('#testi-next');
  const dotsWrap = qs('#testi-dots');
  if (!track || !dotsWrap) return;

  const cards = qsa('.testi-card', track);
  let current = 0;
  let autoId;

  // How many visible at once
  function visibleCount() {
    if (window.innerWidth <= 640) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  const total = cards.length;

  // Build dots
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    const pages = Math.ceil(total / visibleCount());
    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.className = `testi-dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to testimonial page ${i + 1}`);
      dot.addEventListener('click', () => goTo(i * visibleCount()));
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsWrap) return;
    const dots = qsa('.testi-dot', dotsWrap);
    const page = Math.floor(current / visibleCount());
    dots.forEach((d, i) => d.classList.toggle('active', i === page));
  }

  function goTo(idx) {
    current = clamp(idx, 0, total - visibleCount());
    const cardWidth = cards[0].offsetWidth + 24; // gap = 1.5rem = 24px
    gsap.to(track, {
      x: -(current * cardWidth),
      duration: 0.55,
      ease: 'power3.out',
    });
    updateDots();
  }

  function next() { goTo(current + visibleCount()); }
  function prev() { goTo(current - visibleCount()); }

  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetAuto(); });

  function startAuto() {
    autoId = setInterval(() => {
      if (current + visibleCount() >= total) {
        goTo(0);
      } else {
        next();
      }
    }, 5000);
  }

  function resetAuto() {
    clearInterval(autoId);
    startAuto();
  }

  // Touch swipe
  let touchStartX = 0;
  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      dx < 0 ? next() : prev();
      resetAuto();
    }
  }, { passive: true });

  // Initial setup
  track.style.display = 'flex';
  track.style.willChange = 'transform';

  buildDots();
  startAuto();

  // Rebuild on resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      current = 0;
      gsap.set(track, { x: 0 });
      buildDots();
    }, 200);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. SLOT BOOKING SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

// Simulated already-booked slots per day-of-week index [0=Sun...6=Sat]
// Each entry = "HH:MM" 24h format
const BOOKED_SLOTS_BY_DOW = {
  0: ['09:00','10:00','11:30','14:00','16:00'],
  1: ['08:00','09:30','11:00','14:30','17:00','18:30'],
  2: ['08:30','10:30','13:00','15:30','17:30'],
  3: ['09:00','12:00','14:00','16:30','18:00','19:00'],
  4: ['08:00','09:00','10:00','12:30','15:00','17:30'],
  5: ['08:00','09:00','09:30','10:00','11:00','13:00','14:00','15:00','16:00','17:00'],
  6: ['09:30','11:30','14:30','16:30','18:00'],
};
const LIMITED_SLOTS_BY_DOW = {
  0: ['11:00','15:00'],
  1: ['12:00','16:00'],
  2: ['12:00','14:30','19:00'],
  3: ['10:00','15:00'],
  4: ['11:30','14:00','18:00'],
  5: ['11:30','12:00','15:30','16:30'],
  6: ['10:00','13:00','17:30'],
};

const SERVICE_LABELS = {
  foam:      'Express Snow Foam Wash',
  exec:      'Royal Executive Detail',
  ceramic:   '9H Ceramic Shield Coating',
  underbody: 'Underbody Hydro Anti-Rust',
  bike:      'Superbike Foam & Polish',
  engine:    'Engine Bay Steam Clean',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

let bookingState = {
  date: null,          // Date object
  service: null,       // string key
  serviceDuration: 45, // minutes
  slot: null,          // "HH:MM"
  currentPanel: 1,
};

function openModal() {
  const modal    = qs('#booking-modal');
  const backdrop = qs('#modal-backdrop');
  if (!modal) return;
  modal.classList.add('active');
  if (backdrop) backdrop.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const first = modal.querySelector('input');
    if (first) first.focus();
  }, 300);
}

function closeModal() {
  const modal    = qs('#booking-modal');
  const backdrop = qs('#modal-backdrop');
  if (!modal) return;
  modal.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function goToPanel(n) {
  // Hide all panels
  qsa('.booking-panel').forEach(p => p.classList.remove('active'));
  // Show target
  const target = qs(`#panel-${n}`);
  if (target) target.classList.add('active');
  bookingState.currentPanel = n;

  // Update step indicators
  for (let i = 1; i <= 4; i++) {
    const step = qs(`#bstep-${i}`);
    const conn = qs(`.bs-connector:nth-of-type(${i})`); // approximate
    if (!step) continue;
    step.classList.remove('active', 'done');
    if (i === n) step.classList.add('active');
    if (i < n)  step.classList.add('done');
  }

  // Update connectors
  const connectors = qsa('.bs-connector');
  connectors.forEach((c, idx) => {
    c.classList.toggle('done', idx + 1 < n);
  });

  // Scroll modal to top
  const content = qs('.modal-content');
  if (content) content.scrollTop = 0;

  // If moving to slot panel, re-render slots
  if (n === 3 && bookingState.date) renderSlots(bookingState.date);
}

function buildDateStrip() {
  const strip = qs('#date-strip');
  if (!strip) return;

  const today = new Date();
  today.setHours(0,0,0,0);
  strip.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const card = document.createElement('div');
    card.className = 'date-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Select ${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`);

    const todayTag = i === 0 ? `<span class="dc-today">TODAY</span>` : '';

    card.innerHTML = `
      <span class="dc-day">${DAYS[d.getDay()]}</span>
      <span class="dc-num">${String(d.getDate()).padStart(2,'0')}</span>
      <span class="dc-month">${MONTHS[d.getMonth()]}</span>
      ${todayTag}
    `;

    card.addEventListener('click', () => selectDate(d, card));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectDate(d, card); });

    strip.appendChild(card);

    // Auto-select today
    if (i === 0) selectDate(d, card);
  }
}

function selectDate(date, cardEl) {
  bookingState.date = date;
  bookingState.slot = null;

  // Update card UI
  qsa('.date-card').forEach(c => c.classList.remove('selected'));
  cardEl.classList.add('selected');

  // Enable next button
  const nextBtn = qs('#next-to-2');
  if (nextBtn) nextBtn.disabled = false;

  // If on slot panel, re-render
  if (bookingState.currentPanel === 3) renderSlots(date);
}

function renderSlots(date) {
  const container = qs('#slot-groups');
  const label     = qs('#slot-date-label');
  if (!container) return;

  const dow = date.getDay();
  const bookedSet  = new Set(BOOKED_SLOTS_BY_DOW[dow]  || []);
  const limitedSet = new Set(LIMITED_SLOTS_BY_DOW[dow] || []);

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  // Update label
  if (label) {
    label.textContent = `Slots for ${DAYS[dow]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  }

  // Generate all 30-min slots from 8:00 to 20:30
  const groups = [
    { 
      label: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v6"/><path d="M4.93 10.93l4.24 4.24"/><path d="M2 18h20"/><path d="M20 10h-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg> Morning (8 AM – 12 PM)`, 
      slots: [] 
    },
    { 
      label: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg> Afternoon (12 PM – 5 PM)`, 
      slots: [] 
    },
    { 
      label: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10V2"/><path d="m4.93 10.93 4.24 4.24"/><path d="M2 18h20"/><path d="M20 10h-4"/><path d="M12 18a4 4 0 0 0 4-4 4 4 0 0 0-8 0"/></svg> Evening (5 PM – 8:30 PM)`, 
      slots: [] 
    },
  ];

  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 20 && m > 30) break;
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const key = `${hh}:${mm}`;

      const slotDate = new Date(date);
      slotDate.setHours(h, m, 0, 0);

      let state = 'available';
      if (bookedSet.has(key))  state = 'booked';
      if (limitedSet.has(key)) state = 'limited';
      if (isToday && slotDate <= now) state = 'past';

      const display12 = h > 12
        ? `${h - 12}:${mm} PM`
        : h === 12
        ? `12:${mm} PM`
        : `${h}:${mm} AM`;

      const slot = { key, display: display12, state };

      if (h < 12)       groups[0].slots.push(slot);
      else if (h < 17)  groups[1].slots.push(slot);
      else              groups[2].slots.push(slot);
    }
  }

  container.innerHTML = '';

  groups.forEach(group => {
    if (!group.slots.length) return;

    const groupEl = document.createElement('div');
    groupEl.className = 'slot-group';

    const lbl = document.createElement('div');
    lbl.className = 'slot-group-label';
    lbl.innerHTML = group.label;
    groupEl.appendChild(lbl);

    const grid = document.createElement('div');
    grid.className = 'slot-grid';

    group.slots.forEach(s => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `slot-btn ${s.state}`;
      btn.disabled = s.state === 'booked' || s.state === 'past';
      btn.setAttribute('aria-label', `${s.display} - ${s.state}`);

      let inner = s.display;
      if (s.state === 'booked') inner += ' — BOOKED';
      if (s.state === 'limited') {
        inner += `<span class="slot-limited-tag">1 LEFT</span>`;
      }
      btn.innerHTML = inner;

      // Was it already selected?
      if (bookingState.slot === s.key) {
        btn.classList.add('selected');
      }

      if (s.state !== 'booked' && s.state !== 'past') {
        btn.addEventListener('click', () => selectSlot(s.key, s.display, btn));
      }

      grid.appendChild(btn);
    });

    groupEl.appendChild(grid);
    container.appendChild(groupEl);
  });
}

function selectSlot(key, display, btnEl) {
  bookingState.slot = key;

  // Update UI
  qsa('.slot-btn').forEach(b => b.classList.remove('selected'));
  btnEl.classList.add('selected');

  // Show selected bar
  const bar  = qs('#selected-slot-bar');
  const text = qs('#selected-slot-text');
  if (bar)  bar.style.display = 'flex';
  if (text) text.textContent = display;

  // Enable next
  const nextBtn = qs('#next-to-4');
  if (nextBtn) nextBtn.disabled = false;
}

function updateSummaryCard() {
  const d = bookingState.date;
  const summaryDate = qs('#summary-date');
  const summaryTime = qs('#summary-time');
  const summarySvc  = qs('#summary-service');

  if (d && summaryDate) {
    summaryDate.textContent = `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  if (bookingState.slot && summaryTime) {
    const [h, m] = bookingState.slot.split(':').map(Number);
    const display = h > 12 ? `${h-12}:${String(m).padStart(2,'0')} PM`
                  : h === 12 ? `12:${String(m).padStart(2,'0')} PM`
                  : `${h}:${String(m).padStart(2,'0')} AM`;
    summaryTime.textContent = display;
  }
  if (bookingState.service && summarySvc) {
    summarySvc.textContent = SERVICE_LABELS[bookingState.service] || bookingState.service;
  }
}

function initModal() {
  // Open triggers
  qsa('.trigger-booking').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      resetBookingFlow();
      openModal();
    });
  });

  // Close
  const closeBtn = qs('#modal-close');
  const backdrop = qs('#modal-backdrop');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  // Build date strip
  buildDateStrip();

  // Next buttons
  qsa('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = parseInt(btn.dataset.next, 10);
      if (next === 4) updateSummaryCard();
      goToPanel(next);
    });
  });

  // Back buttons
  qsa('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
      const back = parseInt(btn.dataset.back, 10);
      goToPanel(back);
    });
  });

  // Phone input auto-lookup
  const phoneInput = qs('#bf-phone');
  if (phoneInput) {
    let lookupTimeout = null;
    const performLookup = async () => {
      const rawVal = phoneInput.value.trim();
      const cleanDigits = rawVal.replace(/\D/g, '');
      const badge = qs('#customer-auto-recognize-badge');
      const historySec = qs('#customer-history-section');
      const nameInput = qs('#bf-name');

      if (cleanDigits.length < 7) {
        if (badge) badge.style.display = 'none';
        if (historySec) historySec.style.display = 'none';
        return;
      }

      try {
        const apiBase = import.meta.env.VITE_API_URL || 'https://royal-carwash.onrender.com';
        const res = await fetch(`${apiBase}/api/customer/lookup?phone=${encodeURIComponent(rawVal)}`);
        const data = await res.json();
        if (data.success && data.data && data.data.found) {
          const cust = data.data;
          if (nameInput && cust.name) {
            nameInput.value = cust.name;
          }
          if (badge) {
            qs('#recognized-cust-name').textContent = cust.name || 'Valued Customer';
            badge.style.display = 'flex';
          }
          if (historySec && cust.orders && cust.orders.length > 0) {
            const historyList = qs('#customer-history-list');
            const countBadge = qs('#cust-order-count-badge');
            if (countBadge) countBadge.textContent = `${cust.orders.length} Visit${cust.orders.length > 1 ? 's' : ''}`;
            
            historyList.innerHTML = cust.orders.map(o => `
              <div style="background:#fff; border:1px solid #cbd5e1; border-radius:8px; padding:0.75rem; display:flex; justify-content:space-between; align-items:center; gap:0.5rem">
                <div>
                  <div style="font-weight:700; font-size:0.85rem; color:#0f172a">${o.service}</div>
                  <div style="font-size:0.75rem; color:#64748b">${o.date} • <span style="font-weight:700; color:#0f172a">${o.plate}</span></div>
                  <div style="font-size:0.75rem; font-weight:800; color:#10b981">₹${o.amount}</div>
                </div>
                <div style="display:flex; gap:0.4rem; align-items:center">
                  ${o.before_photo || o.after_photo ? `
                    <button type="button" class="btn-secondary btn-view-cust-photos" data-before="${o.before_photo || ''}" data-after="${o.after_photo || ''}" data-title="${o.service} (${o.plate})" style="padding:0.35rem 0.6rem; font-size:0.75rem; font-weight:700; border-color:#cbd5e1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block;margin-right:4px;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>View Photos
                    </button>
                  ` : '<span style="font-size:0.7rem; color:#94a3b8">No photos</span>'}
                </div>
              </div>
            `).join('');
            
            historySec.style.display = 'block';

            // Attach click listener for photo lightbox buttons
            historyList.querySelectorAll('.btn-view-cust-photos').forEach(btn => {
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                openCustPhotoLightbox(btn.dataset.title, btn.dataset.before, btn.dataset.after);
              });
            });
          } else if (historySec) {
            historySec.style.display = 'none';
          }
        } else {
          if (badge) badge.style.display = 'none';
          if (historySec) historySec.style.display = 'none';
        }
      } catch (err) {
        console.warn('Customer lookup error:', err);
      }
    };

    phoneInput.addEventListener('input', () => {
      clearTimeout(lookupTimeout);
      lookupTimeout = setTimeout(performLookup, 400);
    });
    phoneInput.addEventListener('blur', performLookup);
  }

  function openCustPhotoLightbox(title, beforeUrl, afterUrl) {
    const modal = qs('#cust-photo-lightbox-modal');
    if (!modal) return;
    qs('#cust-lightbox-title').textContent = `Photos: ${title}`;
    
    const beforeWrap = qs('#cust-lightbox-before-wrap');
    const afterWrap = qs('#cust-lightbox-after-wrap');

    if (beforeUrl) {
      beforeWrap.innerHTML = `<img src="${beforeUrl}" style="max-width:100%; max-height:220px; border-radius:8px; object-fit:cover; border:1px solid #475569">`;
    } else {
      beforeWrap.innerHTML = `<span style="color:#64748b; font-size:0.8rem">No Before photo uploaded</span>`;
    }

    if (afterUrl) {
      afterWrap.innerHTML = `<img src="${afterUrl}" style="max-width:100%; max-height:220px; border-radius:8px; object-fit:cover; border:1px solid #475569">`;
    } else {
      afterWrap.innerHTML = `<span style="color:#64748b; font-size:0.8rem">No After photo uploaded</span>`;
    }

    modal.style.display = 'flex';
  }

  // Close lightbox listeners
  const closeCustLbBtn = qs('#btn-close-cust-lightbox');
  const bgCustLbOverlay = qs('#cust-lightbox-bg-overlay');
  if (closeCustLbBtn) closeCustLbBtn.addEventListener('click', () => { const m = qs('#cust-photo-lightbox-modal'); if(m) m.style.display = 'none'; });
  if (bgCustLbOverlay) bgCustLbOverlay.addEventListener('click', () => { const m = qs('#cust-photo-lightbox-modal'); if(m) m.style.display = 'none'; });

  // Service radio buttons
  qsa('input[name="bk-service"]').forEach(radio => {
    radio.addEventListener('change', () => {
      bookingState.service = radio.value;
      bookingState.serviceDuration = parseInt(radio.dataset.dur, 10) || 45;
      const nextBtn = qs('#next-to-3');
      if (nextBtn) nextBtn.disabled = false;
    });
  });

  // Form submit
  const form = qs('#booking-form');
  if (form) {
      form.addEventListener('submit', async e => {
      e.preventDefault();
      const name  = qs('#bf-name')?.value?.trim();
      const phone = qs('#bf-phone')?.value?.trim();
      const plate = qs('#bf-plate')?.value?.trim() || 'TN 00 XX 0000';
      if (!name || !phone) {
        showToast('Please enter your name and phone number.');
        return;
      }
      if (!bookingState.service) {
        showToast('Please select a service.');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Confirming...'; }

      try {
        const apiBase = import.meta.env.VITE_API_URL || 'https://royal-carwash.onrender.com';
        const res = await fetch(`${apiBase}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: name,
            customer_phone: phone,
            plate_number: plate,
            service_id: bookingState.service,
            service_name: SERVICE_LABELS[bookingState.service] || bookingState.service,
            price: { foam: 349, exec: 899, ceramic: 4999, underbody: 699, bike: 249, engine: 599 }[bookingState.service] || 349,
            booking_date: bookingState.date?.toISOString().split('T')[0],
            slot_time: bookingState.slot || '10:00 AM',
            notes: qs('#bf-notes')?.value?.trim() || '',
            whatsapp_notify: true,
          })
        });
        const result = await res.json();
        if (result.success) {
          closeModal();
          form.reset();
          resetBookingFlow();
          showToast('\u2705 Booking confirmed! We\'ll WhatsApp you the details shortly.');
        } else {
          showToast('Booking failed: ' + (result.error || 'Please try again.'));
        }
      } catch (err) {
        // Fallback: still confirm locally if backend unavailable
        closeModal();
        form.reset();
        resetBookingFlow();
        showToast('\u2705 Slot noted! Call us at +91 98765 43210 to confirm.');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Confirm Booking'; }
      }
    });
  }
}

function resetBookingFlow() {
  bookingState = { date: null, service: null, serviceDuration: 45, slot: null, currentPanel: 1 };
  goToPanel(1);
  buildDateStrip();
  // Reset service radios
  qsa('input[name="bk-service"]').forEach(r => r.checked = false);
  // Disable next buttons that require selection
  const n2 = qs('#next-to-2'); if (n2) n2.disabled = true;
  const n3 = qs('#next-to-3'); if (n3) n3.disabled = true;
  const n4 = qs('#next-to-4'); if (n4) n4.disabled = true;
  const bar = qs('#selected-slot-bar'); if (bar) bar.style.display = 'none';
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. TOAST NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

function showToast(message) {
  let toast = qs('#app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = `
      <div class="toast-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span id="toast-msg"></span>
    `;
    document.body.appendChild(toast);
  }

  qs('#toast-msg', toast).textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. SPIN KEYFRAME for tracker loader
// ─────────────────────────────────────────────────────────────────────────────

function injectSpinStyle() {
  const style = document.createElement('style');
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. SET MINIMUM DATETIME for booking form
// ─────────────────────────────────────────────────────────────────────────────

function initDatetimeInputs() {
  const dateInputs = qsa('input[type="datetime-local"]');
  const now = new Date();
  // Add 1 hour buffer, round to 30-min slot
  now.setMinutes(now.getMinutes() > 30 ? 60 : 30, 0, 0);
  if (now.getMinutes() === 0) now.setHours(now.getHours() + 1);
  const isoMin = now.toISOString().slice(0, 16);
  dateInputs.forEach(inp => {
    inp.min = isoMin;
    if (!inp.value) inp.value = isoMin;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initVideoIntro();
  injectSpinStyle();
  initHeader();
  initParticles();
  initHeroAnimation();
  initScrollReveals();
  initCounters();
  initTracker();
  initBeforeAfter();
  initTestimonials();
  initModal();
  initDatetimeInputs();
  initAdminPortal();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerH = qs('#site-header')?.offsetHeight || 75;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
});
