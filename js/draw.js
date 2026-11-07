/* Wspólne narzędzia rysowania (Canvas 2D). */
(function () {
  'use strict';
  const D = {};
  const rad = Math.PI / 180;
  D.rad = rad;

  // paleta z tokenów CSS
  D.palette = function () {
    const cs = getComputedStyle(document.documentElement);
    const g = (n) => cs.getPropertyValue(n).trim();
    return {
      plate: g('--c-plate'), plate2: g('--c-plate2'), brass: g('--c-brass'), brass2: g('--c-brass2'),
      dark: g('--c-dark'), text: g('--c-text'), sky: g('--c-sky'), silver: g('--c-silver'),
      gold: g('--c-gold'), hi: g('--c-hi'), bg: g('--bg'), muted: g('--muted')
    };
  };

  // kąt ekranowy (radiany) dla „długości” λ: 0 u góry, rośnie zgodnie z ruchem wskazówek zegara
  D.ang = (deg) => (deg - 90) * rad;
  D.pt = (cx, cy, r, deg) => [cx + r * Math.cos(D.ang(deg)), cy + r * Math.sin(D.ang(deg))];

  D.ring = function (ctx, cx, cy, r1, r2, fill, stroke) {
    ctx.beginPath();
    ctx.arc(cx, cy, r2, 0, 2 * Math.PI);
    ctx.arc(cx, cy, r1, 0, 2 * Math.PI, true);
    if (fill) { ctx.fillStyle = fill; ctx.fill('evenodd'); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  };

  // mosiężna płyta z gradientem
  D.metal = function (ctx, cx, cy, r, c1, c2) {
    const gr = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.05, cx, cy, r);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    return gr;
  };

  // Czy jakaś czcionka w systemie ma znak ch? Porównujemy piksele ze znakiem nieprzypisanym (U+0378),
  // który zawsze rysuje się jako „pusty prostokąt” (.notdef). Bez płótna 2D zakładamy, że jest.
  const glyphCache = {};
  D.hasGlyph = function (ch) {
    if (ch in glyphCache) return glyphCache[ch];
    let ok = true;
    try {
      const c = document.createElement('canvas'); c.width = c.height = 40;
      const x = c.getContext('2d', { willReadFrequently: true });
      const px = (s) => { x.clearRect(0, 0, 40, 40); x.font = '30px "Palatino Linotype", Palatino, Georgia, serif'; x.textBaseline = 'top'; x.fillText(s, 4, 4); return x.getImageData(0, 0, 40, 40).data.join(); };
      ok = px(ch) !== px('\u0378');
    } catch (e) { /* zostaje true */ }
    return (glyphCache[ch] = ok);
  };

  // tekst po łuku, wyśrodkowany na kącie deg
  D.arcText = function (ctx, text, cx, cy, r, deg, size, color, inward) {
    ctx.save();
    ctx.font = `${size}px "Palatino Linotype", Palatino, Georgia, serif`;
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const chars = [...text];
    const widths = chars.map((c) => ctx.measureText(c).width * 1.08);
    const total = widths.reduce((a, b) => a + b, 0);
    let a = deg * rad - (total / r) / 2;
    // na dole tarczy odwracamy, żeby było czytelne
    const flip = !inward && (((deg % 360) + 360) % 360 > 100 && ((deg % 360) + 360) % 360 < 260);
    if (flip) { chars.reverse(); widths.reverse(); }
    for (let i = 0; i < chars.length; i++) {
      const w = widths[i];
      const am = a + (w / r) / 2;
      ctx.save();
      ctx.translate(cx + r * Math.sin(am), cy - r * Math.cos(am));
      ctx.rotate(am + (flip ? Math.PI : 0));
      ctx.fillText(chars[i], 0, 0);
      ctx.restore();
      a += w / r;
    }
    ctx.restore();
  };

  // kulka (planeta, Słońce)
  D.ball = function (ctx, x, y, r, color, rim) {
    const gr = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, color); gr.addColorStop(1, shade(color, -0.45));
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = gr; ctx.fill();
    ctx.lineWidth = Math.max(1, r * 0.12); ctx.strokeStyle = rim || 'rgba(0,0,0,.55)'; ctx.stroke();
  };

  // kulka fazy Księżyca: phase 0 = nów, 180 = pełnia
  D.moonBall = function (ctx, x, y, r, phase, rimColor) {
    const p = ((phase % 360) + 360) % 360;
    const lit = '#f4f1e6', dark = '#16120e';
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = dark; ctx.fill();
    ctx.clip();
    const waxing = p < 180;
    // półkula oświetlona
    ctx.beginPath();
    ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, !waxing);
    ctx.closePath(); ctx.fillStyle = lit; ctx.fill();
    // terminator (elipsa)
    const k = Math.cos(p * rad);
    ctx.beginPath();
    ctx.ellipse(x, y, Math.abs(k) * r, r, 0, 0, 2 * Math.PI);
    ctx.fillStyle = k > 0 ? dark : lit; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.lineWidth = Math.max(1, r * 0.1); ctx.strokeStyle = rimColor; ctx.stroke();
  };

  // koło zębate
  D.gear = function (ctx, x, y, r, z, angleDeg, fill, stroke, opts) {
    opts = opts || {};
    const td = Math.min(r * 0.12, Math.max(2, (2 * Math.PI * r / z) * 0.45)); // wysokość zęba
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angleDeg * rad);
    ctx.beginPath();
    const n = z * 4;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * 2 * Math.PI;
      const ph = i % 4;
      const rr = (ph === 1 || ph === 2) ? r : r - td;
      if (i === 0) ctx.moveTo(rr * Math.cos(a), rr * Math.sin(a)); else ctx.lineTo(rr * Math.cos(a), rr * Math.sin(a));
    }
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = stroke; ctx.stroke();
    // szprychy / wycięcia
    if (r > 26) {
      const spokes = 4, ri = r * 0.72, hub = r * 0.18;
      ctx.fillStyle = opts.hole || 'rgba(0,0,0,.28)';
      for (let s = 0; s < spokes; s++) {
        const a0 = (s / spokes) * 2 * Math.PI + 0.22, a1 = ((s + 1) / spokes) * 2 * Math.PI - 0.22;
        ctx.beginPath();
        ctx.arc(0, 0, ri, a0, a1);
        ctx.arc(0, 0, hub * 1.6, a1 - 0.05, a0 + 0.05, true);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.beginPath(); ctx.arc(0, 0, Math.max(2.5, r * 0.08), 0, 2 * Math.PI);
    ctx.fillStyle = stroke; ctx.fill();
    // znacznik, żeby widać było obrót
    ctx.beginPath(); ctx.arc(r * 0.55, 0, Math.max(2, r * 0.05), 0, 2 * Math.PI); ctx.fillStyle = opts.mark || '#b3261e'; ctx.fill();
    ctx.restore();
  };

  function shade(hex, f) {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
    if (!m) return hex;
    const c = [1, 2, 3].map((i) => parseInt(m[i], 16));
    const out = c.map((v) => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f));
    return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  D.shade = shade;

  window.D = D;
})();
