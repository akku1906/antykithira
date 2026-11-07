// Test silnika: node test.js
'use strict';
const AM = require('./js/engine.js');
let fail = 0, pass = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ok   ' + msg); } else { fail++; console.log('  BŁĄD ' + msg); } }
const absF = (f) => AM.F(Math.abs(f.n), f.d);
const eqF = (a, b) => a.n === b.n && a.d === b.d;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const angEq = (a, b, eps = 1e-6) => { const d = Math.abs(((a - b) % 360 + 540) % 360 - 180); return d < eps; };
const G = AM.G;
const rad = Math.PI / 180;
const dn0 = (a, b) => ((a - b) % 360 + 540) % 360 - 180;
// dawny wzór silnika (usunięty): atan2(e·sin M, 1 + e·cos M) – tylko do porównania w testach
const oldFormula = (Mdeg, e) => Math.atan2(e * Math.sin(Mdeg * rad), 1 + e * Math.cos(Mdeg * rad)) / rad;

console.log('1. Przełożenia z liczb zębów (ułamki dokładne)');
ok(eqF(absF(G.e2.rate), AM.F(254, 19)), 'Księżyc gwiazdowy e2 = 254/19 obr./rok → ' + AM.fstr(absF(G.e2.rate)));
ok(eqF(AM.R_SYNODIC, AM.F(235, 19)), 'Księżyc synodyczny = 235/19 obr./rok');
ok(eqF(absF(G.n1.rate), AM.F(5, 19)), 'Meton n1 = 5/19 (5 zwojów / 19 lat) → ' + AM.fstr(absF(G.n1.rate)));
ok(eqF(absF(G.q1.rate), AM.F(1, 76)), 'Kalippos q1 = 1/76 → ' + AM.fstr(absF(G.q1.rate)));
ok(eqF(absF(G.o1.rate), AM.F(1, 4)), 'Igrzyska o1 = 1/4 → ' + AM.fstr(absF(G.o1.rate)));
ok(eqF(absF(G.g1.rate), AM.fdiv(AM.F(4 * 235), AM.F(19 * 223))), 'Saros g1 = 4 obr./223 mies. = ' + AM.fstr(absF(G.g1.rate)));
ok(eqF(AM.fdiv(absF(G.i1.rate), absF(G.g1.rate)), AM.F(1, 12)), 'Exeligmos i1 = g1/12');
ok(eqF(AM.fdiv(AM.R_ANOMALY, AM.R_SYNODIC), AM.F(239, 223)), 'anomalia (przez e3) : synodyczny = 239/223 (relacja sarosu)');
ok(near(AM.Y / AM.R_APSIDES.v, 365.25 * 4237 / 477), 'e3: okres apsyd = ' + (1 / AM.R_APSIDES.v).toFixed(3) + ' roku');
for (const p of AM.PLANETS) ok(eqF(p.gearRatio, p.syn), `${p.pl}: zęby ${p.train} → ${AM.fstr(p.gearRatio)} = ${AM.fstr(p.syn)}`);
ok(eqF(AM.NODES.rate, AM.F(-5, 93)), 'Węzły (smok): 1 − 98/93 = −5/93 obr./rok');

