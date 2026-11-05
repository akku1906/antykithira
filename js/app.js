/* Sterowanie: czas, korba, widoki, panel odczytów. */
(function () {
  'use strict';
  const AM = window.AM, D = window.D;
  const $ = (s) => document.querySelector(s);
  const cv = $('#cv'), ctx = cv.getContext('2d');
  const MONTHS_GEN = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  const ZOD_PL = ['Barana', 'Byka', 'Bliźniąt', 'Raka', 'Lwa', 'Panny', 'Wagi', 'Skorpiona', 'Strzelca', 'Koziorożca', 'Wodnika', 'Ryb'];
  const JD_MIN = AM.jdFromCal(-499, 1, 1), JD_MAX = AM.jdFromCal(2200, 1, 1);

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* brak pamięci */ } }
  };

  let jd = AM.JD_START;
  let view = 'front';
  let palette = D.palette();
  let dirty = true, playing = false, lastTs = 0, center = { cx: 0, cy: 0 };

  // ---------- czas ----------
  function setJd(v) { jd = Math.min(JD_MAX, Math.max(JD_MIN, v)); dirty = true; }
  document.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => {
    const s = parseFloat(b.dataset.step);
    setJd(jd + (Math.abs(s) === 29.53 ? Math.sign(s) * AM.MONTH : s));
  }));
  $('#today').addEventListener('click', () => setJd(AM.jdNow()));
  $('#start').addEventListener('click', () => setJd(AM.JD_START));
  const slider = $('#slider');
  slider.min = JD_MIN; slider.max = JD_MAX;
  slider.addEventListener('input', () => setJd(parseFloat(slider.value)));
  const playBtn = $('#play');
  function togglePlay() { playing = !playing; playBtn.textContent = playing ? '❚❚' : '▶'; lastTs = 0; if (playing) requestAnimationFrame(loop); }
  playBtn.addEventListener('click', togglePlay);

  // ---------- korba: przeciąganie po tarczy (1 obrót = 1 rok = 1 obrót b1) ----------
  let drag = null;
  cv.addEventListener('pointerdown', (e) => {
    const p = local(e);
    drag = { a: Math.atan2(p.y - center.cy, p.x - center.cx), x0: p.x, y0: p.y, moved: 0 };
    cv.setPointerCapture(e.pointerId); cv.classList.add('drag');
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = local(e);
    const a = Math.atan2(p.y - center.cy, p.x - center.cx);
    let da = a - drag.a;
    if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
    drag.a = a; drag.moved = Math.max(drag.moved, Math.hypot(p.x - drag.x0, p.y - drag.y0));
    setJd(jd + (da / (2 * Math.PI)) * AM.Y);
  });
  const end = () => { drag = null; cv.classList.remove('drag'); };
  cv.addEventListener('pointerup', (e) => {
    // dotknięcie bez przeciągania: widok może je obsłużyć (np. powiększenie platformy e3)
    const V = window.Views[view];
    if (drag && drag.moved < 6 && V && V.tap) { const p = local(e); if (V.tap(p.x, p.y)) dirty = true; }
    end();
  }); cv.addEventListener('pointercancel', end);
  cv.addEventListener('wheel', (e) => { e.preventDefault(); setJd(jd + Math.sign(e.deltaY) * (e.shiftKey ? AM.MONTH : 1)); }, { passive: false });
  function local(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

  // ---------- widoki ----------
  const tabs = document.querySelectorAll('.tabs button');
  function setView(v) {
    view = v;
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.view === v)));
    const about = v === 'about';
    $('#about').hidden = !about; $('#stage').hidden = about;
    store.set('am-view', v);
    resize();
  }
  tabs.forEach((t) => t.addEventListener('click', () => setView(t.dataset.view)));

  // ---------- motyw ----------
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme');
    palette = D.palette(); dirty = true; themeIcon();
  }
  function themeIcon() {
    const dark = (document.documentElement.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
    $('#theme').textContent = dark ? '☀' : '☾';
  }
  $('#theme').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    store.set('am-theme', next); applyTheme(next);
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { palette = D.palette(); dirty = true; themeIcon(); });

  // ---------- klawiatura ----------
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select')) return;
    const k = e.key;
    const map = {
      ArrowRight: 1, ArrowLeft: -1, ArrowUp: AM.MONTH, ArrowDown: -AM.MONTH, PageUp: AM.Y, PageDown: -AM.Y
    };
    if (k in map) { e.preventDefault(); setJd(jd + map[k]); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === '1' || k === 'p') setView('front');
    else if (k === '2' || k === 'b') setView('back');
    else if (k === '3' || k === 'w') setView('inside');
    else if (k === '4' || k === '?') setView('about');
    else if (k === ' ') { e.preventDefault(); togglePlay(); }
    else if (k === 't') setJd(AM.jdNow());
    else if (k === 's') setJd(AM.JD_START);
    else if (k === 'd') $('#theme').click();
    else if (k === 'z' && view === 'inside') { window.Views.inside.toggleZoom(); dirty = true; }
  });

  // ---------- rozmiar płótna ----------
  let W = 0, H = 0;
  function resize() {
    const V = window.Views[view];
    if (!V) return;
    const stage = $('#stage');
    const availW = stage.clientWidth;
    const controlsH = document.querySelector('.controls').offsetHeight;
    const headerH = document.querySelector('.top').offsetHeight;
    const availH = Math.max(300, window.innerHeight - controlsH - headerH - 50);
    const aspect = typeof V.aspect === 'function' ? V.aspect(availW) : V.aspect;  // szer./wys.
    let w = Math.min(availW, availH * aspect), h = w / aspect;
    if (window.innerWidth <= 860) { w = availW; h = w / aspect; }
    W = Math.floor(w); H = Math.floor(h);
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dirty = true;
  }
  window.addEventListener('resize', resize);

  // ---------- render ----------
  function render() {
    const st = AM.state(jd);
    const V = window.Views[view];
    if (V && view !== 'about') {
      ctx.clearRect(0, 0, W, H);
      center = V.draw(ctx, W, H, st, palette) || { cx: W / 2, cy: H / 2 };
    }
    readout(st);
    if (document.activeElement !== slider) slider.value = jd;
  }
  function loop(ts) {
    if (playing) {
      if (lastTs) setJd(jd + parseFloat($('#speed').value) * (ts - lastTs) / 1000);
      lastTs = ts;
      if (jd >= JD_MAX) togglePlay();
    }
    if (dirty) { dirty = false; render(); }
    requestAnimationFrame(loop);
  }

  // ---------- odczyty ----------
  const yearStr = (y) => y > 0 ? `${y} n.e.` : `${1 - y} p.n.e.`;
  const deg = (l) => `${Math.floor(l % 30)}° ${ZOD_PL[Math.floor(l / 30)]}`;
  function readout(st) {
    const j = st.julian;
    $('#d-julian').textContent = `${j.d} ${MONTHS_GEN[j.m - 1]} ${yearStr(j.y)}`;
    const g = st.gregorian;
    $('#d-greg').textContent = j.y >= 1582 ? `kalendarz juliański · gregoriański: ${g.d} ${MONTHS_GEN[g.m - 1]} ${g.y}` : 'kalendarz juliański (przybliżona data)';
    const e = st.egyptian;
    $('#d-egypt').innerHTML = `Egipt: ${e.month < 12 ? e.day : e.day + ' (epagomenalny)'} ${AM.EG_MONTHS_PL[e.month]} <span class="gr">${AM.EG_MONTHS[e.month]}</span>`;
    const ph = st.phase, illum = Math.round(50 * (1 - Math.cos(ph * D.rad)));
    const phName = ph < 15 || ph > 345 ? 'nów' : ph < 165 ? 'przybywa' : ph < 195 ? 'pełnia' : 'ubywa';
    const m = st.metonic, sa = st.saros;
    const gl = sa.glyph, glTxt = (gl.solar || gl.lunar
      ? `<span class="ecl">${[gl.lunar ? 'Σ zaćmienie Księżyca' : '', gl.solar ? 'Η zaćmienie Słońca' : ''].filter(Boolean).join(', ')}</span> <span class="gr">(${gl.observed ? 'odczytany z fragmentu' : 'rekonstrukcja Freetha 2014'})</span>`
      : 'brak glifu') +
      `<br><span class="gr">w rzeczywistości (Meeus, lunacja od 205 p.n.e.): ${[gl.meeus.lunar ? 'zaćm. Księżyca' : '', gl.meeus.solar ? 'zaćm. Słońca' : ''].filter(Boolean).join(', ') || 'brak'}</span>`;
    const rows = [
      ['<h3>Przód</h3>'],
      ['Słońce', `${deg(st.sunTrue)} <span class="gr">(średnie ${deg(st.sunMean)})</span>`],
      ['Księżyc', `${deg(st.moonTrue)} <span class="gr">(${(st.moonTrue - st.moonMean + 540) % 360 - 180 >= 0 ? '+' : ''}${(((st.moonTrue - st.moonMean + 540) % 360) - 180).toFixed(1)}° anomalii)</span>`],
      ['Faza', `${phName}, ${illum}% tarczy`],
      ...st.planets.map((p) => [AM.PLANETS.find((q) => q.id === p.id).pl, deg(p.lon)]),
      ['Smok', `węzeł wstępujący ${deg(st.node)}`],
      ['<h3>Tył</h3>'],
      ['Meton', `rok ${m.info.year}/19, ${m.info.namePl} <span class="gr">${m.info.name}</span>`],
      ['', `${m.info.days} dni${m.info.exDay ? `, opuszczony dzień ${m.info.exDay}.` : ''} <span class="gr">komórka ${m.cell + 1}/235, zwój ${m.turn + 1}</span>`],
      ['Kalippos', `okres ${st.callippic.sector + 1}/4 (76 lat)`],
      ['Igrzyska', `rok ${st.games.year + 1}/4: ${st.games.names.join(', ')}`],
      ['Saros', `miesiąc ${sa.cell + 1}/223, zwój ${sa.turn + 1}`],
      ['Glif', glTxt],
      ['Exeligmos', `+${st.exeligmos.sector * 8} h <span class="gr">(${st.exeligmos.sector + 1}/3)</span>`],
      ['Korba', `${(st.t * 224 / 48).toFixed(1)} obr. od startu`],
      ['Dryf', `Słońce ${st.drift.sun >= 0 ? '+' : ''}${st.drift.sun.toFixed(1)}°, Księżyc ${st.drift.moon >= 0 ? '+' : ''}${st.drift.moon.toFixed(1)}° <span class="gr">względem współczesnych średnich położeń</span>`]
    ];
    $('#readout').innerHTML = rows.map((r) => r.length === 1 ? r[0] : `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('');
  }

  // ---------- start ----------
  const savedTheme = store.get('am-theme'); if (savedTheme) applyTheme(savedTheme); themeIcon();
  const savedView = store.get('am-view');
  setView(window.Views[savedView] || savedView === 'about' ? savedView : 'front');
  requestAnimationFrame(loop);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline nie zadziała, strona tak */ });
  }
})();
