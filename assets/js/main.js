/* =========================================================
   Shared site script — works on every page.
   Each block checks that its elements exist before running.
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

$$('.year').forEach((el) => (el.textContent = new Date().getFullYear()));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
const animate = hasGsap && !reduceMotion;
const isDesktop = () => window.innerWidth > 991;

if (!animate) document.documentElement.classList.remove('js'); // show everything without animation

/* ===== Smooth scroll (Lenis) ===== */
let lenis = null;
if (animate) {
  gsap.registerPlugin(ScrollTrigger);
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
}
const lockScroll = (on) => {
  document.body.classList.toggle('no-scroll', on);
  if (lenis) on ? lenis.stop() : lenis.start();
};

/* ===== Nav ===== */
const nav = $('#nav');
const toggle = $('.nav-toggle');
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav.classList.toggle('is-scrolled', y > 10);
  const busy = nav.classList.contains('is-open') || nav.classList.contains('mega-open');
  nav.classList.toggle('is-hidden', y > lastY && y > 300 && !busy);
  lastY = y;
}, { passive: true });

toggle.addEventListener('click', () => {
  const open = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open);
  if (!open) setMega(false);
});

/* ===== Mega menu ===== */
const megaTrigger = $('.mega-trigger');
const hasMega = $('.has-mega');
const overlay = document.createElement('div');
overlay.className = 'mega-overlay';
document.body.appendChild(overlay);
let closeTimer;

function setMega(open) {
  if (!megaTrigger) return;
  nav.classList.toggle('mega-open', open);
  megaTrigger.setAttribute('aria-expanded', open);
  document.body.classList.toggle('mega-is-open', open && isDesktop());
}
if (megaTrigger) {
  // Desktop: open on hover (short delay before closing); click also toggles
  hasMega.addEventListener('mouseenter', () => { if (isDesktop()) { clearTimeout(closeTimer); setMega(true); } });
  hasMega.addEventListener('mouseleave', () => { if (isDesktop()) closeTimer = setTimeout(() => setMega(false), 180); });
  megaTrigger.addEventListener('click', () => setMega(!nav.classList.contains('mega-open')));
  overlay.addEventListener('click', () => setMega(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('mega-open')) { setMega(false); megaTrigger.focus(); }
  });
  hasMega.addEventListener('focusout', (e) => { if (isDesktop() && !hasMega.contains(e.relatedTarget)) setMega(false); });
  let lastW = innerWidth;
  window.addEventListener('resize', () => { if (innerWidth !== lastW) { lastW = innerWidth; setMega(false); } });
}

/* ===== Same-page anchor links scroll smoothly ===== */
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id.length > 1 && $(id);
    if (!target) return;
    e.preventDefault();
    nav.classList.remove('is-open');
    lenis ? lenis.scrollTo(target, { offset: -80 }) : target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ===== GSAP animations ===== */
if (animate) {
  // Split headings: each line slides up from a mask
  $$('[data-split]').forEach((h) => {
    gsap.from($$('.line > span', h), {
      yPercent: 110, duration: 1.1, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: h, start: 'top 90%' },
    });
  });

  // Fade-up reveals, staggered when siblings enter together
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 95%',
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power2.out', stagger: 0.1 }),
  });

  // Parallax images
  $$('[data-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // Count-up numbers
  $$('[data-count]').forEach((el) => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: +el.dataset.count, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 95%' },
      onUpdate: () => (el.textContent = Math.round(obj.v)),
    });
  });

  // Marquee (infinite loop, speeds up while scrolling)
  const track = $('.marquee-track');
  if (track) {
    track.innerHTML += track.innerHTML;
    const loop = gsap.to(track, { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      onUpdate: (self) => {
        gsap.to(loop, { timeScale: 1 + Math.min(Math.abs(self.getVelocity()) / 300, 4), duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: 1, duration: 1, delay: 0.2 });
      },
    });
  }

  // Button text roll on hover
  $$('.btn').forEach((btn) => {
    const spans = $$('.btn-roll span', btn);
    if (!spans.length) return;
    btn.addEventListener('mouseenter', () => gsap.to(spans, { yPercent: -100, duration: 0.35, ease: 'power2.out' }));
    btn.addEventListener('mouseleave', () => gsap.to(spans, { yPercent: 0, duration: 0.3, ease: 'power2.out' }));
  });
} else {
  $$('[data-count]').forEach((el) => (el.textContent = el.dataset.count));
}

