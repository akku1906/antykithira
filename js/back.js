/* Widok tylny: spirala Metona (góra) i sarosu (dół) z tarczami pomocniczymi. */
(function () {
  'use strict';
  const D = window.D, AM = window.AM;
  const GREEK_NUM = ['Α', 'Β', 'Γ', 'Δ'];

  // start: kąt (0 = góra) początku spirali; Meton zaczyna się na dole wewnątrz (Freeth i in. 2008)
  function spiralGeom(cx, cy, rIn, rOut, turns, cells, start) {
    const pitch = (rOut - rIn) / (turns + 1);
    const rb = (th) => rIn + pitch * th / 360;           // wewnętrzna krawędź zwoju przy kącie th
    const perTurn = cells / turns;
    const s0 = start || 0;
    return { cx, cy, pitch, rb, perTurn, turns, cells, thOf: (pos) => pos / perTurn * 360,
      pt: (r, th) => D.pt(cx, cy, r, th + s0), s0 };
  }

  function drawSpiral(ctx, g, P, fs, labelFn, glyphFn, currentCell) {
    const { cx, cy, rb, pitch } = g;
    // tło rowka
    ctx.beginPath(); ctx.arc(cx, cy, rb(g.turns * 360) + pitch, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fill();
    // bieżąca komórka
    cellPath(ctx, g, currentCell); ctx.fillStyle = 'rgba(179,38,30,.35)'; ctx.fill();
    // linia spirali
    ctx.beginPath();
    for (let th = 0; th <= (g.turns + 1) * 360; th += 2) {
      const [x, y] = g.pt(rb(th), th);
      if (th === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = P.dark; ctx.lineWidth = 1.3; ctx.stroke();
    // przegródki i podpisy
    ctx.lineWidth = 0.6;
    const cellW = (2 * Math.PI * (rb(0) + pitch / 2)) / g.perTurn;   // najmniejsza szerokość
    for (let i = 0; i <= g.cells; i++) {
      const th = g.thOf(i);
      const [x1, y1] = g.pt(rb(th), th), [x2, y2] = g.pt(rb(th) + pitch, th);
      ctx.strokeStyle = P.dark; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      if (i === g.cells) break;
      const thc = g.thOf(i + 0.5), rc = rb(thc) + pitch / 2;
      const w = 2 * Math.PI * rc / g.perTurn;
      const gl = glyphFn && glyphFn(i);
      if (gl) {
        // odczytany z fragmentu: pełne czerwone pole; zrekonstruowany: sam kontur
        const [x, y] = g.pt(rc, thc);
        if (w > fs * 0.9) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(D.ang(thc + g.s0) + Math.PI / 2);
          const bw = pitch * 0.62, bh = Math.min(w * 0.82, pitch * 0.5);
          ctx.beginPath(); ctx.rect(-bw / 2, -bh / 2, bw, bh);
          if (gl.observed) { ctx.fillStyle = P.hi; ctx.fill(); }
          else { ctx.setLineDash([3, 2]); ctx.strokeStyle = P.hi; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]); }
          ctx.font = `bold ${Math.min(pitch * 0.36, bh * 0.85)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = gl.observed ? '#fff6e6' : P.hi; ctx.fillText(gl.txt, 0, 0); ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(x, y, Math.max(1.8, w * 0.3), 0, 7);
          if (gl.observed) { ctx.fillStyle = P.hi; ctx.fill(); } else { ctx.strokeStyle = P.hi; ctx.lineWidth = 1.2; ctx.stroke(); }
        }
      } else if (labelFn && Math.min(pitch * 0.2, w * 0.62) >= 6) {
        const txt = labelFn(i);
        const [x, y] = g.pt(rc, thc);
        ctx.save(); ctx.translate(x, y); ctx.rotate(D.ang(thc + g.s0));
        ctx.font = `${Math.min(pitch * 0.2, w * 0.62)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = P.text; ctx.globalAlpha = 0.85; ctx.fillText(txt, 0, 0); ctx.restore();
      }
    }
    void cellW;
  }
  function cellPath(ctx, g, i) {
    const { cx, cy, rb, pitch } = g;
    const a0 = g.thOf(i), a1 = g.thOf(i + 1);
    ctx.beginPath();
    for (let th = a0; th <= a1 + 1e-9; th += (a1 - a0) / 8) { const [x, y] = g.pt(rb(th), th); ctx.lineTo(x, y); }
    for (let th = a1; th >= a0 - 1e-9; th -= (a1 - a0) / 8) { const [x, y] = g.pt(rb(th) + pitch, th); ctx.lineTo(x, y); }
    ctx.closePath();
  }
  // wskazówka ze ślizgaczem: ramię od środka, ślizgacz w bieżącym zwoju
  function spiralPointer(ctx, g, pos, P, R) {
    const th = g.thOf(pos);
    const rS = g.rb(th) + g.pitch / 2;
    D.pointer(ctx, g.cx, g.cy, th + g.s0, 0, g.rb(g.turns * 360) + g.pitch * 1.05, P.brass, P.dark, Math.max(2, R * 0.022));
    const [x, y] = g.pt(rS, th);
    ctx.beginPath(); ctx.arc(x, y, g.pitch * 0.32, 0, 2 * Math.PI);
    ctx.fillStyle = P.brass2; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.dark; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, g.pitch * 0.12, 0, 2 * Math.PI); ctx.fillStyle = P.dark; ctx.fill();
    D.ball(ctx, g.cx, g.cy, R * 0.035, P.brass);
  }
  function subDial(ctx, x, y, r, labels, angle, P, fs, title, rot = 0) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = D.metal(ctx, x, y, r, D.shade(P.brass, 0.1), P.brass2); ctx.fill();
    ctx.strokeStyle = P.dark; ctx.lineWidth = 1; ctx.stroke();
    const n = labels.length;
    for (let i = 0; i < n; i++) {
      const a = rot + i * 360 / n;                        // rot: kąt pierwszej kreski podziału
      const [x1, y1] = D.pt(x, y, r * 0.2, a), [x2, y2] = D.pt(x, y, r, a);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      let lines = [].concat(labels[i]);
      if (lines.length > 1 && fs * 0.62 < 7) lines = [GREEK_NUM[i] || lines[0]];   // na małym ekranie tylko numer roku
      lines.forEach((t, k) => D.arcText(ctx, t, x, y, r * (0.78 - k * 0.22), a + 180 / n, fs * (k ? 0.62 : 0.72), P.text));
    }
    D.pointer(ctx, x, y, angle, 0, r * 0.95, P.dark, P.brass, Math.max(1.5, r * 0.04));
    ctx.beginPath(); ctx.arc(x, y, r * 0.07, 0, 7); ctx.fillStyle = P.dark; ctx.fill();
    if (title) {
      ctx.font = `${fs * 0.7}px Georgia, serif`; ctx.textAlign = 'center'; ctx.fillStyle = P.text;
      ctx.fillText(title, x, y + r + fs * 0.75);
    }
  }

  function draw(ctx, W, H, st, P) {
    const cx = W / 2;
    const R = Math.min(W * 0.45, H * 0.215);
    const fs = Math.max(8, R * 0.075);
    ctx.fillStyle = D.metal(ctx, cx, H / 2, H * 0.7, P.plate, P.plate2);
    D.roundRect(ctx, 2, 2, W - 4, H - 4, W * 0.03); ctx.fill();
    ctx.strokeStyle = P.dark; ctx.lineWidth = 1.5; ctx.stroke();

    const cyM = H * 0.262, cyS = H * 0.728;
    const capt = (t, y) => { ctx.font = `${Math.max(10, fs * 0.85)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.fillStyle = P.text; ctx.fillText(t, cx, y); };

    // --- Meton: 235 miesięcy w 5 zwojach ---
    const gm = spiralGeom(cx, cyM, R * 0.42, R, 5, 235, 180);
    const cells = AM.METONIC_CELLS;
    drawSpiral(ctx, gm, P, fs, (i) => cells[i].first ? 'L' + cells[i].yearGr : cells[i].name.slice(0, 4), null, st.metonic.cell);
    // numery dni opuszczonych wpisane pod pierwszym zwojem (jak na fragmencie B)
    ctx.font = `${Math.max(7, gm.pitch * 0.26)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = P.text;
    for (let i = 0; i < 47; i++) {
      const ex = cells[i].exDay; if (!ex) continue;
      const th = gm.thOf(i + 0.5), [x, y] = gm.pt(gm.rb(th) - gm.pitch * 0.22, th);
      ctx.fillText(String(ex), x, y);
    }
    subDial(ctx, cx - R * 0.205, cyM, R * 0.19, AM.GAMES.map((g, i) => g.map((n, k) => n + (AM.GAMES_UNCERTAIN[i][k] ? '?' : ''))), st.games.angle, P, fs * 0.8, 'igrzyska');
    subDial(ctx, cx + R * 0.205, cyM, R * 0.19, GREEK_NUM, st.callippic.angle, P, fs, 'Kalippos');
    spiralPointer(ctx, gm, st.metonic.pos, P, R);
    capt('ΜΕΤΩΝ · 19 lat = 235 miesięcy', cyM - R - fs * 0.35);

    // --- Saros: 223 miesiące w 4 zwojach ---
    const gs = spiralGeom(cx, cyS, R * 0.4, R, 4, 223);
    const gl = AM.SAROS_GLYPHS;
    drawSpiral(ctx, gs, P, fs, null, (i) => (gl[i].lunar || gl[i].solar)
      ? { txt: (gl[i].lunar ? 'Σ' : '') + (gl[i].solar ? 'Η' : ''), observed: gl[i].observed } : null, st.saros.cell);
    subDial(ctx, cx, cyS, R * 0.24, [['', '0 h'], ['Η', '+8 h'], ['Ις', '+16 h']], st.exeligmos.angle, P, fs, null, AM.EXELIGMOS_START);
    spiralPointer(ctx, gs, st.saros.pos, P, R);
    capt('ΣΑΡΟΣ · 223 miesiące · exeligmos', cyS + R + fs * 1.0);
    const lf = Math.max(9, fs * 0.65);
    ctx.font = `${lf}px Georgia, serif`; ctx.fillStyle = P.text; ctx.globalAlpha = 0.85;
    const leg = 'Σ Księżyc, Η Słońce · pełne pole: odczytane z fragmentów · kontur: rekonstrukcja (Freeth 2014)';
    if (ctx.measureText(leg).width < W * 0.92) ctx.fillText(leg, cx, cyS + R + fs * 1.9);
    else {
      ctx.fillText('Σ Księżyc, Η Słońce · pełne pole: odczytane z fragmentów', cx, cyS + R + fs * 1.0 + lf * 1.4);
      ctx.fillText('kontur: rekonstrukcja (Freeth 2014)', cx, cyS + R + fs * 1.0 + lf * 2.6);
    }
    ctx.globalAlpha = 1;

    D.crank(ctx, W - W * 0.06, H / 2, W * 0.035, st.crank, P);
    return { cx, cy: H / 2 };
  }

  window.Views = window.Views || {};
  window.Views.back = { draw, aspect: 0.62 };
})();