console.log('1b. Tor księżycowy pin-and-slot: e5, k1, k2, e6, e1, b3 (Freeth i in. 2006)');
ok(['e5', 'k1', 'k2', 'e6', 'e1', 'b3'].every((id) => G[id]), 'koła toru są w GEARS (razem ' + AM.GEARS.length + ')');
ok(G.e5.z === G.k1.z && G.k2.z === G.e6.z && G.e1.z === G.b3.z, `zęby: e5 ${G.e5.z} = k1 ${G.k1.z}, k2 ${G.k2.z} = e6 ${G.e6.z}, e1 ${G.e1.z} = b3 ${G.b3.z} (tor nie mnoży prędkości)`);
ok(eqF(G.b3.rate, AM.F(254, 19)), 'średnia prędkość wskazówki z b3 = ' + AM.fstr(G.b3.rate) + ' obr./rok (dokładnie 254/19)');
const k1rel = AM.relRate('k1');
ok(eqF(k1rel, AM.fsub(AM.F(254, 19), AM.F(477, 4237))), 'k1 względem e3 = 254/19 − 477/4237 = ' + AM.fstr(k1rel) + ' obr./rok');
ok(near(1 / k1rel.v, 1 / (254 / 19 - 477 / 4237), 1e-15), 'okres anomalii z kół = ' + (365.25 / k1rel.v).toFixed(4) + ' d');
ok(eqF(AM.fdiv(k1rel, AM.R_SYNODIC), AM.F(239, 223)), 'z kół: 239 miesięcy anomalistycznych na 223 synodyczne');
ok(eqF(AM.relRate('k2'), k1rel) && eqF(AM.relRate('e6'), AM.F(-k1rel.n, k1rel.d)), 'k2 średnio jak k1, e6 przeciwnie (względem e3)');
{
  // Odchylenie od ruchu średniego w jednym miesiącu anomalistycznym, 3600 próbek (krok 0,1° fazy k1).
  // Przy maksimum funkcja jest gładka i płaska, więc błąd próbkowania ≤ ½·|A''|·(0,05°)² < 1e-6°;
  // tolerancja 1e-3° zostawia zapas na arytmetykę zmiennoprzecinkową.
  const Ta = 1 / k1rel.v; let mx = -1e9, mn = 1e9;
  for (let i = 0; i < 3600; i++) { const L = AM.lunarTrain(Ta * i / 3600, 0, 0); mx = Math.max(mx, L.anomaly); mn = Math.min(mn, L.anomaly); }
  const amax = Math.asin(AM.E_MOON) / rad;
  ok(Math.abs(mx - amax) < 1e-3 && Math.abs(-mn - amax) < 1e-3, `największe odchylenie ±${mx.toFixed(4)}° = arcsin(${AM.E_MOON}) = ${amax.toFixed(4)}° (Freeth 2006 dla 1,1/9,6 mm: 6,5°)`);
  const q = AM.lunarTrain(Ta / 4, 0, 0);
  ok(q.anomaly > 6 && q.k2 > q.k1, 'ćwierć miesiąca po perygeum Księżyc wyprzedza ruch średni (+' + q.anomaly.toFixed(2) + '°)');
}
{
  // kinematyka koło po kole wobec wzoru epicyklu Hipparcha (anomalia M od perygeum): true = średnia + atan2(e·sin M, 1 − e·cos M)
  // oraz wobec dotychczasowego wzoru silnika: średnia + atan2(e·sin M, 1 + e·cos M)
  let dEpi = 0, dOld = 0, at = 0;
  for (let i = 0; i <= 20000; i++) {
    const st = AM.state(AM.JD_START + i * 223 * AM.MONTH / 20000);
    const M = st.moonAnom * rad, e = AM.E_MOON;
    const epi = AM.norm(st.moonMean + Math.atan2(e * Math.sin(M), 1 - e * Math.cos(M)) / rad);
    const old = AM.norm(st.moonMean + oldFormula(st.moonAnom, e));
    const a = Math.abs(dn0(st.moonTrue, epi)), b = dn0(st.moonTrue, old);
    dEpi = Math.max(dEpi, a); if (Math.abs(b) > Math.abs(dOld)) { dOld = b; at = st.moonAnom; }
  }
  ok(dEpi < 1e-9, `kinematyka = epicykl Hipparcha (M od perygeum): największa różnica w sarosie ${dEpi.toExponential(1)}°`);
  const pred = AM.E_MOON * AM.E_MOON / rad;
  console.log(`       nowy model − stary wzór (jeden saros, 20001 próbek): największa różnica ${dOld.toFixed(3)}° przy anomalii ${at.toFixed(0)}°`);
  ok(Math.abs(Math.abs(dOld) - pred) < 0.01, `różnica = składnik 2. rzędu ≈ e²·sin 2M, amplituda e² = ${pred.toFixed(3)}° (stary wzór miał odwrócony znak tego składnika)`);
}

