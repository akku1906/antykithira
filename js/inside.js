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
    ['g1', 'm', 0], ['g2', 'a', 120, 0], ['h1', 'm', -90], ['h2', 'a', 120, 0], ['i1', 'm', 90]
  ];
  const OUT = {
    b1: 'Słońce, data', a1: 'korba', e2: 'Księżyc', n1: 'Meton', o1: 'igrzyska', q1: 'Kalippos',
    e3: 'pin-and-slot', g1: 'saros', i1: 'exeligmos'
  };
  const POS = (function () {
    const pos = { b1: { x: 0, y: 0 } };
    for (const [id, kind, a, b] of LAYOUT) {
      const g = AM.G[id], p = pos[g.p];
      if (kind === 'm') {
        const d = rOf(g.z) + rOf(AM.G[g.p].z) + 2, t = a * Math.PI / 180;
        pos[id] = { x: p.x + d * Math.cos(t), y: p.y + d * Math.sin(t) };
      } else pos[id] = { x: p.x + a, y: p.y + b, axle: g.p };
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
    const legendH = narrow ? Math.max(110, H * 0.3) : Math.max(70, H * 0.17);
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
    // pin-and-slot na e3 (Księżyc)
    {
      const [x, y] = X(POS.e3), R = rOf(223) * k;
      ctx.save(); ctx.translate(x, y); ctx.rotate(st.gearAngles.e3 * D.rad);
      const rk = R * 0.32, off = R * 0.07;
      ctx.beginPath(); ctx.arc(-off / 2, 0, rk, 0, 7); ctx.fillStyle = 'rgba(40,25,10,.55)'; ctx.fill();
      ctx.beginPath(); ctx.arc(off / 2, 0, rk, 0, 7); ctx.strokeStyle = P.silver; ctx.lineWidth = 1.2; ctx.stroke();
      const A = (st.moonAnom - st.gearAngles.e3) * D.rad;
      const px = -off / 2 + rk * 0.7 * Math.cos(A), py = rk * 0.7 * Math.sin(A);
      const sa = Math.atan2(py, px - off / 2);
      ctx.strokeStyle = P.silver; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(off / 2, 0); ctx.lineTo(off / 2 + rk * Math.cos(sa), rk * Math.sin(sa)); ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, 3, 0, 7); ctx.fillStyle = P.hi; ctx.fill();
      ctx.restore();
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
    return { cx: W / 2, cy: H / 2 };
  }

  window.Views = window.Views || {};
  window.Views.inside = { draw, aspect: (w) => (w < 640 ? 0.78 : 1.05) };
})();