/* ===== Before / After sliders ===== */
$$('.ba').forEach((ba) => {
  const after = $('.ba-after', ba);
  const handle = $('.ba-handle', ba);
  let dragging = false;
  const set = (pct) => {
    pct = Math.max(0, Math.min(100, pct));
    after.style.clipPath = `inset(0 0 0 ${pct}%)`;
    handle.style.left = pct + '%';
    handle.setAttribute('aria-valuenow', Math.round(pct));
  };
  const fromEvent = (e) => {
    const r = ba.getBoundingClientRect();
    set(((e.clientX - r.left) / r.width) * 100);
  };
  ba.addEventListener('pointerdown', (e) => { dragging = true; ba.setPointerCapture(e.pointerId); fromEvent(e); });
  ba.addEventListener('pointermove', (e) => dragging && fromEvent(e));
  ba.addEventListener('pointerup', () => (dragging = false));
  handle.addEventListener('keydown', (e) => {
    const now = +handle.getAttribute('aria-valuenow');
    if (e.key === 'ArrowLeft') set(now - 5);
    if (e.key === 'ArrowRight') set(now + 5);
  });
});

/* ===== Testimonials slider ===== */
(() => {
  const track = $('#testiTrack');
  if (!track) return;
  const cards = track.children;
  let index = 0;
  const perView = () => (innerWidth < 768 ? 1 : innerWidth < 1200 ? 2 : 3);
  const go = (i) => {
    index = Math.max(0, Math.min(cards.length - perView(), i));
    const x = cards[index].offsetLeft - cards[0].offsetLeft;
    hasGsap ? gsap.to(track, { x: -x, duration: 0.8, ease: 'power3.out' }) : (track.style.transform = `translateX(${-x}px)`);
  };
  $('#next').addEventListener('click', () => go(index + 1));
  $('#prev').addEventListener('click', () => go(index - 1));
  addEventListener('resize', () => go(index));
})();

/* ===== FAQ accordion ===== */
const setHeight = (el, h, done) =>
  hasGsap ? gsap.to(el, { height: h, duration: 0.45, ease: 'power2.out', onComplete: done }) : ((el.style.height = h + 'px'), done && done());
$$('.faq-item').forEach((item) => {
  const q = $('.faq-q', item);
  const a = $('.faq-a', item);
  q.addEventListener('click', () => {
    const open = !item.classList.contains('is-open');
    $$('.faq-item.is-open', item.parentElement).forEach((o) => {
      if (o === item) return;
      o.classList.remove('is-open');
      $('.faq-q', o).setAttribute('aria-expanded', 'false');
      setHeight($('.faq-a', o), 0);
    });
    item.classList.toggle('is-open', open);
    q.setAttribute('aria-expanded', open);
    setHeight(a, open ? a.scrollHeight : 0, () => animate && ScrollTrigger.refresh());
  });
});

/* ===== Category filters (services page, blog page) ===== */
$$('[data-filter-grid]').forEach((grid) => {
  const section = grid.closest('section');
  const btns = $$('.filter-btn', section);
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((x) => x.classList.toggle('is-active', x === b));
    const f = b.dataset.filter;
    const items = [...grid.children];
    items.forEach((c) => c.classList.toggle('is-hidden', !(f === 'all' || c.dataset.cat === f)));
    const shown = items.filter((c) => !c.classList.contains('is-hidden') && !c.classList.contains('is-more'));
    if (hasGsap) gsap.fromTo(shown, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: 'power2.out' });
    if (animate) ScrollTrigger.refresh();
  }));
});

/* ===== Blog: load more ===== */
(() => {
  const btn = $('#loadMore');
  if (!btn) return;
  const grid = $('.posts-grid[data-filter-grid]');
  const PAGE = 6;
  [...grid.children].forEach((c, i) => i >= PAGE && c.classList.add('is-more'));
  const wrap = btn.closest('.load-more');
  if (grid.children.length <= PAGE) wrap.classList.add('is-done');
  btn.addEventListener('click', () => {
    const more = $$('.is-more', grid).slice(0, PAGE);
    more.forEach((c) => c.classList.remove('is-more'));
    if (hasGsap) gsap.fromTo(more, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' });
    if (!$('.is-more', grid)) wrap.classList.add('is-done');
    if (animate) ScrollTrigger.refresh();
  });
})();

/* ===== Newsletter (front-end only) ===== */
$$('.newsletter-form').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('input', form);
    const ok = input.checkValidity() && input.value.trim();
    $('.nl-row', form).classList.toggle('has-error', !ok);
    if (!ok) return input.focus();
    // replace with your email-service signup request
    $('.nl-row', form).hidden = true;
    $('.nl-msg', form).hidden = false;
  });
});

