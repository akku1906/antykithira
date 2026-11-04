# Mechanizm z Antykithiry — interaktywny model

**Strona:** https://akku1906.github.io/antykithira/

Działający model greckiego kalkulatora astronomicznego z II/I wieku p.n.e. Kręcisz korbą (przeciągając palcem albo myszą po tarczy w kółko; jeden obrót to jeden rok), używasz suwaka albo przycisków ±dzień/miesiąc/rok, a wszystkie tarcze poruszają się zgodnie z przełożeniami kół zębatych z rekonstrukcji.

- **Przód:** zodiak, obrotowy pierścień kalendarza egipskiego (365 dni), wskazówka daty (Słońce średnie), Księżyc z kulką fazy i nierównomiernym ruchem (pin-and-slot), pierścienie planet i prawdziwego Słońca według Freeth i in. 2021, „smok” wskazujący węzły Księżyca.
- **Tył:** spirala Metona (235 miesięcy w 5 zwojach) z tarczami Kalipposa i igrzysk; spirala sarosu (223 miesiące w 4 zwojach) z glifami zaćmień i tarczą exeligmos; wskazówki ze ślizgaczem, który przechodzi na kolejny zwój.
- **Wnętrze:** rozsunięty schemat 29 kół (korba a1, b1…i1) obracających się razem z korbą, z pin-and-slot na platformie e3 i listą przekładni planetarnych.
- **Co to jest?:** krótki opis znaleziska i źródeł.

Skróty klawiszowe: `1`/`2`/`3`/`4` — widoki; `←`/`→` — dzień; `↑`/`↓` — miesiąc; `PageUp`/`PageDown` — rok; spacja — start/stop; `T` — dzisiaj; `S` — start w 205 p.n.e.; `D` — tryb jasny/ciemny. Działa offline po pierwszym wczytaniu (service worker).

## Uruchomienie i test

To czysty HTML, CSS i JavaScript z Canvas 2D, bez bibliotek i bez kroku budowania. Lokalnie wystarczy dowolny serwer statyczny, np. `python3 -m http.server`. Test silnika uruchamiasz w Node:

```bash
node test.js
```

Test sprawdza na ułamkach dokładnych, że liczby zębów dają 254/19 (Księżyc gwiazdowy), 5/19 (Meton), 1/76 (Kalippos), 1/4 (igrzyska), 4 obroty na 223 miesiące (saros), 1/12 sarosu (exeligmos) i okresy planet z artykułu Freetha. Sprawdza też, że po 223 miesiącach wskazówka sarosu i ślizgacz wracają do startu, a po 235 miesiącach — wskazówka Metona. Do tego dochodzą powroty Kalipposa, igrzysk i planet, kalendarze oraz wykrywanie znanych zaćmień z lat 2022 i 2024.

## Pliki

| plik | rola |
|---|---|
| `js/engine.js` | silnik czasu: koła zębate, przełożenia, kalendarze, zaćmienia (działa też w Node) |
| `js/front.js`, `js/back.js`, `js/inside.js` | rysowanie trzech widoków |
| `js/draw.js` | wspólne narzędzia rysowania |
| `js/app.js` | sterowanie, korba, panel odczytów |
| `sw.js`, `manifest.webmanifest` | tryb offline (PWA) |
| `test.js` | test silnika |

## Decyzje

- **Czas** to dzień juliański. Koło b1 obraca się raz na „rok mechanizmu” równy 365¼ dnia (Kalippos: 76 lat = 940 miesięcy = 27 759 dni). Z tego wynika miesiąc synodyczny 29,5309 dnia, a 19 lat to dokładnie 235 miesięcy synodycznych i 254 gwiazdowe.
- **Koła tylne i księżycowe** mają liczby zębów z rekonstrukcji Freetha i in. (Nature 2006): b1 224, b2 64, c1 38, c2 48, d1 24, d2 127, e2 32, l1 38, l2 53, m1 96, m2 15, m3 27, n1 53, n2 15, n3 57, o1 60, p1 60, p2 12, q1 60, e3 223, e4 188, f1 53, f2 30, g1 54, g2 20, h1 60, h2 15, i1 60. Korba a1 ma 48 zębów (to wartość rekonstruowana).
- **Księżyc:** platforma e3, napędzana przez m3, obraca się raz na 8,88 roku, co odpowiada precesji apsyd. Dzięki temu anomalia Księżyca wynika z kół, a nie z osobnej stałej. Wychodzi dokładnie relacja sarosu: 239 miesięcy anomalistycznych na 223 synodyczne.
- **Planety** pochodzą z artykułu Freeth i in. 2021 (Scientific Reports 11:5821), którego treść udało się przeczytać. Przełożenia wziąłem z ryc. 3e–f: Merkury 1513 cykli synodycznych na 480 lat (51 ~ 72 + 89 ~ 40 ~ 20), Wenus 289/462 (51 ~ 44 + 34 ~ 26 ~ 63), Mars 133/284 (56 ~ 64 + 38 ~ 40 ~ 71), Jowisz 315/344 (56 ~ 64 + 45 ~ 40 ~ 43), Saturn 427/442 (56 ~ 52 + 61 ~ 40 ~ 68), prawdziwe Słońce 56 ~ 52 ~ 56, węzły 49 ~ 62 + 64 ~ 48, czyli −5/93 obrotu na rok. Test potwierdza, że liczby zębów dają te ułamki.
- **Kolejność pierścieni od środka** idzie za artykułem: Księżyc, Merkury, Wenus, Słońce, Mars, Jowisz, Saturn, data. Smok węzłów jest w artykule wprost oznaczony jako hipotetyczny.
- **Start:** nów około 28 kwietnia 205 p.n.e. (kalendarz juliański), pełnia 12 maja. To **hipoteza** Carmana i Evansa (2014), oparta na zgodności glifów sarosu z zaćmieniami. Data nie jest pewna; inni badacze uważają, że mechanizm zbudowano później, a 205 p.n.e. to tylko data odniesienia na tarczy. W tym modelu od tego nowiu zaczynają się zarówno saros, jak i cykl Metona (to uproszczenie).
- **Kierunek na przodzie:** długość ekliptyczna rośnie zgodnie z ruchem wskazówek zegara, 0° Barana jest u góry.
- **Pierścień egipski** obraca się sam tak, żeby wskazówka daty pokazywała bieżący dzień egipski. W oryginale użytkownik przestawiał go ręcznie o dzień co 4 lata.
- **Dryf:** model liczy wyłącznie przełożeniami mechanizmu, więc z dala od 205 p.n.e. rozjeżdża się z niebem tak samo jak oryginał (dziś Słońce jest przesunięte o około 17°, Księżyc o około 105°). Panel pokazuje ten dryf względem współczesnych średnich położeń.