console.log('1c. Prawdziwe Słońce: ten sam pin-and-slot (e = 1/24, anomalia od perygeum)');
{
  const e = AM.E_SUN, s0 = AM.state(AM.JD_START);
  ok(typeof AM.pinSlot === 'undefined', 'stara funkcja pinSlot usunięta z silnika');
  // chwila, w której anomalia Słońca = M (anomalia rośnie 360° na rok mechanizmu)
  const jdAt = (M) => AM.JD_START + (((M - s0.sunAnom) % 360 + 360) % 360) / 360 * AM.Y;
  // prędkość prawdziwego Słońca względem średniego: różnica centralna ±0,01 d
  const rate = (jd) => { const h = 0.01, a = AM.state(jd - h), b = AM.state(jd + h); return dn0(b.sunTrue, a.sunTrue) / dn0(b.sunMean, a.sunMean) - 1; };
  const rP = rate(jdAt(0)), rA = rate(jdAt(180));
  ok(Math.abs(rP - e / (1 - e)) < 1e-6, `w perygeum Słońce szybsze o ${rP.toFixed(6)} = e/(1−e) = ${(e / (1 - e)).toFixed(6)} ruchu średniego`);
  ok(Math.abs(rA + e / (1 + e)) < 1e-6, `w apogeum Słońce wolniejsze o ${(-rA).toFixed(6)} = e/(1+e) = ${(e / (1 + e)).toFixed(6)}`);
  // odchylenie w jednym roku, 3600 próbek (krok 0,1° anomalii): błąd próbkowania maksimum < 1e-6°, tolerancja 1e-3°
  let mx = -1e9, mn = 1e9, dmax = 0, dAt = 0;
  for (let i = 0; i < 3600; i++) {
    const st = AM.state(AM.JD_START + AM.Y * i / 3600), a = dn0(st.sunTrue, st.sunMean);
    mx = Math.max(mx, a); mn = Math.min(mn, a);
    const d = dn0(AM.norm(st.sunMean + oldFormula(st.sunAnom, e)), st.sunTrue);
    if (Math.abs(d) > Math.abs(dmax)) { dmax = d; dAt = st.sunAnom; }
  }
  const amax = Math.asin(e) / rad;
  ok(Math.abs(mx - amax) < 1e-3 && Math.abs(-mn - amax) < 1e-3, `największe odchylenie Słońca ±${mx.toFixed(4)}° = arcsin(1/24) = ${amax.toFixed(4)}°`);
  console.log(`       stary − nowy wzór Słońca (jeden rok, 3600 próbek): największa różnica ${dmax.toFixed(4)}° przy anomalii ${dAt.toFixed(0)}°`);
  ok(Math.abs(Math.abs(dmax) - e * e / rad) < 0.002, `różnica Słońca = składnik 2. rzędu, amplituda e² = ${(e * e / rad).toFixed(4)}°`);
  const k = [0, 37, 90, 200, 333].every((u) => Math.abs(AM.slotAngle(u, 9.6, AM.D_K) - u - Math.atan2(AM.E_MOON * Math.sin(u * rad), 1 - AM.E_MOON * Math.cos(u * rad)) / rad) < 1e-12);
  ok(k, 'slotAngle (wspólna dla Księżyca i Słońca) = atan2(e·sin u, 1 − e·cos u)');
}