/* ===== Single post: reading progress, table of contents, share ===== */
(() => {
  const bar = $('.read-progress span');
  const prose = $('.prose');
  if (bar && prose) {
    const update = () => {
      const r = prose.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight * 0.6)));
      bar.style.transform = `scaleX(${p})`;
    };
    addEventListener('scroll', update, { passive: true });
    update();
  }
  const tocLinks = $$('.toc a');
  if (tocLinks.length) {
    const targets = tocLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
    const spy = () => {
      let current = targets[0];
      targets.forEach((t) => { if (t.getBoundingClientRect().top < innerHeight * 0.35) current = t; });
      tocLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + current.id));
    };
    addEventListener('scroll', spy, { passive: true });
    spy();
  }
  const url = encodeURIComponent(location.href);
  const title = encodeURIComponent(document.title);
  const shareUrls = {
    x: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
    fb: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    in: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
  };
  $$('[data-share]').forEach((a) => {
    a.href = shareUrls[a.dataset.share];
    a.target = '_blank';
    a.rel = 'noopener';
  });
  const copy = $('[data-copy]');
  if (copy) copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); } catch (e) { /* clipboard blocked */ }
    const msg = $('.copy-msg');
    msg.hidden = false;
    setTimeout(() => (msg.hidden = true), 1800);
  });
})();

/* ===== Pricing: monthly / yearly toggle ===== */
(() => {
  const sw = $('.switch');
  if (!sw) return;
  const setPeriod = (yearly) => {
    sw.setAttribute('aria-checked', yearly);
    $$('.bt-label').forEach((l) => l.classList.toggle('is-active', (l.dataset.period === 'year') === yearly));
    const key = yearly ? 'year' : 'month';
    $$('.plan-price .amt').forEach((el) => {
      const to = +el.dataset[key];
      if (hasGsap) {
        const obj = { v: +el.textContent.replace(/,/g, '') };
        gsap.to(obj, { v: to, duration: 0.6, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString('en-US')) });
      } else el.textContent = to.toLocaleString('en-US');
    });
    $$('.plan-price .per').forEach((el) => (el.textContent = el.dataset[key]));
  };
  sw.addEventListener('click', () => setPeriod(sw.getAttribute('aria-checked') !== 'true'));
  $$('.bt-label').forEach((l) => l.addEventListener('click', () => setPeriod(l.dataset.period === 'year')));
})();

/* ===== Doctor profile modal (doctors page) ===== */
(() => {
  const modal = $('#docModal');
  if (!modal) return;
  const body = $('.modal-body', modal);
  const img = $('.modal-img', modal);
  let lastFocus;
  const open = (card) => {
    lastFocus = card;
    body.innerHTML = '';
    body.appendChild($('template', card).content.cloneNode(true));
    const src = $('.photo img', card);
    img.src = src.src; img.alt = src.alt;
    img.classList.toggle('is-placeholder', src.classList.contains('is-placeholder'));
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll(true);
    $('.modal-close', modal).focus();
  };
  const close = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    lockScroll(false);
    lastFocus && lastFocus.focus();
  };
  $$('.doc-card').forEach((c) => c.addEventListener('click', () => open(c)));
  $$('[data-close]', modal).forEach((el) => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && modal.classList.contains('is-open') && close());
})();

/* ===== Contact form validation (contact page) =====
   Front-end only. Connect it to your backend, Formspree, Netlify Forms, etc.
   by replacing the "send" part below. */
