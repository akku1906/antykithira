/* Widok tylny: spirala Metona (góra) i sarosu (dół) z tarczami pomocniczymi. */
(function () {
  'use strict';
  const D = window.D, AM = window.AM;
  const GREEK_NUM = ['Α', 'Β', 'Γ', 'Δ'];

  function spiralGeom(cx, cy, rIn, rOut, turns, cells) {
    const pitch = (rOut - rIn) / (turns + 1);
    const rb = (th) => rIn + pitch * th / 360;           // wewnętrzna krawędź zwoju przy kącie th
    const perTurn = cells / turns;
    return { cx, cy, pitch, rb, perTurn, turns, cells, thOf: (pos) => pos / perTurn * 360 };
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
      const [x, y] = D.pt(cx, cy, rb(th), th);
      if (th === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = P.dark; ctx.lineWidth = 1.3; ctx.stroke();
    // przegródki i podpisy
    ctx.lineWidth = 0.6;
    const cellW = (2 * Math.PI * (rb(0) + pitch / 2)) / g.perTurn;   // najmniejsza szerokość
    for (let i = 0; i <= g.cells; i++) {
      const th = g.thOf(i);
      const [x1, y1] = D.pt(cx, cy, rb(th), th), [x2, y2] = D.pt(cx, cy, rb(th) + pitch, th);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      if (i === g.cells) break;
      const thc = g.thOf(i + 0.5), rc = rb(thc) + pitch / 2;
      const w = 2 * Math.PI * rc / g.perTurn;
      const gl = glyphFn && glyphFn(i);
      if (gl) {
        const [x, y] = D.pt(cx, cy, rc, thc);
        if (w > fs * 0.9) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(D.ang(thc) + Math.PI / 2);
          ctx.font = `bold ${Math.min(pitch * 0.42, w * 0.8)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = P.hi; ctx.fillText(gl, 0, 0); ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, w * 0.3), 0, 7); ctx.fillStyle = P.hi; ctx.fill();
        }
      } else if (labelFn && w > fs * 0.55) {
        const txt = labelFn(i);
        const [x, y] = D.pt(cx, cy, rc, thc);
        ctx.save(); ctx.translate(x, y); ctx.rotate(D.ang(thc));
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
    for (let th = a0; th <= a1 + 1e-9; th += (a1 - a0) / 8) { const [x, y] = D.pt(cx, cy, rb(th), th); ctx.lineTo(x, y); }
    for (let th = a1; th >= a0 - 1e-9; th -= (a1 - a0) / 8) { const [x, y] = D.pt(cx, cy, rb(th) + pitch, th); ctx.lineTo(x, y); }
    ctx.closePath();
  }
  // wskazówka ze ślizgaczem: ramię od środka, ślizgacz w bieżącym zwoju
  function spiralPointer(ctx, g, pos, P, R) {
    const th = g.thOf(pos);
    const rS = g.rb(th) + g.pitch / 2;
    D.pointer(ctx, g.cx, g.cy, th, 0, g.rb(g.turns * 360) + g.pitch * 1.05, P.brass, P.dark, Math.max(2, R * 0.022));
    const [x, y] = D.pt(g.cx, g.cy, rS, th);
    ctx.beginPath(); ctx.arc(x, y, g.pitch * 0.32, 0, 2 * Math.PI);
    ctx.fillStyle = P.brass2; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.dark; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, g.pitch * 0.12, 0, 2 * Math.PI); ctx.fillStyle = P.dark; ctx.fill();
    D.ball(ctx, g.cx, g.cy, R * 0.035, P.brass);
  }
  function subDial(ctx, x, y, r, labels, angle, P, fs, title) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = D.metal(ctx, x, y, r, D.shade(P.brass, 0.1), P.brass2); ctx.fill();
    ctx.strokeStyle = P.dark; ctx.lineWidth = 1; ctx.stroke();
    const n = labels.length;
    for (let i = 0; i < n; i++) {
      const a = i * 360 / n;
      const [x1, y1] = D.pt(x, y, r * 0.2, a), [x2, y2] = D.pt(x, y, r, a);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const lines = [].concat(labels[i]);
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
    const capt = (t, y) => { ctx.font = `${fs * 0.85}px Georgia, serif`; ctx.textAlign = 'center'; ctx.fillStyle = P.text; ctx.fillText(t, cx, y); };

    // --- Meton: 235 miesięcy w 5 zwojach ---
    const gm = spiralGeom(cx, cyM, R * 0.42, R, 5, 235);
    const cells = AM.METONIC_CELLS;
    drawSpiral(ctx, gm, P, fs, (i) => cells[i].name.slice(0, 4), null, st.metonic.cell);
    subDial(ctx, cx - R * 0.205, cyM, R * 0.19, AM.GAMES.map((g, i) => g.map((n, k) => n + (AM.GAMES_UNCERTAIN[i][k] ? '?' : ''))), st.games.angle, P, fs * 0.8, 'igrzyska');
    subDial(ctx, cx + R * 0.205, cyM, R * 0.19, GREEK_NUM, st.callippic.angle, P, fs, 'Kalippos');
    spiralPointer(ctx, gm, st.metonic.pos, P, R);
    capt('ΜΕΤΩΝ · 19 lat = 235 miesięcy', cyM - R - fs * 0.35);

    // --- Saros: 223 miesiące w 4 zwojach ---
    const gs = spiralGeom(cx, cyS, R * 0.4, R, 4, 223);
    const gl = AM.SAROS_GLYPHS;
    drawSpiral(ctx, gs, P, fs, null, (i) => (gl[i].lunar ? 'Σ' : '') + (gl[i].solar ? 'Η' : ''), st.saros.cell);
    subDial(ctx, cx, cyS, R * 0.24, [['', '0 h'], ['Η', '+8 h'], ['Ις', '+16 h']], st.exeligmos.angle, P, fs, null);
    spiralPointer(ctx, gs, st.saros.pos, P, R);
    capt('ΣΑΡΟΣ · 223 miesiące · exeligmos', cyS + R + fs * 1.0);
    ctx.font = `${fs * 0.65}px Georgia, serif`; ctx.fillStyle = P.text; ctx.globalAlpha = 0.85;
    ctx.fillText('Σ = zaćmienie Księżyca, Η = zaćmienie Słońca (model przybliżony)', cx, cyS + R + fs * 1.9);
    ctx.globalAlpha = 1;

    D.crank(ctx, W - W * 0.06, H / 2, W * 0.035, st.crank, P);
    return { cx, cy: H / 2 };
  }

  window.Views = window.Views || {};
  window.Views.back = { draw, aspect: 0.62 };
})();