console.log('2. Powroty cykli (silnik stanu)');
const j0 = AM.JD_START, s0 = AM.state(j0);
const M = AM.MONTH;
ok(near(19 * AM.Y, 235 * M, 1e-9), '19 lat = 235 miesięcy synodycznych mechanizmu');
let s = AM.state(j0 + 223 * M);
ok(near(s.saros.pos % 223, s0.saros.pos, 1e-6) || near(s.saros.pos, 223, 1e-6), 'po 223 mies. wskazówka sarosu w komórce startowej (komórka ' + s.saros.cell + ', zwój ' + s.saros.turn + ')');
ok(s.saros.turn === s0.saros.turn && s.saros.cell === s0.saros.cell, 'ślizgacz sarosu wrócił na zwój 1');
ok(angEq(s.saros.angle, s0.saros.angle), 'kąt wskazówki sarosu = startowy (4 pełne obroty)');
ok(s.exeligmos.sector === 1, 'po 1 sarosie exeligmos w sektorze 2 (+8 h)');
s = AM.state(j0 + 669 * M);
ok(s.exeligmos.sector === 0 && angEq(s.exeligmos.angle, s0.exeligmos.angle), 'po 669 mies. exeligmos wraca do startu');
const jm = AM.JD_METON, sm0 = AM.state(jm);        // epoka kalendarza (Meton, Kalippos, igrzyska)
s = AM.state(jm + 235 * M);
ok(s.metonic.cell === 0 && sm0.metonic.cell === 0 && s.metonic.turn === 0, 'po 235 mies. od epoki kalendarza Meton w komórce 1, zwój 1');
s = AM.state(j0 + 235 * M);
ok(angEq(s.moonMean, s0.moonMean, 1e-6), 'po 19 latach (254 mies. gwiazdowe) Księżyc średni w tym samym miejscu');
ok(angEq(s.sunMean, s0.sunMean), 'po 19 latach Słońce średnie w tym samym miejscu');
ok(AM.state(jm + 19 * AM.Y).callippic.sector === 1, 'po 19 latach od epoki kalendarza tarcza Kalipposa w sektorze 2');
s = AM.state(jm + 940 * M);
ok(angEq(s.callippic.angle, sm0.callippic.angle) && s.callippic.sector === 0, 'po 76 latach (940 mies.) Kalippos wraca');
s = AM.state(j0 + 4 * AM.Y);
ok(s.games.year === s0.games.year && angEq(s.games.angle, s0.games.angle), 'po 4 latach tarcza igrzysk wraca');
s = AM.state(j0 + 2 * AM.Y);
ok(s.games.year === (s0.games.year + 2) % 4, 'po 2 latach igrzyska: ' + s.games.names.join(' + '));
for (const [id, yrs] of [['mercury', 480], ['venus', 462], ['mars', 284], ['jupiter', 344], ['saturn', 442]]) {
  const a = AM.state(j0).planets.find((p) => p.id === id), b = AM.state(j0 + yrs * AM.Y).planets.find((p) => p.id === id);
  ok(angEq(a.S, b.S, 1e-5) && angEq(a.lon, b.lon, 1e-5), `${id}: po ${yrs} latach ten sam cykl synodyczny i długość`);
}