(() => {
  const form = $('#contactForm');
  if (!form) return;
  const check = (input) => {
    const wrap = input.closest('.field, .check');
    const ok = input.checkValidity();
    wrap && wrap.classList.toggle('has-error', !ok);
    return ok;
  };
  $$('input, select, textarea', form).forEach((i) => {
    i.addEventListener('blur', () => i.required && check(i));
    i.addEventListener('input', () => i.closest('.has-error') && check(i));
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = $$('[required]', form);
    const valid = fields.map(check).every(Boolean);
    if (!valid) { fields.find((f) => !f.checkValidity()).focus(); return; }

    // ---- send: replace with fetch('/your-endpoint', { method: 'POST', body: new FormData(form) }) ----
    const success = $('.form-success', form);
    $$('.field, .check, .form-row, button[type=submit]', form).forEach((el) => (el.style.display = 'none'));
    success.hidden = false;
    if (hasGsap) gsap.from(success, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' });
  });
})();

/* ===== Fit footer wordmark to container width ===== */
const fitWordmark = () => {
  const w = $('.wordmark');
  if (!w) return;
  w.style.fontSize = '100px';
  w.style.width = 'max-content';
  const natural = w.getBoundingClientRect().width;
  w.style.width = '';
  w.style.fontSize = Math.floor(100 * (w.clientWidth / natural) * 0.95) + 'px';
  if (animate) ScrollTrigger.refresh();
};
document.fonts ? document.fonts.ready.then(fitWordmark) : fitWordmark();
addEventListener('resize', fitWordmark);

/* ===== "Pages" dropdown ===== */
$$('.has-drop').forEach((wrap) => {
  const trigger = $('.drop-trigger', wrap);
  let t;
  const set = (open) => { wrap.classList.toggle('is-open', open); trigger.setAttribute('aria-expanded', open); };
  // highlight the current page
  const here = location.pathname.split('/').pop() || 'index.html';
  $$('.drop a', wrap).forEach((a) => a.getAttribute('href') === here && a.classList.add('is-current'));
  wrap.addEventListener('mouseenter', () => { if (isDesktop()) { clearTimeout(t); set(true); } });
  wrap.addEventListener('mouseleave', () => { if (isDesktop()) t = setTimeout(() => set(false), 180); });
  trigger.addEventListener('click', () => set(!wrap.classList.contains('is-open')));
  document.addEventListener('click', (e) => { if (isDesktop() && !wrap.contains(e.target)) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && wrap.classList.contains('is-open')) { set(false); trigger.focus(); } });
  wrap.addEventListener('focusout', (e) => { if (isDesktop() && !wrap.contains(e.relatedTarget)) set(false); });
});

/* ===== Rich single service page (treatment cards, exam timeline, open status) ===== */
(() => {
  // Treatment cards: clip-path wipe in, then 3D tilt + cursor spotlight on desktop
  const cards = $$('[data-tx]');
  if (cards.length) {
    if (animate) {
      gsap.set(cards, { clipPath: 'inset(100% 0% 0% 0% round 22px)' });
      gsap.set(cards.map((c) => $('img', c)), { scale: 1.25 });
      ScrollTrigger.batch(cards, {
        start: 'top 90%',
        onEnter: (els) => {
          gsap.to(els, { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.2, ease: 'power4.out', stagger: 0.15 });
          gsap.to(els.map((c) => $('img', c)), { scale: 1, duration: 1.6, ease: 'power3.out', stagger: 0.15, clearProps: 'transform' });
        },
      });
    }
    if (animate && window.matchMedia('(hover: hover)').matches) {
      cards.forEach((card) => {
        const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
        const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
        gsap.set(card, { transformPerspective: 900 });
        card.addEventListener('pointermove', (e) => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          card.style.setProperty('--mx', x * 100 + '%');
          card.style.setProperty('--my', y * 100 + '%');
          ry((x - 0.5) * 10);
          rx((0.5 - y) * 10);
        });
        card.addEventListener('pointerleave', () => { rx(0); ry(0); });
      });
    }
  }

  // Exam timeline: line fills as you scroll, dots light up as the line reaches them
  const line = $('[data-exam]');
  if (line) {
    const items = $$('li', line);
    if (animate) {
      ScrollTrigger.create({
        trigger: line, start: 'top 70%', end: 'bottom 60%', scrub: true,
        onUpdate: (self) => {
          line.style.setProperty('--progress', self.progress.toFixed(3));
          items.forEach((li, i) => li.classList.toggle('is-lit', self.progress >= i / Math.max(items.length - 1, 1) - 0.02));
        },
      });
    } else {
      line.style.setProperty('--progress', 1);
      items.forEach((li) => li.classList.add('is-lit'));
    }
  }

  // Benefits checklist: ticks pop in one by one
  const checks = $$('.svc-checks li');
  if (checks.length && animate) {
    gsap.from(checks, {
      opacity: 0, x: -30, duration: 0.7, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: { trigger: checks[0].parentElement, start: 'top 85%' },
    });
  }

  // Hero image: soft zoom-out on load
  const heroImg = $('.svc-hero-media > img');
  if (heroImg && animate) {
    gsap.from(heroImg.parentElement, { clipPath: 'inset(12% 8% 0% 8% round 24px)', duration: 1.6, ease: 'power3.out', delay: 0.2 });
  }

  // "Open now" badge, based on clinic hours in Lahore (Mon–Sat, 10:00–21:00)
  const status = $('[data-open-status]');
  if (status) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', weekday: 'short', hour: 'numeric', hour12: false })
      .formatToParts(new Date());
    const day = parts.find((p) => p.type === 'weekday').value;
    const hour = +parts.find((p) => p.type === 'hour').value;
    const open = day !== 'Sun' && hour >= 10 && hour < 21;
    status.classList.toggle('is-open', open);
    $('.open-text', status).textContent = open ? 'Open now · until 9 pm' : 'Closed now · Mon–Sat 10 am – 9 pm';
  }
})();

