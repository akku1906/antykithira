/* Widok „Wnętrze”: rozsunięty schemat głównych przekładni (rozmiary nie w skali). */
(function () {
  'use strict';
  const D = window.D, AM = window.AM;
  const rOf = (z) => 8.5 * Math.sqrt(z);
  // [id, 'm', kąt] – zazębienie z rodzicem pod kątem; [id, 'a', dx, dy] – ta sama oś, rozsunięte
  const LAYOUT = [
    ['a1', 'm', 180], ['b2', 'a', 210, 0],
    ['c1', 'm', -90], ['c2', 'a', 110, 0], ['d1', 'm', -90], ['d2', 'a', 150, 0], ['e2', 'm', 0],
    ['l1', 'm', 90], ['l2', 'a', 115, 0], ['m1', 'm', 90], ['m2', 'a', 130, 0], ['n1', 'm', 0],
    ['n2', 'a', 0, 110], ['p1', 'm', 180], ['p2', 'a', 0, 120], ['q1', 'm', 180],
    ['n3', 'a', 100, 0], ['o1', 'm', -45],
    ['m3', 'a', 0, 120], ['e3', 'm', 180], ['e4', 'a', 0, 260], ['f1', 'm', 0], ['f2', 'a', 0, 130],
    ['g1', 'm', 0], ['g2', 'a', 120, 0], ['h1', 'm', -90], ['h2', 'a', 120, 0], ['i1', 'm', 90],
    // tor księżycowy: e5, k1, k2, e6 rysowane na platformie e3; e1 na tej samej osi E (wewnętrzny wałek), b3 na osi b
    ['e1', 'a', -150, 120, 'e3'], ['b3', 'm', 180]
  ];
  const ON_E3 = ['e5', 'k1', 'k2', 'e6'];
  const OUT = {
    b1: 'Słońce, data', a1: 'korba', e2: 'Księżyc średni', n1: 'Meton', o1: 'igrzyska', q1: 'Kalippos',
    e3: 'platforma pin-and-slot', g1: 'saros', i1: 'exeligmos', b3: 'wskazówka Księżyca'
  };
  let zoom = false, e3Hit = null;            // powiększenie platformy e3 (dotknięcie)
  const POS = (function () {
    const pos = { b1: { x: 0, y: 0 } };
    for (const [id, kind, a, b, anchor] of LAYOUT) {
      const g = AM.G[id], p = pos[anchor || g.p];
      if (kind === 'm') {
        const d = rOf(g.z) + rOf(AM.G[g.p].z) + 2, t = a * Math.PI / 180;
        pos[id] = { x: p.x + d * Math.cos(t), y: p.y + d * Math.sin(t) };
      } else pos[id] = { x: p.x + a, y: p.y + b, axle: anchor || g.p };
    }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const id in pos) {
      const r = rOf(AM.G[id].z); const q = pos[id];
      x0 = Math.min(x0, q.x - r); y0 = Math.min(y0, q.y - r); x1 = Math.max(x1, q.x + r); y1 = Math.max(y1, q.y + r);
    }
    pos._box = { x0, y0, x1, y1 };
    return pos;
  })();

  function draw(ctx, W, H, st, P) {
    ctx.fillStyle = D.metal(ctx, W / 2, H / 2, W * 0.8, D.shade(P.plate2, -0.2), D.shade(P.plate2, -0.5));
    D.roundRect(ctx, 2, 2, W - 4, H - 4, W * 0.03); ctx.fill();
    const narrow = W < 640;
    const legendH = narrow ? Math.max(150, H * 0.34) : Math.max(110, H * 0.22);
    const box = POS._box, bw = box.x1 - box.x0, bh = box.y1 - box.y0;
    const pad = W * 0.04;
    const k = Math.min((W - 2 * pad) / bw, (H - legendH - 2 * pad) / bh);
    const ox = (W - bw * k) / 2 - box.x0 * k, oy = pad - box.y0 * k;
    const X = (q) => [ox + q.x * k, oy + q.y * k];
    const fs = Math.max(9, 13 * Math.min(1, W / 700));

    // osie (przerywane linie dla kół na wspólnej osi)
    ctx.setLineDash([4, 4]); ctx.strokeStyle = P.gold; ctx.lineWidth = 1.5;
    for (const id in POS) {
      const q = POS[id]; if (!q.axle) continue;
      const [x1, y1] = X(q), [x2, y2] = X(POS[q.axle]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.setLineDash([]);
    // koła – większe najpierw
    const ids = Object.keys(POS).filter((i) => i[0] !== '_').sort((a, b) => AM.G[b].z - AM.G[a].z);
    for (const id of ids) {
      const g = AM.G[id], [x, y] = X(POS[id]), r = rOf(g.z) * k;
      const hot = !!OUT[id];
      D.gear(ctx, x, y, r, g.z, st.gearAngles[id], hot ? P.brass : D.shade(P.brass2, 0.05), P.dark, { mark: P.hi });
    }
    // tor księżycowy na platformie e3 (w schemacie) i linia osi b: b3 – b1 (rurka do przodu)
    {
      const [x, y] = X(POS.e3), R = rOf(223) * k;
      platform(ctx, x, y, R, st, P, false, fs);
      e3Hit = { x, y, r: R };
      const [bx, by] = X(POS.b3), [b1x, b1y] = X(POS.b1);
      ctx.setLineDash([2, 5]); ctx.strokeStyle = P.silver; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(b1x, b1y); ctx.stroke(); ctx.setLineDash([]);
    }
    // podpisy
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const id of ids) {
      const g = AM.G[id], [x, y] = X(POS[id]), r = rOf(g.z) * k;
      ctx.font = `bold ${fs}px Georgia, serif`;
      const t1 = narrow ? id : `${id} · ${g.z}`;
      const ty = y + r * 0.45;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,12,4,.8)'; ctx.strokeText(t1, x, ty);
      ctx.fillStyle = '#fff3d6'; ctx.fillText(t1, x, ty);
      if (OUT[id]) {
        ctx.font = `${fs * 0.95}px Georgia, serif`;
        ctx.strokeText(OUT[id], x, ty + fs * 1.1); ctx.fillStyle = P.gold; ctx.fillText(OUT[id], x, ty + fs * 1.1);
      }
    }
    // legenda: przekładnie planetarne (Freeth i in. 2021)
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const lx = pad, ly = H - legendH + 4, lfs = Math.max(9, Math.min(13, W / 62));
    ctx.font = `bold ${lfs}px Georgia, serif`; ctx.fillStyle = P.gold;
    ctx.fillText('Przekładnie planetarne na b1 (Freeth i in. 2021) – cykle synodyczne / lata:', lx, ly);
    ctx.font = `${lfs}px Georgia, serif`; ctx.fillStyle = '#f3e6cc';
    const items = AM.PLANETS.map((p) => `${p.pl} ${AM.fstr(p.syn)}: ${p.train}`).concat([`Smok (węzły) −5/93: ${AM.NODES.train}`]);
    const cols = narrow ? 1 : 2, colW = (W - 2 * pad) / cols;
    items.forEach((t, i) => ctx.fillText(t, lx + (i % cols) * colW, ly + lfs * 1.45 * (1 + Math.floor(i / cols))));
    const ly2 = ly + lfs * 1.45 * (1 + Math.ceil(items.length / cols)) + lfs * 0.3;
    ctx.font = `bold ${lfs}px Georgia, serif`; ctx.fillStyle = P.gold;
    ctx.fillText(narrow ? 'Księżyc na e3 (Freeth i in. 2006) – dotknij e3:' : 'Księżyc na e3 (Freeth i in. 2006) – dotknij e3 albo naciśnij Z, aby powiększyć platformę:', lx, ly2);
    ctx.font = `${lfs}px Georgia, serif`; ctx.fillStyle = '#f3e6cc';
    const lun = [`e2 = e5 (50) ~ k1 (50) ⇢ kołek/szczelina ⇢ k2 (50) ~ e6 (50) = e1 (32) ~ b3 (32)`,
      `średnio ${AM.fstr(AM.G.b3.rate)} obr./rok; k1 względem e3: ${AM.fstr(AM.relRate('k1'))} (miesiąc anomalistyczny)`];
    lun.forEach((t, i) => ctx.fillText(t, lx, ly2 + lfs * 1.45 * (i + 1)));
    if (zoom) zoomed(ctx, W, H, st, P, fs);
    return { cx: W / 2, cy: H / 2 };
  }

  /*
   * Platforma e3 z kołami e5, k1, k2, e6 (rozmiary w schemacie, nie w skali). Kąty kół z silnika:
   * k1 jednostajnie, k2 prowadzone kołkiem. Przesunięcie osi K′ jest pokazane powiększone (EXAG razy),
   * a szczelina jest zawsze rysowana od K′ przez kołek – dokładnie tak, jak prowadzi ją kołek.
   */
  const EXAG = 3;
  function platform(ctx, x, y, R, st, P, big, fs) {
    const L = st.lunar, G = AM.G;
    const r5 = R * (big ? 0.3 : 0.2), rk = r5, dK = r5 + rk + 1;    // e5 i k1: po 50 zębów
    const rPin = rk * 0.62, d = AM.E_MOON * rPin * EXAG;
    ctx.save(); ctx.translate(x, y); ctx.rotate(L.e3 * D.rad);       // układ platformy
    const kx = dK, ky = 0;                                           // oś K
    // warstwa dolna: e5 (oś E) i k1 (oś K)
    const relE5 = (st.gearAngles.e5 - L.e3), relK1 = L.k1;
    D.gear(ctx, 0, 0, r5, G.e5.z, relE5, D.shade(P.brass, -0.05), P.dark, { mark: P.hi });
    D.gear(ctx, kx, ky, rk, G.k1.z, relK1, P.brass, P.dark, { mark: P.hi });
    // warstwa górna: e6 (oś E) i k2 (oś K′) – półprzezroczyste, nieco większe, żeby było widać obie warstwy
    ctx.globalAlpha = 0.55;
    D.gear(ctx, 0, 0, r5 * 1.06, G.e6.z, L.e6 - L.e3, D.shade(P.silver, -0.25), P.dark, {});
    const k2x = kx + d, k2y = ky;                                    // oś K′
    const pa = relK1 * D.rad, px = kx + rPin * Math.cos(pa), py = ky + rPin * Math.sin(pa);
    const sa = Math.atan2(py - k2y, px - k2x);                       // kierunek szczeliny
    D.gear(ctx, k2x, k2y, rk * 1.06, G.k2.z, sa / D.rad, D.shade(P.silver, -0.25), P.dark, {});
    ctx.globalAlpha = 1;
    // szczelina w k2 i kołek na k1
    const sw = Math.max(2.5, rk * 0.09);
    ctx.save(); ctx.translate(k2x, k2y); ctx.rotate(sa);
    ctx.fillStyle = 'rgba(15,8,2,.85)'; D.roundRect(ctx, rk * 0.25, -sw / 2, rk * 0.7, sw, sw / 2); ctx.fill();
    ctx.restore();
    // ramiona: k1 (złote) od K do kołka, k2 (srebrne) wzdłuż szczeliny od K′
    ctx.lineWidth = Math.max(1.5, rk * (big ? 0.06 : 0.05));
    ctx.strokeStyle = P.gold; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(px, py); ctx.stroke();
    ctx.strokeStyle = '#e8e8f0'; ctx.beginPath(); ctx.moveTo(k2x, k2y); ctx.lineTo(k2x + rk * 0.95 * Math.cos(sa), k2y + rk * 0.95 * Math.sin(sa)); ctx.stroke();
    ctx.beginPath(); ctx.arc(px, py, Math.max(2.5, rk * (big ? 0.09 : 0.07)), 0, 7); ctx.fillStyle = P.hi; ctx.fill();
    ctx.beginPath(); ctx.arc(kx, ky, 2, 0, 7); ctx.fillStyle = P.gold; ctx.fill();
    ctx.beginPath(); ctx.arc(k2x, k2y, 2, 0, 7); ctx.fillStyle = '#e8e8f0'; ctx.fill();
    ctx.restore();
    if (!big) return;
    // podpisy (poziome, w położeniach obróconych razem z platformą)
    const rot = (qx, qy) => { const c = Math.cos(L.e3 * D.rad), s = Math.sin(L.e3 * D.rad); return [x + qx * c - qy * s, y + qx * s + qy * c]; };
    const lab = (t, qx, qy, col) => {
      const [tx, ty] = rot(qx, qy);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,12,4,.85)'; ctx.strokeText(t, tx, ty);
      ctx.fillStyle = col || '#fff3d6'; ctx.fillText(t, tx, ty);
    };
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold ${fs}px Georgia, serif`;
    lab('e5 · e6 (oś E)', 0, -r5 - fs * 0.9);
    lab('k1 · k2', kx, ky - rk - fs * 0.9);
    ctx.font = `${fs * 0.9}px Georgia, serif`;
    lab('kołek k1', kx + (px - kx) / rPin * (rk + fs * 1.6), ky + (py - ky) / rPin * (rk + fs * 1.6), '#ffc2b0');
    ctx.font = `bold ${fs}px Georgia, serif`;
    lab('platforma e3', 0, R * 0.62, P.gold);
  }

  function zoomed(ctx, W, H, st, P, fs) {
    ctx.fillStyle = '#140c04'; ctx.fillRect(0, 0, W, H);
    const R = Math.min(W * 0.46, H * 0.36), x = W / 2, y = R + fs * 3.2;
    D.gear(ctx, x, y, R, 223, st.gearAngles.e3, D.shade(P.brass2, 0.05), P.dark, { mark: P.hi, hole: 'rgba(0,0,0,.12)' });
    platform(ctx, x, y, R, st, P, true, fs);
    const A = st.lunar.anomaly;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${fs * 1.15}px Georgia, serif`; ctx.fillStyle = P.gold;
    ctx.fillText('Platforma e3: anomalia Księżyca (pin-and-slot)', W / 2, fs * 1.4);
    const ty = y + R + fs * 1.6, lh = fs * 1.45;
    ctx.font = `bold ${fs * 1.1}px Georgia, serif`; ctx.fillStyle = A >= 0 ? '#9fe0a0' : '#f0a090';
    ctx.fillText(`k2 − k1 = ${A >= 0 ? '+' : ''}${A.toFixed(2)}° · k2 ${A >= 0 ? 'wyprzedza' : 'zostaje za'} k1`, W / 2, ty);
    // pasek odchylenia (±6,3°)
    const bw = Math.min(W * 0.7, 360), bx = W / 2 - bw / 2, by = ty + lh * 0.7, amax = Math.asin(AM.E_MOON) / D.rad;
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(bx, by, bw, 6);
    ctx.fillStyle = P.hi; ctx.fillRect(W / 2 + Math.min(0, A / amax) * bw / 2, by, Math.abs(A / amax) * bw / 2, 6);
    ctx.fillStyle = '#f3e6cc'; ctx.fillRect(W / 2 - 1, by - 3, 2, 12);
    ctx.font = `${fs * 0.9}px Georgia, serif`; ctx.fillStyle = '#f3e6cc';
    const lines = [
      'k1 kręci się równo; kołek w szczelinie k2 (oś przesunięta) raz je przyspiesza, raz zwalnia.',
      `Okres: miesiąc anomalistyczny, ${(AM.Y / AM.relRate('k1').v).toFixed(2)} d. Największe odchylenie ±${amax.toFixed(1)}°.`,
      `Przesunięcie osi K′ narysowane ${EXAG}× większe (w modelu ${AM.D_K.toFixed(2)} mm przy kołku ${AM.R_PIN} mm).`,
      'Złote ramię: k1 → kołek. Srebrne: szczelina k2. Dotknij, aby zamknąć.'
    ];
    let yy = by + lh * 1.2;
    for (const t of lines) yy = wrap(ctx, t, W / 2, yy, W * 0.92, lh);
  }
  function wrap(ctx, text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = w; } else line = test;
    }
    ctx.fillText(line, x, y); return y + lh;
  }
  function tap(px, py) {
    if (zoom) { zoom = false; return true; }
    if (e3Hit && Math.hypot(px - e3Hit.x, py - e3Hit.y) <= e3Hit.r) { zoom = true; return true; }
    return false;
  }

  window.Views = window.Views || {};
  window.Views.inside = { draw, tap, toggleZoom: () => { zoom = !zoom; }, aspect: (w) => (w < 640 ? 0.72 : 0.98) };
})();