const gn = AM.GAMES_PL.flat().map((n) => n.replace(' (?)', ''));
ok(new Set(gn).size === 6 && gn.length === 8, 'igrzyska: 8 pozycji, 6 różnych nazw: ' + gn.join(', '));
ok(AM.GAMES_PL[0].join() === 'Istmia,Olimpia' && AM.GAMES_PL[3][1].startsWith('Halieia'), 'rok 1: Istmia + Olimpia, rok 4: Nemea + Halieia');
console.log('2b. Kalendarz Metona (Freeth i in. 2008, ryc. S10)');
const MC = AM.METONIC_CELLS;
ok(MC.length === 235, '235 komórek');
ok(MC.reduce((a, c) => a + c.days, 0) === 6940, 'suma dni = 6940');
ok(MC.filter((c) => c.days === 30).length === 125 && MC.filter((c) => c.days === 29).length === 110, '125 miesięcy pełnych, 110 wydrążonych');
const leapYears = [...new Set(MC.filter((c) => c.leap).map((c) => c.year))].join(',');
ok(leapYears === '1,3,6,9,11,14,17', 'lata 13-miesięczne: ' + leapYears);
ok(MC[5].name === 'ΕΥΚΛΕΙΟΣ' && MC[6].name === 'ΕΥΚΛΕΙΟΣ' && MC[30].name === 'ΕΥΚΛΕΙΟΣ' && MC[31].name === 'ΕΥΚΛΕΙΟΣ', 'komórki 6–7 i 31–32: Eukleios');
ok(MC[13].name === 'ΦΟΙΝΙΚΑΙΟΣ' && MC[13].year === 2 && MC[234].name === 'ΑΠΕΛΛΑΙΟΣ', 'rok 2 zaczyna się w komórce 14, cykl kończy Apellaios');
const insc = [[1, 1], [33, 2], [35, 6], [37, 11], [39, 15], [41, 19], [43, 23], [45, 27]];
ok(insc.every(([c, d]) => MC[c - 1].exDay === d), 'dni opuszczone zgodne z liczbami pod komórkami 1, 33–45 (1, 2, 6, 11, 15, 19, 23, 27)');
const col = MC.slice(0, 47).map((c) => c.exDay).filter(Boolean).slice(0, 8).join(',');
ok(col === '1,5,9,13,17,21,26,30', 'pierwsza kolumna ryc. S10: ' + col);
ok(AM.EXCLUDED[21] + 64 === 1410, 'odstęp do następnego zwoju = 64 dni');
console.log('3. Kalendarze');
ok(AM.jdFromCal(1582, 10, 4, false) === 2299159.5, 'JD 4 X 1582 (jul.) = 2299159.5');
ok(AM.jdFromCal(2000, 1, 1.5, true) === 2451545, 'JD 1 I 2000 12h (greg.) = 2451545');
ok(AM.jdFromCal(-746, 2, 26.5, false) === AM.EG_EPOCH, 'era Nabonassara: 26 II 747 p.n.e. = JD ' + AM.EG_EPOCH);
const e0 = AM.egyptian(AM.EG_EPOCH);
ok(e0.month === 0 && e0.day === 1, 'w epoce Nabonassara jest 1 Thoth');
const c = AM.calFromJd(AM.JD_START, false);
ok(c.y === -204 && c.m === 4 && Math.abs(c.d - 28) <= 1, `start = ${c.d}.${c.m}.${1 - c.y} p.n.e. (nów ≈ 28 IV 205 p.n.e.)`);
console.log('3b. Epoki tarcz tylnych (Iversen 2017, s. 181–183; Jones 2020, ISAW Papers 17)');
const st0 = AM.state(AM.JD_START);
ok(st0.saros.cell === 0 && angEq(st0.saros.angle, 0), 'epoka sarosu: komórka 1, wskazówka u góry (kąt 0°)');
const cm = AM.calFromJd(AM.JD_METON, false);
ok(cm.y === -204 && cm.m === 8 && Math.abs(cm.d + cm.frac - 23.5) <= 1, `epoka kalendarza = nów ${cm.d}.${cm.m}.${1 - cm.y} p.n.e. (Iversen: 23 VIII 205 p.n.e.)`);
ok(near(AM.JD_METON - AM.JD_START, 4 * AM.MONTH, 1e-9) && near(AM.JD_METON, AM.meanNewMoon(AM.K_METON), 0.01), 'epoka kalendarza = epoka sarosu + 4 miesiące mechanizmu (≈ nów astronomiczny, różnica < 0,01 d)');
const stM = AM.state(AM.JD_METON + 1e-6);
ok(stM.metonic.cell === 0 && stM.metonic.info.name === 'ΦΟΙΝΙΚΑΙΟΣ' && stM.metonic.info.year === 1, 'w epoce kalendarza Meton: komórka 1 = Phoinikaios roku 1 (wskazówka w dół)');
ok(stM.games.year === 0 && angEq(stM.games.angle, 0, 1e-4), 'w epoce kalendarza igrzyska: rok 1 (Istmia + Olimpia)');
ok(stM.saros.cell === 4 && near(stM.saros.pos, 4, 1e-4), 'w epoce kalendarza saros na początku komórki 5 (Iversen 2017, ryc. 12)');
ok(Math.abs(stM.saros.angle - 26) < 1, `kąt sarosu w epoce kalendarza ${stM.saros.angle.toFixed(1)}° ≈ 26° (Jones 2020, przyp. 64)`);
ok(AM.EXELIGMOS_START === 30 && st0.exeligmos.sector === 0 && angEq(st0.exeligmos.angle, 30), 'epoka sarosu: exeligmos na początku sektora 0 h, wskazówka na godzinie 1 (30°; Jones 2020, akapit 41)');
ok(angEq(AM.state(AM.JD_START + 223 * AM.MONTH + 1e-6).exeligmos.angle, 150, 1e-4) && angEq(AM.state(AM.JD_START + 446 * AM.MONTH + 1e-6).exeligmos.angle, 270, 1e-4), 'granice sektorów +8 h i +16 h na godzinach 5 i 9 (150°, 270°)');
ok(Math.abs(stM.exeligmos.angle - 32) < 0.5 && Math.abs(stM.exeligmos.angle - stM.saros.angle) < 7, `w epoce kalendarza exeligmos ${stM.exeligmos.angle.toFixed(1)}° ≈ 32°, saros ${stM.saros.angle.toFixed(1)}°: wskazówki dolnych tarcz prawie równoległe (Jones 2020, akapit 109, przyp. 64)`);
{
  const ES = AM.EXELIGMOS_SECTORS;
  ok(ES.length === 3 && ES.map((s) => s.hours).join() === '0,8,16', 'exeligmos: sektory 0, +8, +16 h zgodnie z ruchem wskazówek od godziny 1');
  ok(ES[0].num === '' && ES[1].num === '\u0397' && ES[2].num === '\u0399\u03DA', 'oznaczenia z tarczy (Jones 2020, akapit 41): pusty, Η (eta, 8), ΙϚ (iota + stigma U+03DA, 16) – nie ς ani Α/Β/Γ');
  ok(ES[2].alt === '\u0399\u03A3\u03A4' && !ES.some((s) => /[\u03C2\u0391\u0392\u0393]/.test(s.num + (s.alt || ''))), 'zapis zastępczy bez stigmy: ΙΣΤ; nigdzie końcowej sigmy ani numerów Α/Β/Γ');
  const sec = (m) => AM.state(AM.JD_START + m * AM.MONTH + 1e-6).exeligmos.sector;
  ok(sec(0) === 0 && sec(223) === 1 && sec(446) === 2 && ES[sec(300)].num === 'Η', 'stan.sector wskazuje właściwy wpis tabeli (miesiąc 300 → Η)');
}
ok(st0.metonic.cell === 231, 'w epoce sarosu Meton w komórce 232 poprzedniego cyklu');
const eg = AM.egyptian(AM.JD_START);
console.log(`       start w kal. egipskim: ${eg.day} ${AM.EG_MONTHS_PL[eg.month]}`);