/* ===== Tooth anatomy diagram: outline draws in, pulp fills, labels appear ===== */
(() => {
  const fig = $('[data-draw]');
  if (!fig || !animate) return;
  const lines = $$('.anat-line, .anat-gum', fig);
  lines.forEach((p) => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 });
  });
  const pulp = $('.anat-pulp', fig);
  const labels = $$('.anat-label', fig);
  gsap.set(pulp, { scaleY: 0, transformOrigin: '50% 0%' });
  gsap.set(labels, { opacity: 0, x: -8 });
  gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 75%' } })
    .to(lines, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.2 })
    .to(lines, { fillOpacity: 1, duration: 0.6 }, '-=0.4')
    .to(pulp, { scaleY: 1, duration: 1, ease: 'power3.out' }, '-=0.3')
    .to(labels, { opacity: 1, x: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out' }, '-=0.4')
    .add(() => $$('.anat-thin', fig).forEach((p) => gsap.set(p, { strokeDasharray: '4 5' })));
})();

/* ===== Teeth-straightening demo: crooked teeth line up as you scroll ===== */
(() => {
  const demo = $('[data-ortho]');
  if (!demo) return;
  const teeth = $$('.ortho-tooth', demo);
  const label = $('[data-ortho-label]', demo);
  const bar = $('[data-ortho-bar]', demo);
  const stages = ['Start', 'Month 3', 'Month 6', 'Month 9', 'Done'];
  if (!animate) { bar.style.transform = 'scaleX(1)'; label.textContent = 'Done'; return; }
  teeth.forEach((t) => gsap.set(t, { rotation: +t.dataset.rot, y: +t.dataset.dy, x: +t.dataset.dx, transformOrigin: '50% 50%' }));
  const tl = gsap.timeline({
    scrollTrigger: { trigger: demo, start: 'top 75%', end: 'bottom 35%', scrub: 0.6 },
    onUpdate: () => { label.textContent = stages[Math.min(stages.length - 1, Math.floor(tl.progress() * (stages.length - 1) + 0.05))]; },
  });
  tl
    .to(teeth, { rotation: 0, x: 0, y: 0, ease: 'power1.inOut', stagger: 0.04 }, 0)
    .to(bar, { scaleX: 1, ease: 'none', duration: 1 + 0.04 * (teeth.length - 1) }, 0);
})();

/* ===== Material comparison tabs: sliding pill, panel crossfade, dots fill in ===== */
(() => {
  const box = $('[data-mat]');
  if (!box) return;
  const tabs = $$('.mat-tab', box);
  const list = $('.mat-tabs', box);
  const fillDots = (panel) => {
    if (!animate) return;
    gsap.fromTo($$('.mat-dots i.on', panel), { scale: 0 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', stagger: 0.05 });
  };
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const panel = $('#' + t.getAttribute('aria-controls'));
      panel.hidden = !on;
      if (on && animate) {
        gsap.fromTo(panel, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        fillDots(panel);
      }
    });
    list.classList.toggle('is-second', tabs.indexOf(tab) === 1);
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); select(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true); }
    });
  });
  if (animate) ScrollTrigger.create({ trigger: box, start: 'top 75%', once: true, onEnter: () => fillDots($('.mat-panel:not([hidden])', box)) });
})();

