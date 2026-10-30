const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/4QPCXH8UND';

(() => {
  const root = document.documentElement;
  const forced = /[?&]motion/.test(location.search);
  if (forced) root.classList.add('motion');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !forced;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const nb = s => String(s).replace(/ /g, ' ');
  const fmt = n => nb(new Intl.NumberFormat('ru-RU').format(Math.round(n)));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const plural = (n, a, b, c) => { const m = n % 100, d = n % 10; return (m > 10 && m < 20) ? c : d === 1 ? a : (d > 1 && d < 5) ? b : c; };

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- hero: the water rises to the seam, the headline climbs out ---------- */
  const hero = $('.hero');
  const setWl = v => hero.style.setProperty('--wl', v.toFixed(2) + '%');
  const seam = () => (parseFloat(getComputedStyle(hero).getPropertyValue('--seam')) || 0.5) * 100;
  let wlBase = reduce ? seam() : 100;
  setWl(wlBase);
  let heroVisible = true;
  new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);

  const intro = async () => {
    if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, sleep(1400)]);
    requestAnimationFrame(() => {
      root.classList.add('go');
      if (reduce) return;
      const t0 = performance.now(), D = 1500;
      const tick = t => {
        const p = clamp((t - t0) / D, 0, 1);
        wlBase = 100 - (100 - seam()) * ease(p);
        if (p < 1) { setWl(wlBase); requestAnimationFrame(tick); } else { wlBase = seam(); bob(); }
      };
      requestAnimationFrame(tick);
    });
  };
  // after it settles, the water keeps a slow swell (the seam moves a few pixels)
  const bob = () => {
    const loop = t => {
      if (heroVisible) setWl(seam() + Math.sin(t / 1300) * 0.55);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
  intro();

  /* ---------- header, burger ---------- */
  const bar = $('#header'), burger = $('#burger'), nav = $('#nav');
  const setMenu = open => {
    burger.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (open) bar.classList.remove('is-hidden');
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- split headings into words ---------- */
  $$('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true" style="--i:${i}">${w}</span>`).join(' ');
  });

  /* ---------- scroll loop: header state, picture drift ---------- */
  const drift = $$('.pic img, .tile img');
  let lastY = window.scrollY, ticking = false;
  const onScroll = () => {
    const y = window.scrollY, vh = window.innerHeight;
    const open = nav.classList.contains('is-open');
    bar.classList.toggle('is-solid', y > vh * 0.45 || open);
    if (!open) {
      if (y > lastY + 6 && y > 90) bar.classList.add('is-hidden');
      if (y < lastY - 4 || y < 90) bar.classList.remove('is-hidden');
    }
    lastY = y;
    if (!reduce) {
      drift.forEach(img => {
        const box = img.parentElement.getBoundingClientRect();
        if (box.bottom < -80 || box.top > vh + 80) return;
        const c = (box.top + box.height / 2 - vh / 2) / vh;
        img.style.setProperty('--py', clamp(-c * 34, -22, 22).toFixed(1) + 'px');
      });
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- entrances ---------- */
  $$('.row, .figs li').forEach((el, i) => el.style.setProperty('--d', ((i % 4) * 90) + 'ms'));
  const countUp = el => {
    const target = +el.dataset.count;
    if (reduce) return;
    const t0 = performance.now(), D = 1400;
    const tick = t => {
      const p = clamp((t - t0) / D, 0, 1);
      el.textContent = fmt(target * ease(p));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const seen = el => {
    el.classList.add('in');
    $$('[data-count]', el).forEach(countUp);
  };
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { seen(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('[data-r], [data-split], [data-pic], #tiles, .price, .band:not(.band--head), .cta__row').forEach(el => io.observe(el));
  // the head band of the FAQ has no body, its words rise with it
  $$('[data-count]').forEach(el => { if (!reduce) el.textContent = '0'; });
  if (reduce) $$('[data-r], [data-split], [data-pic], #tiles, .price, .band, .cta__row').forEach(el => el.classList.add('in'));

  /* ---------- the live thing: groundwater ---------- */
  const rng = $('#gwRange'), out = $('#gwOut');
  const gws = $$('#scene .gw');
  const inWat = $('#scene .in-wat');
  const drips = $('#scene .drips');
  const readRing = $('#readRing');
  const dripEls = $$('rect', drips);
  const JOINTS = [180, 242, 304];
  let touched = false, gwNote = '';
  const setLevel = L => {
    const y = 76 + L * 88;
    gws.forEach(g => { g.setAttribute('y', y.toFixed(1)); g.setAttribute('height', (440 - y).toFixed(1)); });
    const top = clamp(y, 118, 316);
    inWat.setAttribute('y', top.toFixed(1));
    inWat.setAttribute('height', y < 304 ? (316 - top).toFixed(1) : 0);
    dripEls.forEach((d, i) => {
      d.setAttribute('x', i === 1 ? 205 : 88);
      d.setAttribute('y', JOINTS[i] - 7);
      d.setAttribute('width', 8); d.setAttribute('height', 10);
      d.style.display = y < JOINTS[i] ? 'none' : 'block';
    });
    drips.classList.toggle('on', y < 304);
    out.textContent = L.toFixed(1).replace('.', ',') + ' м';
    let txt, bad = false;
    if (y >= 304) txt = 'Вода ниже швов. Пока всё в порядке.';
    else if (y >= 180) txt = 'Вода идёт внутрь через швы. Нужна откачка.';
    else { txt = 'Септик переполнен. Зовите ассенизатора.'; bad = true; }
    if (readRing.textContent !== txt) readRing.textContent = txt;
    readRing.classList.toggle('read--bad', bad || y < 304 && y >= 180 && false);
    gwNote = 'вода на глубине ' + L.toFixed(1).replace('.', ',') + ' м';
  };
  rng.addEventListener('input', () => { touched = true; setLevel(+rng.value); });
  setLevel(3.3); rng.value = 3.3;
  let played = false;
  new IntersectionObserver((es, o) => {
    if (!es[0].isIntersecting || played) return;
    played = true; o.disconnect();
    if (reduce) { rng.value = 0.9; setLevel(0.9); return; }
    const t0 = performance.now(), D = 3600, from = 3.3, to = 0.9;
    const tick = t => {
      if (touched) return;
      const p = clamp((t - t0) / D, 0, 1);
      const v = from + (to - from) * ease(p);
      rng.value = v; setLevel(v);
      if (p < 1) requestAnimationFrame(tick);
    };
    setTimeout(() => requestAnimationFrame(tick), 500);
  }, { threshold: 0.45 }).observe($('#scene'));

  /* ---------- footage: play only while on screen ---------- */
  8313('video').forEach(v => {
    if (reduce) return;
    new IntersectionObserver(es => { es[0].isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.2 }).observe(v);
  });

  /* ---------- calculator ---------- */
  const cN = $('#cN'), cP = $('#cP'), cY = $('#cY');
  const oN = $('#oN'), oY = $('#oY'), rSum = $('#rSum'), rYears = $('#rYears'), rVerdict = $('#rVerdict');
  const STATION = 200000;
  let shown = 0, calcNote = '';
  const calc = () => {
    const n = +cN.value, p = Math.max(0, +cP.value || 0), y = +cY.value;
    oN.textContent = n; oY.textContent = y;
    const sum = n * p * 12 * y;
    rYears.textContent = y + ' ' + plural(y, 'год', 'года', 'лет');
    const from = shown, t0 = performance.now(), D = reduce ? 1 : 520;
    const tick = t => {
      const k = clamp((t - t0) / D, 0, 1);
      shown = from + (sum - from) * ease(k);
      rSum.textContent = fmt(shown);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const perMonth = n * p;
    if (perMonth > 0 && sum >= STATION) {
      const m = Math.ceil(STATION / perMonth);
      rVerdict.textContent = 'Станция окупится примерно за ' + m + ' ' + plural(m, 'месяц', 'месяца', 'месяцев') + ', за ' + y + ' ' + plural(y, 'год', 'года', 'лет') + ' вы сэкономите около ' + fmt(sum - STATION) + ' ₽.';
    } else {
      rVerdict.textContent = 'При такой откачке станция за этот срок не окупится. Инженер посчитает точнее на замере.';
    }
    calcNote = n + ' откачек в мес, ' + p + ' ₽ за рейс, ' + y + ' ' + plural(y, 'год', 'года', 'лет') + ': ' + fmt(sum).replace(/ /g, ' ') + ' ₽';
  };
  [cN, cP, cY].forEach(el => el.addEventListener('input', calc));
  let calcSeen = false;
  new IntersectionObserver((es, o) => {
    if (!es[0].isIntersecting || calcSeen) return;
    calcSeen = true; o.disconnect(); calc();
  }, { threshold: 0.3 }).observe($('.calc__out'));
  rSum.textContent = '0';

  /* ---------- smooth anchors + model preselect ---------- */
  const interest = $('#interest');
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    const target = $(href);
    if (!target) return;
    e.preventDefault();
    const pick = a.dataset.pick;
    if (pick) {
      const opt = $$('option', interest).find(o => o.dataset.k === pick);
      if (opt) interest.value = opt.value;
    }
    const top = target.getBoundingClientRect().top + window.scrollY - (href === '#contact' ? 0 : 68);
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------- phone mask ---------- */
  $$('input[type="tel"]').forEach(input => {
    input.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let o = '+7';
      if (v.length > 1) o += ' (' + v.slice(1, 4);
      if (v.length >= 4) o += ') ' + v.slice(4, 7);
      if (v.length >= 7) o += '-' + v.slice(7, 9);
      if (v.length >= 9) o += '-' + v.slice(9, 11);
      e.target.value = o;
    });
  });

  /* ---------- form → Cloudflare Worker → Telegram ---------- */
  const form = $('#leadForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('button[type="submit"]', form);
    const orig = btn.textContent;
    const payload = {};
    new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    const digits = (payload.phone || '').replace(/\D/g, '');
    const nameEl = form.elements.name, telEl = form.elements.phone;
    nameEl.classList.toggle('is-bad', !payload.name.trim());
    telEl.classList.toggle('is-bad', digits.length < 11);
    if (!payload.name.trim() || digits.length < 11) { btn.textContent = 'Заполните имя и телефон'; setTimeout(() => { btn.textContent = orig; }, 2200); return; }
    const extra = [];
    if (touched) extra.push('Ползунок воды: ' + gwNote);
    if (calcSeen) extra.push('Расчёт откачки: ' + calcNote);
    if (extra.length) payload.context = extra.join('; ');
    payload.page = location.href.split('#')[0];
    btn.disabled = true; btn.textContent = 'Отправляем…';
    try {
      const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      btn.textContent = 'Заявка отправлена';
      form.reset();
    } catch (err) {
      console.error(err);
      btn.textContent = 'Ошибка, попробуйте ещё раз';
    } finally {
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3200);
    }
  });
})();