console.log('4. Zaćmienia (Meeus, średnie elementy)');
const kS = AM.kNear(AM.jdFromCal(2024, 4, 8, true));
ok(AM.eclipseAt(kS) && AM.eclipseAt(kS).type === 'S', 'zaćmienie Słońca 8 IV 2024 wykryte');
ok(!AM.eclipseAt(kS + 1), 'nów 8 V 2024 – brak zaćmienia');
const kL = AM.kNear(AM.jdFromCal(2022, 10, 25, true));
ok(AM.eclipseAt(kL + 0.5) && AM.eclipseAt(kL + 0.5).type === 'L', 'zaćmienie Księżyca 8 XI 2022 wykryte');
console.log('4b. Glify sarosu (Freeth 2014, EYM) i odczyty z fragmentów (Freeth 2008, ryc. S16)');
const SG = AM.SAROS_GLYPHS;
const nG = SG.filter((g) => g.lunar || g.solar).length, nGL = SG.filter((g) => g.lunar).length, nGS = SG.filter((g) => g.solar).length;
ok(nG === 51 && nGL === 38 && nGS === 28, `EYM: ${nG} glifów, ${nGL} Σ, ${nGS} Η (artykuł: 51, 38, 28)`);
const mism = Object.entries(AM.OBSERVED_GLYPHS).filter(([n, t]) => (SG[n - 1].lunar ? 'L' : '') + (SG[n - 1].solar ? 'S' : '') !== t);
ok(mism.length === 0, `wszystkie ${Object.keys(AM.OBSERVED_GLYPHS).length} odczytane glify zgodne z EYM` + (mism.length ? ' – niezgodne: ' + mism.map((m) => m[0]).join(',') : ''));
ok(SG[148].lunar && SG[148].solar, 'glif 149 = Σ+Η (jedyna różnica względem modelu z 2008)');
const agree = SG.filter((g) => (g.lunar || g.solar) && (g.lunar ? g.meeus.lunar || !g.lunar : true) && (g.solar ? g.meeus.solar : true)).length;
console.log(`       zgodność z Meeusem (lunacje od 28 IV 205 p.n.e.): ${agree}/51 glifów potwierdzonych w całości`);
const nS = AM.SAROS_GLYPHS.filter((g) => g.meeus.solar).length, nL = AM.SAROS_GLYPHS.filter((g) => g.meeus.lunar).length;
ok(nS >= 35 && nS <= 48 && nL >= 20 && nL <= 34, `saros od 205 p.n.e.: ${nS} zaćmień Słońca, ${nL} Księżyca (cieniowych)`);