/* ===== Recovery guide: slider swaps stage content and fills the ring ===== */
(() => {
  const box = $('[data-recovery]');
  if (!box) return;
  const stages = JSON.parse(box.dataset.recovery);
  const input = $('input[type="range"]', box);
  const ring = $('.recovery-ring-fill', box);
  const content = $('.recovery-content', box);
  const C = 2 * Math.PI * 52;
  let current = -1;
  const show = (i) => {
    const s = stages[i];
    input.style.setProperty('--fill', (i / (stages.length - 1)) * 100 + '%');
    input.setAttribute('aria-valuetext', s.t);
    ring.style.strokeDashoffset = C * (1 - (i + 1) / stages.length);
    if (i === current) return;
    const render = () => {
      $('[data-rec-step]', box).textContent = i + 1;
      $('[data-rec-time]', box).textContent = s.t;
      $('[data-rec-title]', box).textContent = s.s;
      const ul = $('[data-rec-tips]', box);
      ul.replaceChildren(...s.tips.map((tip) => Object.assign(document.createElement('li'), { textContent: tip })));
      if (animate) {
        gsap.fromTo(content, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', overwrite: true });
        gsap.from($$('li', ul), { opacity: 0, x: -14, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
      }
    };
    if (animate && current !== -1) gsap.to(content, { opacity: 0, y: -8, duration: 0.15, overwrite: true, onComplete: render });
    else render();
    current = i;
  };
  input.addEventListener('input', () => show(+input.value));
  show(0);
})();

/* ===== Newsletter popup: opens once the visitor scrolls 30% of the page ===== */
(() => {
  const pop = $('#nlPop');
  if (!pop) return;
  const KEY = 'ddNewsletter';
  const SNOOZE_DAYS = 7; // after closing, wait this long before showing again
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = (state) => { try { localStorage.setItem(KEY, JSON.stringify({ state, t: Date.now() })); } catch (e) { /* storage unavailable */ } };
  const saved = read();
  const forced = /[?&]newsletter\b/.test(location.search); // add ?newsletter to a URL to preview it
  const snoozed = saved.state === 'dismissed' && Date.now() - saved.t < SNOOZE_DAYS * 864e5;
  if (!forced && (saved.state === 'subscribed' || snoozed)) return;

  const panel = $('.nl-pop-panel', pop);
  const form = $('.nl-pop-form', pop);
  const input = $('input', form);
  let lastFocus = null;
  let loops = [];
  let isOpen = false;

  const drawIn = (paths, duration, delay) => paths.forEach((p) => {
    const len = p.getTotalLength();
    gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration, delay, ease: 'power2.inOut' });
  });

  function open() {
    if (isOpen) return;
    isOpen = true;
    lastFocus = document.activeElement;
    pop.hidden = false;
    document.body.classList.add('nl-open');
    lockScroll(true);
    $('.nl-pop-close', pop).focus({ preventScroll: true });
    if (!animate) return;

    const art = (s) => $(s, pop);
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(art('.nl-pop-backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.4 })
      .fromTo(panel, { opacity: 0, y: 60, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.8 }, 0.05)
      .fromTo(art('.nl-woman'), { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 1.1 }, 0.35)
      .fromTo(art('.nl-eyebrow'), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6 }, 0.45)
      .fromTo($$('.nl-title .line > span', pop), { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.12 }, 0.5)
      .fromTo([art('.nl-lead'), art('.nl-pop-row')], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 }, 0.75)
      .fromTo($$('.nl-features li', pop), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }, 1)
      .fromTo($$('.nl-feat-ico', pop), { scale: 0.4 }, { scale: 1, duration: 0.6, ease: 'back.out(2.5)', stagger: 0.1 }, 1.05)
      .fromTo(art('.nl-mail'), { opacity: 0, y: 70, rotation: -8, scale: 0.8 }, { opacity: 1, y: 0, rotation: 0, scale: 1, duration: 1, ease: 'back.out(1.6)' }, 0.6)
      .fromTo(art('.nl-plane'), { opacity: 0, x: -150, y: 170, rotation: -30, scale: 0.5 }, { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 1.3, ease: 'power2.out' }, 1.1);
    drawIn($$('.nl-arc-top path, .nl-wave path', pop), 1.6, 0.3);
    drawIn([art('.nl-plane-trail path')], 1.2, 1.1);
    tl.add(() => { // gentle idle motion after the entrance
      loops = [
        gsap.to(art('.nl-mail'), { y: -12, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
        gsap.to(art('.nl-plane'), { y: -8, rotation: 4, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 }),
      ];
      $$('.nl-plane-trail path', pop).forEach((p) => gsap.set(p, { strokeDasharray: '5 6', strokeDashoffset: 0 }));
    });
  }

  function close(state = 'dismissed') {
    if (!isOpen) return;
    isOpen = false;
    save(state);
    const done = () => {
      pop.hidden = true;
      document.body.classList.remove('nl-open');
      lockScroll(false);
      loops.forEach((l) => l.kill());
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    if (!animate) return done();
    gsap.to(panel, { opacity: 0, y: 30, scale: 0.96, duration: 0.35, ease: 'power2.in' });
    gsap.to($('.nl-pop-backdrop', pop), { opacity: 0, duration: 0.35, delay: 0.1, onComplete: done });
  }

  $$('[data-nl-close]', pop).forEach((el) => el.addEventListener('click', () => close()));
  pop.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const items = $$('button, input, a[href]', panel).filter((el) => !el.closest('[hidden]'));
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // Front-end only: connect this to your email service (Mailchimp, Brevo, etc.)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = input.checkValidity() && input.value.trim();
    $('.nl-pop-row', form).classList.toggle('has-error', !ok);
    $('.nl-pop-err', form).hidden = !!ok;
    if (!ok) return input.focus();
    $('.nl-pop-row', form).hidden = true;
    $('.nl-pop-ok', form).hidden = false;
    if (animate) gsap.from($('.nl-pop-ok', form), { opacity: 0, y: 10, duration: 0.5 });
    setTimeout(() => close('subscribed'), 2600);
  });

  if (forced) return open();
  const check = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max > 0 && scrollY / max >= 0.3) { window.removeEventListener('scroll', check); open(); }
  };
  window.addEventListener('scroll', check, { passive: true });
})();