## Co jest wierne rekonstrukcji, a co przybliżone

**Wierne rekonstrukcji (Freeth 2006, 2008, 2021; Wright):**
- liczby zębów i przełożenia kół tylnych, księżycowych i planetarnych, w tym dokładne ułamki 254/19, 235/19, 5/19, 1/76, 1/4, 940/4237, 1/12 oraz okresy planet;
- układ spiral: 235 komórek w 5 zwojach, 223 komórki w 4 zwojach, ślizgacz przechodzący na następny zwój;
- tarcze pomocnicze: Kalippos w 4 sektorach, igrzyska w 4 latach, po dwie nazwy na rok: 1 Istmia + Olimpia, 2 Nemea + Naa, 3 Istmia + Pytia, 4 Nemea + Halieia (pięć nazw według Freeth i in. 2008, Nature 454:614; Halieia, igrzyska rodyjskie, to późniejszy odczyt Iversena z 2017 roku, mniej pewny, na tarczy oznaczony „?”), exeligmos z 0, 8 i 16 godzinami;
- zasada pin-and-slot dla Księżyca, z platformą e3 obracającą się z okresem apsyd;
- kalendarz egipski 365-dniowy z greckimi nazwami miesięcy i nazwy miesięcy korynckich na spirali Metona.

**Przybliżone lub dodane przeze mnie:**
- **glify zaćmień:** wyliczone współcześnie modelem Meeusa („Astronomical Algorithms”, rozdz. 54, średnie elementy orbit) dla 223 lunacji od startu. Zaznaczam zaćmienia Słońca (Η) i cieniowe zaćmienia Księżyca (Σ). Nie są to glify odczytane z fragmentów: na oryginale jest ich mniej, mają godziny i inne kryteria widoczności;
- **miesiące przestępne w cyklu Metona:** przyjąłem standardowy schemat (lata 3, 6, 8, 11, 14, 17, 19, a miesiąc przestępny to powtórzony ostatni miesiąc roku). Rzeczywisty rozkład na mechanizmie jest inny i częściowo niepewny;
- **geometria planet:** zamiast odtwarzać ramiona pin-and-slot z Supplementary Table S9 używam równoważnego modelu deferent–epicykl z kołowymi orbitami o współczesnych promieniach. Prędkości dokładnie odpowiadają przełożeniom kół, ale amplituda pętli wstecznych jest przybliżona;
- **mimośrody:** Księżyc e = 0,11 (około 6,3°, rząd wielkości z rekonstrukcji 2006), Słońce e = 1/24 (wartość Hipparcha). Dokładne wymiary kołków na oryginale są niepewne;
- **położenia startowe** Słońca, Księżyca, węzłów i planet w 205 p.n.e. wziąłem ze współczesnych średnich elementów (Meeus, J2000). Mechanizm był kalibrowany przez starożytnego konstruktora w nieznany nam sposób;
- **data juliańska** jest liczona wprost z dnia juliańskiego, czyli jest przybliżoną datą kalendarzową. Dla lat od 1582 panel pokazuje też datę gregoriańską;
- **wygląd:** kształty, kolory, rozmieszczenie kół w widoku „Wnętrze” (rozmiary nie są w skali) i ozdobne kulki planet są interpretacją;
- **korba:** 48 zębów a1, czyli około 4,67 obrotu korby na rok. Przeciąganie po tarczy obraca bezpośrednio koło b1.

## Źródła

- D. de Solla Price, *Gears from the Greeks*, Trans. Am. Philos. Soc. 64 (1974).
- M. T. Wright, prace z lat 2002–2013 o tarczy Metona, planetarium i kołach planetarnych.
- T. Freeth i in., *Decoding the ancient Greek astronomical calculator known as the Antikythera Mechanism*, Nature 444 (2006).
- T. Freeth, A. Jones, J. M. Steele, Y. Bitsakis, *Calendars with Olympiad display and eclipse prediction on the Antikythera Mechanism*, Nature 454 (2008).
- C. Carman, J. Evans, *On the epoch of the Antikythera mechanism and its eclipse predictor*, Arch. Hist. Exact Sci. 68 (2014).
- T. Freeth i in., *A Model of the Cosmos in the ancient Greek Antikythera Mechanism*, Scientific Reports 11:5821 (2021), https://www.nature.com/articles/s41598-021-84310-w
- J. Meeus, *Astronomical Algorithms*, 2. wyd. (1998).

Strona działa pod `/antykithira/`, więc wszystkie ścieżki są względne. Plik `.nojekyll` wyłącza przetwarzanie przez Jekyll. GitHub Pages trzeba włączyć w ustawieniach repozytorium (gałąź `main`, katalog główny).
