/*
 * Silnik czasu i przełożeń Mechanizmu z Antykithiry.
 * Działa w przeglądarce (window.AM) i w Node (module.exports).
 *
 * Zasada: czas trzymamy jako dzień juliański (JD). Główne koło b1 obraca się
 * raz na „rok mechanizmu” Y = 365¼ dnia (rok Kalipposa: 76 lat = 940 miesięcy
 * = 27 759 dni). Każda inna wielkość jest iloczynem przełożeń kół zębatych,
 * liczonym na ułamkach dokładnych. Położenia początkowe (w dniu startu) bierzemy
 * ze średnich elementów orbit (Meeus) — to nasza kalibracja, nie część mechanizmu.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AM = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- ułamki dokładne ----------
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
  function F(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    return { n: n / g, d: d / g, v: n / d };
  }
  const fmul = (a, b) => F(a.n * b.n, a.d * b.d);
  const fdiv = (a, b) => F(a.n * b.d, a.d * b.n);
  const fsub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
  const fstr = (a) => a.d === 1 ? String(a.n) : a.n + '/' + a.d;

  // ---------- stałe mechanizmu ----------
  const Y = 365.25;                 // rok mechanizmu [dni]
  const MONTH = Y * 19 / 235;       // miesiąc synodyczny mechanizmu = 29,5309 d

  // ---------- koła zębate (Freeth i in. 2006, Wright; korba a1 – rekonstrukcja) ----------
  // rel: 'mesh' – zazębia się z rodzicem (odwraca kierunek), 'arbor' – na tej samej osi.
  const GEARS = [
    { id: 'b1', z: 224, note: 'główne koło napędowe – 1 obrót / rok' },
    { id: 'a1', z: 48, p: 'b1', rel: 'mesh', note: 'korba (zębnik czołowy; liczba zębów rekonstruowana)' },
    { id: 'b2', z: 64, p: 'b1', rel: 'arbor' },
    { id: 'c1', z: 38, p: 'b2', rel: 'mesh' },
    { id: 'c2', z: 48, p: 'c1', rel: 'arbor' },
    { id: 'd1', z: 24, p: 'c2', rel: 'mesh' },
    { id: 'd2', z: 127, p: 'd1', rel: 'arbor' },
    { id: 'e2', z: 32, p: 'd2', rel: 'mesh', note: 'Księżyc gwiazdowy 254/19 obr./rok' },
    { id: 'l1', z: 38, p: 'b2', rel: 'mesh' },
    { id: 'l2', z: 53, p: 'l1', rel: 'arbor' },
    { id: 'm1', z: 96, p: 'l2', rel: 'mesh' },
    { id: 'm2', z: 15, p: 'm1', rel: 'arbor' },
    { id: 'm3', z: 27, p: 'm1', rel: 'arbor' },
    { id: 'n1', z: 53, p: 'm2', rel: 'mesh', note: 'wskazówka Metona – 5 obr. / 19 lat' },
    { id: 'n2', z: 15, p: 'n1', rel: 'arbor' },
    { id: 'n3', z: 57, p: 'n1', rel: 'arbor' },
    { id: 'o1', z: 60, p: 'n3', rel: 'mesh', note: 'tarcza igrzysk – 1 obr. / 4 lata' },
    { id: 'p1', z: 60, p: 'n2', rel: 'mesh' },
    { id: 'p2', z: 12, p: 'p1', rel: 'arbor' },
    { id: 'q1', z: 60, p: 'p2', rel: 'mesh', note: 'tarcza Kalipposa – 1 obr. / 76 lat' },
    { id: 'e3', z: 223, p: 'm3', rel: 'mesh', note: 'platforma pin-and-slot – precesja apsyd ≈ 8,88 roku' },
    { id: 'e4', z: 188, p: 'e3', rel: 'arbor' },
    { id: 'f1', z: 53, p: 'e4', rel: 'mesh' },
    { id: 'f2', z: 30, p: 'f1', rel: 'arbor' },
    { id: 'g1', z: 54, p: 'f2', rel: 'mesh', note: 'wskazówka sarosu – 4 obr. / 223 miesiące' },
    { id: 'g2', z: 20, p: 'g1', rel: 'arbor' },
    { id: 'h1', z: 60, p: 'g2', rel: 'mesh' },
    { id: 'h2', z: 15, p: 'h1', rel: 'arbor' },
    { id: 'i1', z: 60, p: 'h2', rel: 'mesh', note: 'tarcza exeligmos – 1 obr. / 669 miesięcy' },
    // tor księżycowy pin-and-slot (Freeth i in. 2006, SI „The Lunar Anomaly”): koła k1 i k2 mają osie
    // na platformie e3 ('on: e3' – zazębienie liczone względem platformy)
    { id: 'e5', z: 50, p: 'e2', rel: 'arbor', note: 'zewnętrzny wałek osi E (z e2), wewnątrz e3' },
    { id: 'k1', z: 50, p: 'e5', rel: 'mesh', on: 'e3', note: 'oś K na e3; kołek na tarczy' },
    { id: 'k2', z: 50, p: 'k1', rel: 'pin', on: 'e3', note: 'oś K′ przesunięta; szczelina prowadzona kołkiem k1' },
    { id: 'e6', z: 50, p: 'k2', rel: 'mesh', on: 'e3' },
    { id: 'e1', z: 32, p: 'e6', rel: 'arbor', note: 'wewnętrzny wałek osi E' },
    { id: 'b3', z: 32, p: 'e1', rel: 'mesh', note: 'Księżyc prawdziwy – rurka do wskazówki z przodu' }
  ];
  const G = {};
  for (const g of GEARS) {
    if (!g.p) g.rate = F(1);
    else {
      const p = G[g.p];
      if (g.rel === 'arbor') g.rate = p.rate;
      else if (g.rel === 'pin') g.rate = p.rate;                    // średnio tyle samo obrotów co k1
      else if (g.on) {                                              // zazębienie na obracającej się platformie
        const c = G[g.on].rate;
        g.rate = fsub(c, fmul(fsub(p.rate, c), F(p.z, g.z)));
      } else g.rate = fmul(p.rate, F(-p.z, g.z));
    }
    G[g.id] = g;
  }
  const relRate = (id) => fsub(G[id].rate, G[G[id].on || 'e3'].rate);  // obroty względem platformy e3

  // Księżyc: e2 daje ruch gwiazdowy, e3 obraca platformę, a z kół wynika reszta.
  const R_SIDEREAL = G.b3.rate;                                   // średnio 254/19 obr./rok (wskazówka z b3)
  const R_APSIDES = F(Math.abs(G.e3.rate.n), G.e3.rate.d);        // 477/4237 obr./rok
  const R_ANOMALY = relRate('k1');                                // k1 względem e3: 56165/4237 obr./rok
  const R_SYNODIC = fsub(R_SIDEREAL, F(1));                       // 235/19

  // ---------- planety: Freeth i in. 2021, ryc. 3e–f (cykle synodyczne / lata) ----------
  const PLANETS = [
    { id: 'mercury', pl: 'Merkury', gr: 'ΣΤΙΛΒΩΝ', inner: true, syn: F(1513, 480), a: 0.387,
      train: '51 ~ 72 + 89 ~ 40 ~ 20 ⊕ popychacz', gears: [[51, 72], [89, 20]], color: '#3fb5a8', L0: [252.250906, 149472.6746358] },
    { id: 'venus', pl: 'Wenus', gr: 'ΦΩΣΦΟΡΟΣ', inner: true, syn: F(289, 462), a: 0.723,
      train: '51 ~ 44 + 34 ~ 26 ~ 63 ⊕ popychacz', gears: [[51, 44], [34, 63]], color: '#3a5fcd', L0: [181.979801, 58517.8156760] },
    { id: 'mars', pl: 'Mars', gr: 'ΠΥΡΟΕΙΣ', inner: false, syn: F(133, 284), a: 1.524,
      train: '56 ~ 64 + 38 ~ 40 ~ 71 ⊕ 80 ~ 80', gears: [[56, 64], [38, 71]], color: '#c0392b', L0: [355.433275, 19140.2993313] },
    { id: 'jupiter', pl: 'Jowisz', gr: 'ΦΑΕΘΩΝ', inner: false, syn: F(315, 344), a: 5.203,
      train: '56 ~ 64 + 45 ~ 40 ~ 43 ⊕ 65 ~ 65', gears: [[56, 64], [45, 43]], color: '#e8e2d0', L0: [34.351484, 3034.9056746] },
    { id: 'saturn', pl: 'Saturn', gr: 'ΦΑΙΝΩΝ', inner: false, syn: F(427, 442), a: 9.537,
      train: '56 ~ 52 + 61 ~ 40 ~ 68 ⊕ 86 ~ 86', gears: [[56, 52], [61, 68]], color: '#2b2b2b', L0: [50.077471, 1222.1137943] }
  ];
  // przełożenie z liczb zębów (idlery się skracają) musi dać okres z artykułu
  for (const p of PLANETS) {
    p.gearRatio = fmul(F(p.gears[0][0], p.gears[0][1]), F(p.gears[1][0], p.gears[1][1]));
  }
  const NODES = { train: '49 ~ 62 + 64 ~ 48', rel: fmul(F(49, 62), F(64, 48)) };   // 98/93 względem b1
  NODES.rate = fsub(F(1), NODES.rel);                                              // −5/93 obr./rok

  // ---------- kalendarze ----------
  function jdFromCal(y, m, d, gregorian) {
    if (m <= 2) { y -= 1; m += 12; }
    let B = 0;
    if (gregorian) { const A = Math.floor(y / 100); B = 2 - A + Math.floor(A / 4); }
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function calFromJd(jd, gregorian) {
    const Z = Math.floor(jd + 0.5), Fr = jd + 0.5 - Z;
    let A = Z;
    if (gregorian) { const al = Math.floor((Z - 1867216.25) / 36524.25); A = Z + 1 + al - Math.floor(al / 4); }
    const B = A + 1524, C = Math.floor((B - 122.1) / 365.25), D = Math.floor(365.25 * C), E = Math.floor((B - D) / 30.6001);
    const day = B - D - Math.floor(30.6001 * E) + Fr;
    const month = E < 14 ? E - 1 : E - 13;
    const year = month > 2 ? C - 4716 : C - 4715;
    return { y: year, m: month, d: Math.floor(day), frac: day - Math.floor(day) };
  }
  const EG_EPOCH = 1448638;          // 1 Thoth roku 1 ery Nabonassara = 26 II 747 p.n.e. (jul.), JD w południe
  const EG_MONTHS = ['ΘΩΘ', 'ΦΑΩΦΙ', 'ΑΘΥΡ', 'ΧΟΙΑΚ', 'ΤΥΒΙ', 'ΜΕΧΙΡ', 'ΦΑΜΕΝΩΘ', 'ΦΑΡΜΟΥΘΙ', 'ΠΑΧΩΝ', 'ΠΑΥΝΙ', 'ΕΠΙΦΙ', 'ΜΕΣΟΡΗ', 'ΕΠΑΓΟΜΕΝΑΙ'];
  const EG_MONTHS_PL = ['Thoth', 'Phaophi', 'Athyr', 'Choiak', 'Tybi', 'Mechir', 'Phamenoth', 'Pharmuthi', 'Pachon', 'Payni', 'Epiphi', 'Mesore', 'dni epagomenalne'];
  function egyptian(jd) {
    const x = jd - EG_EPOCH;                         // liczone od południa 1 Thoth
    const dayCont = ((x % 365) + 365) % 365;         // ciągła pozycja w roku [0,365)
    const di = Math.floor(dayCont);
    return { dayCont, dayIndex: di, month: Math.floor(di / 30), day: di % 30 + 1 };
  }

  // ---------- start: hipoteza Carmana i Evansa (2014) ----------
  // Miesiąc 1 sarosu zaczyna się nowiem ok. 28 IV 205 p.n.e. (pełnia 12 V 205 p.n.e.).
  const LUN0 = 2451550.09766, SYN_TRUE = 29.530588861;
  const kNear = (jd) => Math.round((jd - LUN0) / SYN_TRUE);
  const meanNewMoon = (k) => LUN0 + SYN_TRUE * k;
  const K_START = kNear(jdFromCal(-204, 4, 28));
  const JD_START = meanNewMoon(K_START);
  // Epoka kalendarza (spirala Metona, igrzyska, Kalippos) jest o 4 miesiące późniejsza:
  // Phoinikaios 1 roku 1 zaczyna się tuż po nowiu 23 VIII 205 p.n.e., a wskazówka sarosu
  // stoi wtedy na początku komórki 5 (Iversen 2017, Hesperia 86, s. 181–183 i ryc. 12;
  // tak samo Carman 2017 i Jones 2020, ISAW Papers 17, przyp. 64).
  const METON_OFFSET = 4;
  // Tarcza exeligmos: kreski podziału na godzinach 1, 5 i 9; cykl (sektor pusty, 0 h) zaczyna się
  // przy wskazówce na godzinie 1, czyli 30° w prawo od góry (Jones 2020, ISAW Papers 17, akapit 41 i 109).
  // W epoce sarosu wskazówka stoi więc na 30°, a w epoce kalendarza na ≈ 32°, prawie równolegle
  // do wskazówki sarosu (≈ 26°, przyp. 64).
  const EXELIGMOS_START = 30;
  // Sektory tarczy exeligmos zgodnie z ruchem wskazówek od godziny 1 (Jones 2020, akapit 41):
  // pusty (cykl bazowy, 0 h), Η = 8, ΙϚ = 16 (Ϛ to stigma, U+03DA, nie końcowa sigma ς).
  // alt: zapis bez stigmy (ΣΤ to ligatura, z której stigma powstała), gdy czcionka nie ma Ϛ.
  const EXELIGMOS_SECTORS = [
    { num: '', hours: 0 },
    { num: 'Η', hours: 8 },
    { num: 'Ι\u03DA', hours: 16, alt: 'ΙΣΤ' }
  ];
  const K_METON = K_START + METON_OFFSET;
  const JD_METON = JD_START + METON_OFFSET * MONTH;      // wskazówki są sprzężone kołami: 4 miesiące mechanizmu

  // ---------- średnie elementy (Meeus) w chwili startu – kalibracja ----------
  const norm = (a) => ((a % 360) + 360) % 360;
  const rad = Math.PI / 180;
  const T0 = (JD_START - 2451545) / 36525;
  const CAL = {
    sunL: norm(280.46646 + 36000.76983 * T0),
    sunM: norm(357.52911 + 35999.05029 * T0),            // anomalia średnia Słońca (od perygeum)
    moonL: norm(218.3164477 + 481267.88123421 * T0),
    moonM: norm(134.9633964 + 477198.8675055 * T0),      // anomalia średnia Księżyca
    node: norm(125.04452 - 1934.136261 * T0),
    earthL: norm(100.466449 + 35999.3728519 * T0)
  };
  for (const p of PLANETS) {
    const L = norm(p.L0[0] + p.L0[1] * T0);
    p.S0 = p.inner ? norm(L - CAL.earthL) : norm(CAL.earthL + 180 - L);
  }

  /*
   * Pin-and-slot – wspólna kinematyka dla Księżyca i prawdziwego Słońca (Freeth i in. 2006, 2021).
   * Kołek leży w odległości rPin od osi koła napędzającego (K = (0, 0)) pod kątem pinDeg; koło
   * napędzane obraca się wokół osi K′ = (dAxis, 0), a jego szczelina zawsze przechodzi przez kołek.
   * Zwraca kierunek szczeliny (kąt koła napędzanego), ciągły z pinDeg. Dokładna geometria:
   * slot − pin = atan2(e·sin u, 1 − e·cos u), e = dAxis/rPin; u = 0 – kołek najbliżej K′ (najszybciej).
   */
  function slotAngle(pinDeg, rPin, dAxis) {
    const a = Math.atan2(rPin * Math.sin(pinDeg * rad), rPin * Math.cos(pinDeg * rad) - dAxis) / rad;
    return a + 360 * Math.round((pinDeg - a) / 360);
  }
  const E_MOON = 0.11;       // d/r: ≈ 6,3°; Freeth 2006 mierzy d ≈ 1,1 mm, r = 9,6 mm (≈ 0,115, 6,5°)
  const R_PIN = 9.6;                  // odległość kołka od osi K [mm] – Freeth i in. 2006
  const D_K = E_MOON * R_PIN;         // odstęp osi K–K′ [mm] dający e = 0,11 (≈ 1,06 mm)

  /*
   * Tor księżycowy liczony kinematycznie, koło po kole (kąty w stopniach, znak jak w GEARS).
   * W układzie platformy e3: k1 obraca się jednostajnie wokół K = (0, 0), kołek P jest w odległości
   * R_PIN, oś K′ leży w (D_K, 0). k2 obraca się tak, żeby szczelina (promień z K′) przechodziła
   * przez P – dokładna geometria, bez przybliżeń. Dalej: k2 → e6 (zazębienie na platformie),
   * e6 = e1 (wspólny wałek), e1 → b3 (zazębienie na stałej osi). Stałe c… to kalibracja startowa.
   */
  function lunarTrain(t, moonL, moonM) {
    const deg = (id) => G[id].rate.v * 360 * t;
    const e3 = deg('e3');
    const e5rel = deg('e5') - e3;
    const k1 = -e5rel * G.e5.z / G.k1.z + moonM;            // faza: kołek najbliżej K′ (k2 najszybsze) w perygeum
    const px = R_PIN * Math.cos(k1 * rad), py = R_PIN * Math.sin(k1 * rad);
    const k2 = slotAngle(k1, R_PIN, D_K);                    // kierunek szczeliny K′P
    const e6rel = -k2 * G.k2.z / G.e6.z;
    const e6 = e6rel + e3, e1 = e6;
    const b3 = -e1 * G.e1.z / G.b3.z + (moonL - moonM);
    return { e3, k1, k2, e6, e1, b3, pin: [px, py], axisK2: [D_K, 0], anomaly: k2 - k1 };
  }
  const E_SUN = 1 / 24;      // mimośród Hipparcha ≈ 2,4°

  // ---------- tarcze tylne ----------
  const META_MONTHS = ['ΦΟΙΝΙΚΑΙΟΣ', 'ΚΡΑΝΕΙΟΣ', 'ΛΑΝΟΤΡΟΠΙΟΣ', 'ΜΑΧΑΝΕΥΣ', 'ΔΩΔΕΚΑΤΕΥΣ', 'ΕΥΚΛΕΙΟΣ',
    'ΑΡΤΕΜΙΣΙΟΣ', 'ΨΥΔΡΕΥΣ', 'ΓΑΜΕΙΛΙΟΣ', 'ΑΓΡΙΑΝΙΟΣ', 'ΠΑΝΑΜΟΣ', 'ΑΠΕΛΛΑΙΟΣ'];
  const META_MONTHS_PL = ['Phoinikaios', 'Kraneios', 'Lanotropios', 'Machaneus', 'Dodekateus', 'Eukleios',
    'Artemisios', 'Psydreus', 'Gameilios', 'Agrianios', 'Panamos', 'Apellaios'];
  // Struktura kalendarza według Freeth i in. 2008, materiały uzupełniające §3.3 i ryc. S10:
  // lata 13-miesięczne 1, 3, 6, 9, 11, 14, 17 (wywnioskowane z inskrypcji, „bardzo prawdopodobne”);
  // powtarzany miesiąc 6 (Eukleios) – jedna z możliwych hipotez autorów;
  // dni opuszczone (exairesimoi): w każdym zwoju (47 miesięcy po nominalnie 30 dni) 22 dni co 64 dni,
  // z dwoma odstępami 65-dniowymi – rozkład identyczny w pięciu zwojach (ryc. S10).
  const LEAP = new Set([1, 3, 6, 9, 11, 14, 17]);
  const LEAP_MONTH = 5;                                   // indeks Eukleiosa
  const IONIC = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ϛ', 'Ζ', 'Η', 'Θ', 'Ι', 'ΙΑ', 'ΙΒ', 'ΙΓ', 'ΙΔ', 'ΙΕ', 'ΙϚ', 'ΙΖ', 'ΙΗ', 'ΙΘ'];
  const EXCLUDED = (function () {                         // nominalne dni opuszczone w zwoju (0 = 1. dzień komórki 1)
    const out = [0]; let d = 0;
    for (let k = 1; k < 22; k++) { d += (k === 6 || k === 17) ? 65 : 64; out.push(d); }
    return out;                                           // ostatni + 64 = 1410 = początek kolejnego zwoju
  })();
  const METONIC_CELLS = (function () {
    const cells = [];
    for (let yr = 1; yr <= 19; yr++) {
      const n = LEAP.has(yr) ? 13 : 12;
      for (let i = 0; i < n; i++) {
        const idx = LEAP.has(yr) && i > LEAP_MONTH ? i - 1 : i;
        const leap = LEAP.has(yr) && i === LEAP_MONTH + 1;
        cells.push({ year: yr, yearGr: IONIC[yr - 1], first: i === 0, name: META_MONTHS[idx],
          namePl: META_MONTHS_PL[idx] + (leap ? ' II (przestępny)' : ''), leap });
      }
    }
    cells.forEach((c, i) => {
      const c0 = (i % 47) * 30;
      const ex = EXCLUDED.find((e) => e >= c0 && e < c0 + 30);
      c.exDay = ex === undefined ? null : ex - c0 + 1;
      c.days = ex === undefined ? 30 : 29;
    });
    return cells;                                         // 235
  })();
  // Tarcza igrzysk: dwie nazwy na rok. Pięć nazw – Freeth i in. 2008 (Nature 454:614);
  // ΑΛΙΕΙΑ (Halieia, Rodos) w roku 4 – późniejszy, mniej pewny odczyt Iversena (2017).
  const GAMES = [
    ['ΙΣΘΜΙΑ', 'ΟΛΥΜΠΙΑ'], ['ΝΕΜΕΑ', 'ΝΑΑ'], ['ΙΣΘΜΙΑ', 'ΠΥΘΙΑ'], ['ΝΕΜΕΑ', 'ΑΛΙΕΙΑ']
  ];
  const GAMES_PL = [['Istmia', 'Olimpia'], ['Nemea', 'Naa'], ['Istmia', 'Pytia'], ['Nemea', 'Halieia (?)']];
  const GAMES_UNCERTAIN = [[false, false], [false, false], [false, false], [false, true]];

  // ---------- zaćmienia: Meeus, „Astronomical Algorithms”, rozdz. 54 (średnie elementy) ----------
  function eclipseAt(k) {            // k całkowite: nów, k+0.5: pełnia
    const T = k / 1236.85, E = 1 - 0.002516 * T;
    const M = (2.5534 + 29.10535670 * k) * rad;
    const Mp = (201.5643 + 385.81693528 * k) * rad;
    const Fd = 160.7108 + 390.67050284 * k;
    const Om = (124.7746 - 1.56375588 * k) * rad;
    const F1 = (Fd - 0.02665 * Math.sin(Om)) * rad;
    if (Math.abs(Math.sin(F1)) > 0.36) return null;
    const P = 0.2070 * E * Math.sin(M) + 0.0024 * E * Math.sin(2 * M) - 0.0392 * Math.sin(Mp) + 0.0116 * Math.sin(2 * Mp)
      - 0.0073 * E * Math.sin(Mp + M) + 0.0067 * E * Math.sin(Mp - M) + 0.0118 * Math.sin(2 * F1);
    const Q = 5.2207 - 0.0048 * E * Math.cos(M) + 0.0020 * E * Math.cos(2 * M) - 0.3299 * Math.cos(Mp)
      - 0.0060 * E * Math.cos(Mp + M) + 0.0041 * E * Math.cos(Mp - M);
    const W = Math.abs(Math.cos(F1));
    const gamma = (P * Math.cos(F1) + Q * Math.sin(F1)) * (1 - 0.0048 * W);
    const u = 0.0059 + 0.0046 * E * Math.cos(M) - 0.0182 * Math.cos(Mp) + 0.0004 * Math.cos(2 * Mp) - 0.0005 * Math.cos(M + Mp);
    const solar = Number.isInteger(k);
    if (solar) return Math.abs(gamma) < 1.5433 + u ? { type: 'S', gamma } : null;
    const umbral = (1.0128 - u - Math.abs(gamma)) / 0.5450;   // wielkość cieniowa
    return umbral > 0 ? { type: 'L', gamma, mag: umbral } : null;
  }
  // ---------- glify sarosu ----------
  // Rozkład: „Eclipse Year Model” (Freeth 2014, PLOS ONE 9:e103275). Miesiąc = 38 EYu, rok zaćmieniowy = 446 EYu;
  // pełnia n-tego miesiąca w 38(n−1)+17, nów w 38(n−1)+36 (mod 446); punkty węzłowe: zstępujący 66, wstępujący 289.
  // Glif Σ: pełnia ≤ 20 EYu od punktu węzłowego (bez drugiego Σ w kolejnym miesiącu);
  // glif Η: nów ≤ 20 EYu na północ albo ≤ 7 EYu na południe od punktu węzłowego. Wynik: 51 glifów (38 Σ, 28 Η).
  function eymNode(p) {
    let best = null;
    for (const k of [-1, 0, 1]) for (const [np, kind] of [[66, 'D'], [289, 'A']]) {
      const d = p - (np + 446 * k);
      if (!best || Math.abs(d) < Math.abs(best.d)) best = { d, kind };
    }
    return { dist: Math.abs(best.d), north: best.kind === 'D' ? best.d < 0 : best.d > 0 };
  }
  // Glify odczytane z fragmentów: Freeth i in. 2008, materiały uzupełniające, ryc. S16.
  const OBSERVED_GLYPHS = { 13: 'S', 20: 'L', 25: 'S', 26: 'L', 67: 'L', 72: 'S', 78: 'S', 79: 'L', 114: 'L', 119: 'S', 120: 'L',
    125: 'LS', 131: 'LS', 137: 'LS', 172: 'LS', 178: 'LS', 184: 'LS', 190: 'L' };
  const SAROS_GLYPHS = (function () {
    const out = [];
    let prevL = false;
    for (let n = 1; n <= 223; n++) {
      const fm = eymNode((38 * (n - 1) + 17) % 446), nm = eymNode((38 * (n - 1) + 36) % 446);
      const lunar = fm.dist <= 20 && !prevL;
      const solar = nm.dist <= (nm.north ? 20 : 7);
      prevL = lunar;
      // dla porównania: czy w tej lunacji było zaćmienie według współczesnego modelu (Meeus)
      const ms = eclipseAt(K_START + n), ml = eclipseAt(K_START + n - 1 + 0.5);   // miesiąc od sierpu: pełnia w środku, nów na końcu
      out.push({ lunar, solar, observed: n in OBSERVED_GLYPHS, meeus: { solar: !!ms, lunar: !!ml } });
    }
    return out;
  })();

  // ---------- stan mechanizmu w chwili jd ----------
  function state(jd) {
    const days = jd - JD_START;
    const t = days / Y;                                 // obroty b1
    const turns = (fr) => fr.v * t;
    const sunMean = norm(CAL.sunL + 360 * t);
    const sunAnom = norm(CAL.sunM + 360 * t);
    // prawdziwe Słońce: ten sam kołek w szczelinie, anomalia od perygeum (Słońce najszybsze w perygeum)
    const sunTrue = norm(sunMean + slotAngle(sunAnom, 1, E_SUN) - sunAnom);
    const moonMean = norm(CAL.moonL + 360 * turns(R_SIDEREAL));
    const moonAnom = norm(CAL.moonM + 360 * turns(R_ANOMALY));
    const lunar = lunarTrain(t, CAL.moonL, CAL.moonM);
    const moonTrue = norm(lunar.b3);                    // wskazówka Księżyca napędzana przez b3
    const phase = norm(moonTrue - sunTrue);             // 0 nów, 180 pełnia
    const node = norm(CAL.node + 360 * turns(NODES.rate));

    const planets = PLANETS.map((p) => {
      const S = norm(p.S0 + 360 * turns(p.syn));
      let x, y;
      if (p.inner) {          // deferent = Słońce średnie, epicykl o promieniu a
        x = Math.cos(sunMean * rad) + p.a * Math.cos((sunMean + 180 + S) * rad);
        y = Math.sin(sunMean * rad) + p.a * Math.sin((sunMean + 180 + S) * rad);
      } else {                // deferent = planeta średnia, epicykl równoległy do Słońca
        x = p.a * Math.cos((sunMean - S) * rad) + Math.cos(sunMean * rad);
        y = p.a * Math.sin((sunMean - S) * rad) + Math.sin(sunMean * rad);
      }
      return { id: p.id, S, lon: norm(Math.atan2(y, x) / rad) };
    });

    // miesiące liczone okresem mechanizmu od nowiu startowego
    const months = days / MONTH;                        // od epoki sarosu
    const monthsMet = months - METON_OFFSET;            // od epoki kalendarza (4 miesiące później)
    const mm = ((monthsMet % 235) + 235) % 235;
    const metCell = Math.floor(mm);
    const met = { months: monthsMet, pos: mm, cell: metCell, turn: Math.floor(mm / 47), angle: (mm / 47) * 360, info: METONIC_CELLS[metCell] };
    const yearsMet = monthsMet * 19 / 235;              // lata Metona (= obroty b1) od epoki kalendarza
    const callippic = { angle: norm((yearsMet / 76) * 360), sector: Math.floor((((yearsMet % 76) + 76) % 76) / 19) };
    const gy = Math.floor(((yearsMet % 4) + 4) % 4);
    const games = { angle: norm((yearsMet / 4) * 360), year: gy, names: GAMES_PL[gy] };
    const sm = ((months % 223) + 223) % 223;
    const sCell = Math.floor(sm);
    const saros = { pos: sm, cell: sCell, turn: Math.floor(sm / 55.75), angle: (sm / 55.75) * 360, glyph: SAROS_GLYPHS[sCell] };
    const ex = ((months % 669) + 669) % 669;
    const exeligmos = { angle: norm(EXELIGMOS_START + (ex / 669) * 360), sector: Math.floor(ex / 223) };

    // dryf: ile mechanizm (rok 365¼ d, relacje Metona) odbiega od współczesnych średnich elementów
    const T = (jd - 2451545) / 36525;
    const sd = (a) => ((a % 360) + 540) % 360 - 180;
    const drift = {
      sun: sd(sunMean - (280.46646 + 36000.76983 * T + 0.0003032 * T * T)),
      moon: sd(moonMean - (218.3164477 + 481267.88123421 * T - 0.0015786 * T * T))
    };
    const eg = egyptian(jd);
    const gearAngles = {};
    for (const g of GEARS) gearAngles[g.id] = norm(g.rate.v * t * 360);
    for (const id of ['k1', 'k2', 'e6', 'e1', 'b3']) gearAngles[id] = norm(lunar[id]);   // ruch niejednostajny

    return {
      jd, t, days, drift, sunMean, sunTrue, sunAnom, moonMean, moonTrue, moonAnom, lunar, phase, node, planets,
      metonic: met, callippic, games, saros, exeligmos,
      egyptian: eg, egRingRot: norm(sunMean - eg.dayCont * 360 / 365),
      julian: calFromJd(jd, false), gregorian: calFromJd(jd, true), gearAngles, crank: gearAngles.a1
    };
  }

  function jdNow() { return Date.now() / 86400000 + 2440587.5; }

  return {
    F, fmul, fdiv, fsub, fstr, Y, MONTH, GEARS, G, PLANETS, NODES,
    R_SIDEREAL, R_APSIDES, R_ANOMALY, R_SYNODIC,
    jdFromCal, calFromJd, egyptian, EG_MONTHS, EG_MONTHS_PL, EG_EPOCH,
    JD_START, K_START, JD_METON, K_METON, METON_OFFSET, EXELIGMOS_START, EXELIGMOS_SECTORS, meanNewMoon, kNear, eclipseAt, SAROS_GLYPHS, OBSERVED_GLYPHS, METONIC_CELLS, EXCLUDED, GAMES, GAMES_PL, GAMES_UNCERTAIN,
    state, jdNow, slotAngle, lunarTrain, E_MOON, R_PIN, D_K, E_SUN, norm, relRate
  };
});