/* ===== Home quick booking: opens WhatsApp with the request filled in ===== */
(() => {
  const form = $('#quickBook');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements;
    const name = f.name.value.trim();
    const phoneOk = f.phone.checkValidity() && f.phone.value.trim();
    f.name.classList.toggle('is-invalid', !name);
    f.phone.classList.toggle('is-invalid', !phoneOk);
    $('.qb-err', form).hidden = !!(name && phoneOk);
    if (!name || !phoneOk) return (name ? f.phone : f.name).focus();
    const lines = [
      'Hello Dentify Dental, I would like to book an appointment.',
      `Name: ${name}`,
      `Phone: ${f.phone.value.trim()}`,
      f.treatment.value && `Treatment: ${f.treatment.value}`,
      f.date.value && `Preferred date: ${f.date.value}`,
      f.time.value && `Preferred time: ${f.time.value}`,
    ].filter(Boolean);
    window.open('https://wa.me/923257766667?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
  });
})();

/* ===== Shade journey: slider (and a one-time scroll animation) brightens the teeth ===== */
(() => {
  const box = $('[data-shade]');
  if (!box) return;
  const input = $('input[type="range"]', box);
  const name = $('[data-shade-name]', box);
  const chips = $$('.shade-guide i', box);
  const stops = ['#E3C98F', '#EAD5A6', '#F0E1BF', '#F5ECD6', '#FAF6EC'];
  const labels = ['A3.5', 'A3', 'A2', 'A1', 'B1'];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => 'rgb(' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t)).join(',') + ')';
  const set = (v) => {
    const p = (v / 100) * (stops.length - 1);
    const i = Math.min(Math.floor(p), stops.length - 2);
    box.style.setProperty('--tooth', mix(stops[i], stops[i + 1], p - i));
    const idx = Math.round(p);
    name.textContent = labels[idx];
    chips.forEach((c, k) => c.classList.toggle('is-on', k === idx));
    input.style.setProperty('--fill', v + '%');
    input.setAttribute('aria-valuetext', 'Shade ' + labels[idx]);
    box.classList.toggle('is-bright', v >= 90);
  };
  let touched = false;
  input.addEventListener('input', () => { touched = true; set(+input.value); });
  set(0);
  if (animate) {
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: box, start: 'top 65%', once: true,
      onEnter: () => gsap.to(obj, { v: 100, duration: 2.6, ease: 'power2.inOut', delay: 0.3,
        onUpdate: () => { if (touched) return; input.value = obj.v; set(obj.v); } }),
    });
  }
})();

/* ===== How a veneer fits: scroll walks through prep, placement and bonding ===== */
(() => {
  const box = $('[data-vfit]');
  if (!box) return;
  const steps = $$('.vfit-steps li', box);
  const tag = $('[data-vfit-label]', box);
  const names = ['Natural tooth', 'Gentle preparation', 'Veneer placed', 'Bonded & polished'];
  const q = (s) => $(s, box);
  const setStep = (i) => {
    steps.forEach((li, k) => li.classList.toggle('is-on', k <= i));
    tag.textContent = names[i];
    box.classList.toggle('is-bonded', i === 3);
  };
  if (!animate) {
    ['.vfit-veneer', '.vfit-label--veneer', '.vfit-prep'].forEach((s) => (q(s).style.opacity = 1));
    q('.vfit-sliver').style.opacity = 0; q('.vfit-label--enamel').style.opacity = 0;
    return setStep(3);
  }
  setStep(0);
  const tl = gsap.timeline({
    scrollTrigger: { trigger: box, start: 'top 70%', end: 'bottom 45%', scrub: 0.6 },
    onUpdate: () => setStep(Math.min(3, Math.floor(tl.progress() * 4))),
  });
  tl.to(q('.vfit-sliver'), { opacity: 0, duration: 1 }, 0.4)
    .to(q('.vfit-label--enamel'), { opacity: 0, duration: 0.5 }, 0.4)
    .to(q('.vfit-prep'), { opacity: 1, duration: 0.6 }, 0.8)
    .to(q('.vfit-label--prep'), { opacity: 1, duration: 0.5 }, 0.9)
    .fromTo(q('.vfit-veneer'), { opacity: 0, x: -70 }, { opacity: 1, x: 0, duration: 1.2, ease: 'power2.out' }, 1.8)
    .to(q('.vfit-label--prep'), { opacity: 0, duration: 0.4 }, 2.2)
    .to(q('.vfit-label--veneer'), { opacity: 1, duration: 0.5 }, 2.6)
    .to({}, { duration: 1 });
})();

