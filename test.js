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
ok(s.exeligmos.sector === 0 && angEq(s.exeligmos.angle, 0), 'po 669 mies. exeligmos wraca do startu');
s = AM.state(j0 + 235 * M);
ok(s.metonic.cell === s0.metonic.cell && s.metonic.turn === 0, 'po 235 mies. Meton w komórce 1, zwój 1');
ok(angEq(s.moonMean, s0.moonMean, 1e-6), 'po 19 latach (254 mies. gwiazdowe) Księżyc średni w tym samym miejscu');
ok(angEq(s.sunMean, s0.sunMean), 'po 19 latach Słońce średnie w tym samym miejscu');
ok(s.callippic.sector === 1, 'po 19 latach tarcza Kalipposa w sektorze 2');
s = AM.state(j0 + 940 * M);
ok(angEq(s.callippic.angle, s0.callippic.angle) && s.callippic.sector === 0, 'po 76 latach (940 mies.) Kalippos wraca');
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

console.log(`\n${pass} ok, ${fail} błędów`);
process.exit(fail ? 1 : 0);
