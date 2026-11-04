/* Widok przedni: zodiak, pierścień egipski, kosmos według Freeth i in. 2021. */
(function () {
  'use strict';
  const D = window.D, AM = window.AM;
  const ZOD = ['ΚΡΙΟΣ', 'ΤΑΥΡΟΣ', 'ΔΙΔΥΜΟΙ', 'ΚΑΡΚΙΝΟΣ', 'ΛΕΩΝ', 'ΠΑΡΘΕΝΟΣ', 'ΧΗΛΑΙ', 'ΣΚΟΡΠΙΟΣ', 'ΤΟΞΟΤΗΣ', 'ΑΙΓΟΚΕΡΩΣ', 'ΥΔΡΟΧΟΟΣ', 'ΙΧΘΥΕΣ'];
  // od środka: Księżyc (wskazówka), Merkury, Wenus, Słońce prawdziwe, Mars, Jowisz, Saturn, data
  const RINGS = [['mercury', 0.40], ['venus', 0.47], ['sun', 0.54], ['mars', 0.61], ['jupiter', 0.68], ['saturn', 0.75]];

  function draw(ctx, W, H, st, P) {
    const S = Math.min(W, H);
    const cx = W / 2, cy = H / 2, R = S * 0.47;
    const fs = Math.max(8, R * 0.042);

    // płyta prostokątna (obudowa)
    ctx.fillStyle = D.metal(ctx, cx, cy, S * 0.75, P.plate, P.plate2);
    roundRect(ctx, cx - S * 0.495, cy - S * 0.495, S * 0.99, S * 0.99, S * 0.03); ctx.fill();
    ctx.strokeStyle = P.dark; ctx.lineWidth = 1.5; ctx.stroke();

    // pierścień egipski (ruchomy)
    const rE1 = R * 0.9, rE2 = R;
    D.ring(ctx, cx, cy, rE1, rE2, D.metal(ctx, cx, cy, R, P.brass, P.brass2), P.dark);
    ctx.save();
    ctx.strokeStyle = P.dark;
    for (let d = 0; d < 365; d++) {
      const a = st.egRingRot + d * 360 / 365;
      const long = d % 30 === 0 || d === 360;
      ctx.lineWidth = long ? 1.4 : 0.6;
      const [x1, y1] = D.pt(cx, cy, rE1, a), [x2, y2] = D.pt(cx, cy, rE1 + (long ? R * 0.1 : R * 0.025), a);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.restore();
    for (let m = 0; m < 13; m++) {
      const span = m < 12 ? 30 : 5;
      const a = st.egRingRot + (m * 30 + span / 2) * 360 / 365;
      const name = m < 12 ? AM.EG_MONTHS[m] : 'ΕΠΑΓ';
      D.arcText(ctx, name, cx, cy, (rE1 + rE2) / 2 + R * 0.01, a, fs * (m < 12 ? 1 : 0.8), P.text);
    }
    // podświetlenie bieżącego dnia
    {
      const a0 = st.egRingRot + st.egyptian.dayIndex * 360 / 365;
      ctx.beginPath();
      ctx.arc(cx, cy, rE1 + R * 0.004, D.ang(a0), D.ang(a0 + 360 / 365));
      ctx.lineWidth = R * 0.03; ctx.strokeStyle = P.hi; ctx.globalAlpha = 0.6; ctx.stroke(); ctx.globalAlpha = 1;
    }

    // zodiak (nieruchomy)
    const rZ1 = R * 0.8, rZ2 = R * 0.89;
    D.ring(ctx, cx, cy, rZ1, rZ2, D.metal(ctx, cx, cy, R, D.shade(P.brass, 0.15), P.brass2), P.dark);
    ctx.strokeStyle = P.dark;
    for (let d = 0; d < 360; d++) {
      const long = d % 30 === 0;
      ctx.lineWidth = long ? 1.4 : (d % 5 === 0 ? 0.8 : 0.4);
      const len = long ? rZ2 - rZ1 : (d % 5 === 0 ? R * 0.022 : R * 0.012);
      const [x1, y1] = D.pt(cx, cy, rZ1, d), [x2, y2] = D.pt(cx, cy, rZ1 + len, d);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ZOD.forEach((z, i) => D.arcText(ctx, z, cx, cy, (rZ1 + rZ2) / 2 + R * 0.006, i * 30 + 15, fs * 0.95, P.text));

    // tło „nieba” wewnątrz
    ctx.beginPath(); ctx.arc(cx, cy, rZ1, 0, 2 * Math.PI);
    const sky = ctx.createRadialGradient(cx, cy, 0, cx, cy, rZ1);
    sky.addColorStop(0, D.shade(P.sky, 0.12)); sky.addColorStop(1, P.sky);
    ctx.fillStyle = sky; ctx.fill();

    // linie znaczników na pierścieniach
    const lons = { sun: st.sunTrue };
    st.planets.forEach((p) => { lons[p.id] = p.lon; });
    const colors = { sun: P.gold };
    AM.PLANETS.forEach((p) => { colors[p.id] = p.color; });
    const names = { sun: 'ΗΛΙΟΣ' };
    AM.PLANETS.forEach((p) => { names[p.id] = p.gr; });

    for (const [id, f] of RINGS) {
      const r = R * f, w = R * 0.045;
      D.ring(ctx, cx, cy, r - w / 2, r + w / 2, 'rgba(214,173,98,.20)', 'rgba(214,173,98,.55)');
    }
    // smok (węzły) – hipotetyczny według Freeth i in. 2021
    {
      const [hx, hy] = D.pt(cx, cy, R * 0.36, st.node), [tx, ty] = D.pt(cx, cy, R * 0.36, st.node + 180);
      ctx.strokeStyle = '#7fa37a'; ctx.lineWidth = Math.max(2, R * 0.012);
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
      dragonEnd(ctx, hx, hy, st.node, R * 0.04, '#7fa37a', true);
      dragonEnd(ctx, tx, ty, st.node + 180, R * 0.03, '#7fa37a', false);
    }
    // planety i Słońce prawdziwe na pierścieniach
    for (const [id, f] of RINGS) {
      const r = R * f, lon = lons[id];
      const [x, y] = D.pt(cx, cy, r, lon);
      // wskaźnik od znacznika do zodiaku
      const [zx, zy] = D.pt(cx, cy, rZ1, lon);
      ctx.strokeStyle = id === 'sun' ? P.gold : 'rgba(240,225,190,.5)';
      ctx.lineWidth = id === 'sun' ? Math.max(1.5, R * 0.008) : 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(zx, zy); ctx.stroke();
      D.ball(ctx, x, y, R * (id === 'sun' ? 0.034 : 0.024), colors[id]);
      if (id === 'sun') sunRays(ctx, x, y, R * 0.05, P.gold);
      D.arcText(ctx, names[id], cx, cy, r, lon + (id === 'sun' ? 9 : 7) + 2, fs * 0.62, 'rgba(250,236,205,.85)', false);
    }

    // wskazówka daty = Słońce średnie (b1), sięga do pierścienia egipskiego
    pointer(ctx, cx, cy, st.sunMean, R * 0.84, rE1 + R * 0.08, P.brass, P.dark, Math.max(2, R * 0.012));
    // wskazówka Księżyca
    pointer(ctx, cx, cy, st.moonTrue, 0, rZ2 - R * 0.01, P.silver, P.dark, Math.max(2, R * 0.016));
    const [mx, my] = D.pt(cx, cy, R * 0.25, st.moonTrue);
    D.moonBall(ctx, mx, my, R * 0.055, st.phase, P.dark);

    // oś
    D.ball(ctx, cx, cy, R * 0.035, P.brass);

    // korba z boku
    drawCrank(ctx, cx + S * 0.455, cy + S * 0.455, S * 0.035, st.crank, P);

    return { cx, cy };
  }

  function pointer(ctx, cx, cy, deg, r0, r1, color, edge, w) {
    const [x0, y0] = D.pt(cx, cy, r0, deg), [x1, y1] = D.pt(cx, cy, r1, deg);
    ctx.lineCap = 'round';
    ctx.strokeStyle = edge; ctx.lineWidth = w + 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.lineCap = 'butt';
  }
  function sunRays(ctx, x, y, r, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 2 * Math.PI;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75);
      ctx.lineTo(x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 1.1); ctx.stroke();
    }
  }
  function dragonEnd(ctx, x, y, deg, s, color, head) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(D.ang(deg));
    ctx.fillStyle = color; ctx.beginPath();
    if (head) { ctx.moveTo(s * 1.4, 0); ctx.lineTo(-s * 0.4, -s * 0.8); ctx.lineTo(-s * 0.1, 0); ctx.lineTo(-s * 0.4, s * 0.8); }
    else { ctx.moveTo(s, 0); ctx.lineTo(-s * 0.6, -s * 0.5); ctx.lineTo(-s * 0.6, s * 0.5); }
    ctx.closePath(); ctx.fill();
    if (head) { ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(s * 0.35, -s * 0.2, s * 0.13, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function drawCrank(ctx, x, y, r, deg, P) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI); ctx.fillStyle = P.brass2; ctx.fill();
    ctx.strokeStyle = P.dark; ctx.lineWidth = 1; ctx.stroke();
    ctx.rotate(deg * D.rad);
    ctx.lineCap = 'round'; ctx.strokeStyle = P.brass; ctx.lineWidth = r * 0.35;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 0.85, 0); ctx.stroke(); ctx.lineCap = 'butt';
    D.ball(ctx, r * 0.85, 0, r * 0.28, '#7a4a1e');
    ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  window.D.roundRect = roundRect;
  window.D.pointer = pointer;
  window.D.crank = drawCrank;

  window.Views = window.Views || {};
  window.Views.front = { draw, aspect: 1 };
})();