console.log('5. Planety w epoce wobec JPL DE441 (test-dane/de441-205pne.json, niezależne od Meeusa)');
const DE = require('./test-dane/de441-205pne.json');
ok(near(DE.jd, AM.JD_START, 1e-6), 'dane DE441 dotyczą epoki modelu');
const dn = (a, b) => ((a - b) % 360 + 540) % 360 - 180;
const Lde = (el) => AM.norm(el.OM + el.W + el.MA);       // średnia długość oskulacyjna, J2000
const LE = Lde(DE.elementy.earth), eE = DE.elementy.earth.e, aE = DE.elementy.earth.a;
const stE = AM.state(AM.JD_START);
for (const p of AM.PLANETS) {
  const el = DE.elementy[p.id], g = DE.geo[p.id];
  // (a) faza synodyczna S0, którą model bierze ze średnich elementów Meeusa; tolerancja 1° pokrywa
  //     różnicę między długością średnią a oskulacyjną (u Saturna i Jowisza: wielka nierówność)
  const S0de = p.inner ? AM.norm(Lde(el) - LE) : AM.norm(LE + 180 - Lde(el));
  const dS = dn(p.S0, S0de);
  ok(Math.abs(dS) < 1, `${p.id}: faza synodyczna w epoce, model − DE441 = ${dS.toFixed(3)}° (< 1°)`);
  // (b) długość geocentryczna; model ma orbity kołowe, więc dopuszczam przesunięcie planety i Ziemi
  //     o 2e·a (rząd równania środka) widziane z odległości delta, plus 1° z punktu (a)
  const lim = Math.asin(Math.min(1, (2 * el.e * el.a + 2 * eE * aE) / g.delta)) / rad + 1;
  const dl = dn(stE.planets.find((q) => q.id === p.id).lon, g.lon);
  ok(Math.abs(dl) < lim, `${p.id}: długość geocentryczna, model − DE441 = ${dl.toFixed(2)}° (granica ${lim.toFixed(1)}° z mimośrodów)`);
}

console.log(`\n${pass} ok, ${fail} błędów`);
process.exit(fail ? 1 : 0);