/* ===== Find your fix: concern chips swap the recommended treatment ===== */
(() => {
  const box = $('[data-fixfinder]');
  if (!box) return;
  const data = JSON.parse($('[data-fix-data]', box).textContent);
  const chips = $$('.fix-chip', box);
  const card = $('.fixfinder-result', box);
  const link = $('[data-fix-link]', box);
  const render = (i) => {
    const d = data[i];
    $('[data-fix-tag]', box).textContent = d.tag;
    $('[data-fix-title]', box).textContent = d.title;
    $('[data-fix-text]', box).textContent = d.text;
    link.href = d.link;
    link.firstChild.textContent = d.label + ' ';
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => { x.classList.toggle('is-active', x === c); x.setAttribute('aria-pressed', x === c); });
    const i = +c.dataset.fix;
    if (animate) gsap.to(card, { opacity: 0, y: 10, duration: 0.15, overwrite: true, onComplete: () => { render(i); gsap.to(card, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }); } });
    else render(i);
  }));
  render(0);
})();

/* ===== Wear clock: the day's wear arcs draw in and the hours count up ===== */
(() => {
  const box = $('[data-wear]');
  if (!box) return;
  const arcs = $$('.wear-arc', box);
  const gaps = $$('.wear-gap, .wear-label', box);
  const count = $('[data-wear-count]', box);
  if (!animate) { count.textContent = 22; return; }
  arcs.forEach((p) => { const l = p.getTotalLength(); gsap.set(p, { strokeDasharray: l, strokeDashoffset: l }); });
  gsap.set(gaps, { opacity: 0 });
  const obj = { v: 0 };
  gsap.timeline({ scrollTrigger: { trigger: box, start: 'top 70%', once: true } })
    .to(arcs, { strokeDashoffset: 0, duration: 0.8, ease: 'none', stagger: 0.8 }, 0)
    .to(obj, { v: 22, duration: 2.4, ease: 'none', onUpdate: () => (count.textContent = Math.round(obj.v)) }, 0)
    .to(gaps, { opacity: 1, duration: 0.4, stagger: 0.12 }, 2.2);
})();

/* ===== Aligner candidate quiz: three answers give a general recommendation ===== */
(() => {
  const box = $('[data-quiz]');
  if (!box) return;
  const qs = $$('.quiz-q', box);
  const result = $('.quiz-result', box);
  const answers = {};
  const outcome = () => {
    if (answers.health === 'no') return ['First step', "Let's get your teeth healthy first", 'Any decay or gum problems are treated before straightening begins. Once your mouth is healthy, we can plan aligners or braces with you.'];
    if (answers.fit === 'no') return ['Worth discussing', 'Fixed braces may suit you better', 'More complex bite problems are often treated more predictably with braces. Come in for an assessment and we will explain every option.'];
    if (answers.wear === 'no') return ['Worth discussing', 'Fixed braces may be easier for you', "Aligners only work when they're worn 20–22 hours a day. Braces work around the clock without you having to remember them."];
    return ['Good sign', 'You may be a great candidate for clear aligners', 'Your answers suggest aligners could work well for you. Book an assessment and digital scan to confirm and see your expected result.'];
  };
  const update = () => {
    const done = qs.every((q) => answers[q.dataset.q]);
    if (!done) return;
    const [tag, title, text] = outcome();
    $('[data-quiz-tag]', box).textContent = tag;
    $('[data-quiz-title]', box).textContent = title;
    $('[data-quiz-text]', box).textContent = text;
    const first = result.hidden;
    result.hidden = false;
    if (animate) gsap.fromTo(result, { opacity: 0, y: first ? 16 : 6 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', overwrite: true, onComplete: () => ScrollTrigger.refresh() });
  };
  qs.forEach((q) => {
    const btns = $$('button', q);
    btns.forEach((b) => {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        btns.forEach((x) => x.setAttribute('aria-pressed', x === b));
        answers[q.dataset.q] = b.dataset.v;
        update();
      });
    });
  });
  $('.quiz-reset', box).addEventListener('click', () => {
    Object.keys(answers).forEach((k) => delete answers[k]);
    $$('.quiz-a button', box).forEach((b) => b.setAttribute('aria-pressed', 'false'));
    result.hidden = true;
    $('.quiz-a button', box).focus();
  });
})();
