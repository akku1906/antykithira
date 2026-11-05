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

Test sprawdza na ułamkach dokładnych, że liczby zębów dają 254/19 (Księżyc gwiazdowy), 5/19 (Meton), 1/76 (Kalippos), 1/4 (igrzyska), 4 obroty na 223 miesiące (saros), 1/12 sarosu (exeligmos) i okresy planet z artykułu Freetha. Sprawdza też, że po 223 miesiącach wskazówka sarosu i ślizgacz wracają do startu, a po 235 miesiącach — wskazówka Metona. Do tego dochodzą powroty Kalipposa, igrzysk i planet, kalendarze oraz wykrywanie znanych zaćmień z lat 2022 i 2024. Test sprawdza też epoki tarcz tylnych (saros 28 IV, kalendarz 23 VIII 205 p.n.e.) i położenia planet w epoce względem JPL DE441 (`test-dane/de441-205pne.json`).

## Pliki

| plik | rola |
|---|---|
| `js/engine.js` | silnik czasu: koła zębate, przełożenia, kalendarze, zaćmienia (działa też w Node) |
| `js/front.js`, `js/back.js`, `js/inside.js` | rysowanie trzech widoków |
| `js/draw.js` | wspólne narzędzia rysowania |
| `js/app.js` | sterowanie, korba, panel odczytów |
| `sw.js`, `manifest.webmanifest` | tryb offline (PWA) |
| `test.js` | test silnika |
| `test-dane/de441-205pne.json` | dane referencyjne JPL Horizons (DE441) dla epoki, używane tylko przez test |

## Decyzje

- **Czas** to dzień juliański. Koło b1 obraca się raz na „rok mechanizmu” równy 365¼ dnia (Kalippos: 76 lat = 940 miesięcy = 27 759 dni). Z tego wynika miesiąc synodyczny 29,5309 dnia, a 19 lat to dokładnie 235 miesięcy synodycznych i 254 gwiazdowe.
- **Koła tylne i księżycowe** mają liczby zębów z rekonstrukcji Freetha i in. (Nature 2006): b1 224, b2 64, c1 38, c2 48, d1 24, d2 127, e2 32, l1 38, l2 53, m1 96, m2 15, m3 27, n1 53, n2 15, n3 57, o1 60, p1 60, p2 12, q1 60, e3 223, e4 188, f1 53, f2 30, g1 54, g2 20, h1 60, h2 15, i1 60. Korba a1 ma 48 zębów (to wartość rekonstruowana).
- **Księżyc:** platforma e3, napędzana przez m3, obraca się raz na 8,88 roku, co odpowiada precesji apsyd. Dzięki temu anomalia Księżyca wynika z kół, a nie z osobnej stałej. Wychodzi dokładnie relacja sarosu: 239 miesięcy anomalistycznych na 223 synodyczne.
- **Planety** pochodzą z artykułu Freeth i in. 2021 (Scientific Reports 11:5821), którego treść udało się przeczytać. Przełożenia wziąłem z ryc. 3e–f: Merkury 1513 cykli synodycznych na 480 lat (51 ~ 72 + 89 ~ 40 ~ 20), Wenus 289/462 (51 ~ 44 + 34 ~ 26 ~ 63), Mars 133/284 (56 ~ 64 + 38 ~ 40 ~ 71), Jowisz 315/344 (56 ~ 64 + 45 ~ 40 ~ 43), Saturn 427/442 (56 ~ 52 + 61 ~ 40 ~ 68), prawdziwe Słońce 56 ~ 52 ~ 56, węzły 49 ~ 62 + 64 ~ 48, czyli −5/93 obrotu na rok. Test potwierdza, że liczby zębów dają te ułamki.
- **Kolejność pierścieni od środka** idzie za artykułem: Księżyc, Merkury, Wenus, Słońce, Mars, Jowisz, Saturn, data. Smok węzłów jest w artykule wprost oznaczony jako hipotetyczny.
- **Glify zaćmień** biorę z Freetha (2014). Model Meeusa nie służy już do ich rozmieszczania, bo EYM pokrywa wszystkie 223 komórki i żadnej nie zostawia pustej. Meeus zostaje jako niezależne porównanie: panel pokazuje, czy w danej lunacji od 205 p.n.e. faktycznie wystąpiło zaćmienie. Zgodność jest wysoka: wszystkie 28 glifów Η to rzeczywiste zaćmienia Słońca (widoczne gdziekolwiek na Ziemi), wszystkie 26 cieniowych zaćmień Księżyca w tym sarosie ma glif Σ, a pozostałe 12 glifów Σ to zaćmienia półcieniowe albo przewidywania „na zapas”.
- **Start:** nów około 28 kwietnia 205 p.n.e. (kalendarz juliański), pełnia 12 maja. To **hipoteza** Carmana i Evansa (2014), oparta na zgodności glifów sarosu z zaćmieniami. Data nie jest pewna; inni badacze uważają, że mechanizm zbudowano później, a 205 p.n.e. to tylko data odniesienia na tarczy. Od tego nowiu liczy się saros. Kalendarz na spirali Metona (razem z igrzyskami i Kalipposem) zaczyna się 4 miesiące później, od nowiu 23 sierpnia 205 p.n.e. (szczegóły w części „Weryfikacja epok”). Przycisk „205 p.n.e.” i klawisz `S` ustawiają epokę sarosu; Meton jest wtedy w komórce 232, w 19. roku poprzedniego cyklu.
- **Kierunek na przodzie:** długość ekliptyczna rośnie zgodnie z ruchem wskazówek zegara, 0° Barana jest u góry.
- **Pierścień egipski** obraca się sam tak, żeby wskazówka daty pokazywała bieżący dzień egipski. W oryginale użytkownik przestawiał go ręcznie o dzień co 4 lata.
- **Dryf:** model liczy wyłącznie przełożeniami mechanizmu, więc z dala od 205 p.n.e. rozjeżdża się z niebem tak samo jak oryginał (dziś Słońce jest przesunięte o około 17°, Księżyc o około 105°). Panel pokazuje ten dryf względem współczesnych średnich położeń.

## Co jest wierne rekonstrukcji, a co przybliżone

**Wierne rekonstrukcji (Freeth 2006, 2008, 2021; Wright):**
- glify zaćmień odczytane z fragmentów (18 komórek: Σ 20, 26, 67, 79, 114, 120, 190; Η 13, 25, 72, 78, 119; Σ+Η 125, 131, 137, 172, 178, 184 – Freeth i in. 2008, materiały uzupełniające, ryc. S16); na tarczy rysuję je pełnym czerwonym polem;
- liczby zębów i przełożenia kół tylnych, księżycowych i planetarnych, w tym dokładne ułamki 254/19, 235/19, 5/19, 1/76, 1/4, 940/4237, 1/12 oraz okresy planet;
- układ spiral: 235 komórek w 5 zwojach, 223 komórki w 4 zwojach, ślizgacz przechodzący na następny zwój;
- tarcze pomocnicze: Kalippos w 4 sektorach, igrzyska w 4 latach, po dwie nazwy na rok: 1 Istmia + Olimpia, 2 Nemea + Naa, 3 Istmia + Pytia, 4 Nemea + Halieia (pięć nazw według Freeth i in. 2008, Nature 454:614; Halieia, igrzyska rodyjskie, to późniejszy odczyt Iversena z 2017 roku, mniej pewny, na tarczy oznaczony „?”), exeligmos z 0, 8 i 16 godzinami;
- zasada pin-and-slot dla Księżyca, z platformą e3 obracającą się z okresem apsyd;
- kalendarz egipski 365-dniowy z greckimi nazwami miesięcy;
- spirala Metona według Freeth i in. 2008 (Nature 454:614, materiały uzupełniające §3.3 i ryc. S10): 12 nazw miesięcy korynckich, start na dole wewnątrz spirali i obieg zgodny z ruchem wskazówek zegara, znak „L” z numerem roku w pierwszym miesiącu każdego roku, lata 13-miesięczne 1, 3, 6, 9, 11, 14, 17 oraz miesiące 29- i 30-dniowe z dniami opuszczonymi (exairesimoi). W każdym zwoju są 22 dni opuszczone co 64 dni, z dwoma odstępami 65-dniowymi; rozkład jest ten sam w pięciu zwojach. Liczby dni opuszczonych są wypisane pod pierwszym zwojem, a test sprawdza, że zgadzają się z liczbami odczytanymi pod komórkami 1 i 33–45. Lata przestępne autorzy wywnioskowali z położenia lat w zachowanych komórkach (określają je jako „bardzo prawdopodobne”); cały układ to w ich słowach „jeden z możliwych schematów”.

**Przybliżone lub dodane przeze mnie:**
- **glify zaćmień – rekonstrukcja:** 33 z 51 glifów nie zachowały się. Ich układ pochodzi z „Eclipse Year Model” Freetha (2014, PLOS ONE 9:e103275), arytmetycznego modelu, który autor dopasował metodą prób i błędów do zachowanych glifów i liter indeksowych. Na tarczy rysuję je samym konturem. Model odtwarza wszystkie 18 odczytanych glifów oraz liczby 51 / 38 Σ / 28 Η z artykułu; sprawdza to test. Godzin zaćmień i liter indeksowych na glifach nie pokazuję;
- **powtarzany miesiąc w latach przestępnych:** Eukleios (miesiąc 6). Freeth i in. (2008) nazywają to „prostą hipotezą spośród wielu możliwych”, bo na zachowanym fragmencie nie ma dwóch sąsiednich komórek z tą samą nazwą. Wiadomo tylko, że w roku 3 powtórzony miesiąc był przed 12., a w roku 11 przed 9.;
- **geometria planet:** zamiast odtwarzać ramiona pin-and-slot z Supplementary Table S9 używam równoważnego modelu deferent–epicykl z kołowymi orbitami o współczesnych promieniach. Prędkości dokładnie odpowiadają przełożeniom kół, ale amplituda pętli wstecznych jest przybliżona;
- **mimośrody:** Księżyc e = 0,11 (około 6,3°, rząd wielkości z rekonstrukcji 2006), Słońce e = 1/24 (wartość Hipparcha). Dokładne wymiary kołków na oryginale są niepewne;
- **położenia startowe** Słońca, Księżyca, węzłów i planet w 205 p.n.e. wziąłem ze współczesnych średnich elementów (Meeus, J2000). Mechanizm był kalibrowany przez starożytnego konstruktora w nieznany nam sposób;
- **pozycje planet w 205 p.n.e.** sprawdziłem tylko względem współczesnej efemerydy JPL DE441, a nie względem starożytnych obserwacji; opis w części „Weryfikacja pozycji planet”;
- **data juliańska** jest liczona wprost z dnia juliańskiego, czyli jest przybliżoną datą kalendarzową. Dla lat od 1582 panel pokazuje też datę gregoriańską;
- **wygląd:** kształty, kolory, rozmieszczenie kół w widoku „Wnętrze” (rozmiary nie są w skali) i ozdobne kulki planet są interpretacją;
- **epoka kalendarza:** spirala Metona startuje 4 miesiące po sarosie (23 VIII 205 p.n.e.). To hipoteza Iversena (2017), a nie odczyt z fragmentów; opis i stopień pewności w części „Weryfikacja epok”;
- **korba:** 48 zębów a1, czyli około 4,67 obrotu korby na rok. Przeciąganie po tarczy obraca bezpośrednio koło b1.

## Weryfikacja epok

Sprawdzałem dwie rzeczy, które wcześniej były oznaczone jako niesprawdzone: czy spirale sarosu i Metona mają wspólny początek oraz pod jakim kątem startuje spirala sarosu. Poniżej oddzielam to, co mówi źródło, od mojego wniosku i od tego, co zgaduję.

**Co mówią źródła**

- Freeth i in. 2008 (Nature 454:614), materiały uzupełniające, §3.3: spirala Metona biegnie zgodnie z ruchem wskazówek zegara od punktu startu na dole, wewnątrz spirali. §4.7 i ryc. S23: cztery zwoje sarosu odpowiadają cyklom pełni (16 na saros), na środkowej płytce tarczy sarosu jest możliwa kreska skali dokładnie na godzinie 3. O dacie startu i o wzajemnym położeniu obu cykli ten tekst milczy.
- Freeth 2014 (PLOS ONE 9:e103275), Note S5 i tabela S5: pierwsza pełnia tarczy sarosu to 12 V 205 p.n.e. (−204-05-12). Note S5, „The Saros Dial and the Full Moon Cycle”, i ryc. S21: ćwiartki tarczy zgadzają się z cyklem pełni, a zaćmienia całkowite skupiają się przy punktach kardynalnych (góra, prawo, dół, lewo). Skąd startuje spirala, artykuł nie mówi wprost. O spirali Metona w tym kontekście nie ma nic.
- Iversen 2017 (Hesperia 86), s. 130, przyp. 3: komórka 1 sarosu odpowiada miesiącowi księżycowemu od 29 IV 205 p.n.e. Na s. 181–183 i ryc. 12 autor pisze, że wskazówki Metona i sarosu nie mogły stać jednocześnie na komórce 1 (nie da się uwierzyć, by Olimpia, która wypada w roku 1, odbyła się między końcem kwietnia 205 a połową maja 204 p.n.e.). Jego zdaniem Phoinikaios 1 roku 1 zaczyna się 1–3 dni po nowiu 23 VIII 205 p.n.e. Wskazówki Metona i igrzysk stoją wtedy w dół (180°), a wskazówka sarosu na początku komórki 5. Iversen powołuje się tu na Carmana i Evansa (2014, s. 761–762), którzy według niego też uznali, że wszystkie trzy wskazówki nie mogły startować razem.
- Jones 2020 (*The Epoch Dates of the Antikythera Mechanism*, ISAW Papers 17, otwarty dostęp; spoza listy źródeł zadania) w akapicie 38 pisze, że początek i koniec spirali sarosu leżą dokładnie nad osią wskazówki, czyli u góry. W akapitach 108–109 i w przypisie 64 przyjmuje epokę kalendarza Iversena (nów 23 VIII, sierp 25 VIII 205 p.n.e.) i podaje, że cztery miesiące po epoce zaćmień wskazówka sarosu stoi około 26° w prawo od pionu.
- Carman 2017 (JHA 48:312; czytałem tylko streszczenie) mówi o „wyłaniającym się konsensusie”: saros startuje 27 IV 205 p.n.e., Meton 25 VIII 205 p.n.e.

Samego artykułu Carmana i Evansa (2014) nie czytałem, bo jest za paywallem. To, co o nim piszę, znam z Iversena, Freetha i Jonesa.

**Mój wniosek**

- Wspólnego początku nie podaje żadne źródło, które w ogóle zajmuje się tą sprawą. Iversen, Jones i Carman 2017 są zgodni, że spirala Metona startuje 4 miesiące synodyczne po sarosie. Freeth (2008, 2014) w tej sprawie milczy, więc z nikim się nie kłóci. Dlatego zmieniłem kod: `METON_OFFSET = 4` w `js/engine.js`, a epoka kalendarza to `JD_METON = JD_START + 4` miesiące mechanizmu. Wskazówki są połączone kołami, więc przesunięcie musi wynosić dokładnie 4 miesiące mechanizmu. Od astronomicznego nowiu różni się to o mniej niż 0,01 dnia.
- Kąt startu sarosu (u góry) był już w kodzie i źródła go potwierdzają. Wprost mówi to Jones 2020, a pośrednio pasuje do tego położenie 26° w epoce kalendarza: model daje 25,8°. Kodu rysowania nie zmieniałem.
- Nowe testy w sekcji 3b `test.js`: w epoce sarosu jest komórka 1 i kąt 0°; epoka kalendarza wypada 23 VIII 205 p.n.e., 4 miesiące później; w tej epoce Meton pokazuje Phoinikaios roku 1, igrzyska rok 1, saros początek komórki 5 pod kątem około 26°.

**Co zgaduję albo co zostaje niepewne**

- Cała epoka kalendarza to hipoteza Iversena. Opiera się na założeniu, że kreski tarczy igrzysk oznaczają równonoc jesienną. Jones proponuje inną regułę (trzeci miesiąc po przesileniu letnim), która daje tę samą datę. Na fragmentach nie ma odczytu, który by tę datę potwierdzał.
- Model zaczyna miesiące od średniego nowiu. Iversen zaczyna Phoinikaios 1–3 dni po koniunkcji, od widocznego sierpu. Tej różnicy nie modeluję.
- W źródłach są dwie niespójności w liczeniu. Jones w akapicie 153 pisze „five months earlier”, a w przypisie 64 „four months”. Carman 2017 w streszczeniu pisze, że Meton zaczyna się cztery miesiące „earlier” niż saros, choć 25 sierpnia wypada po 27 kwietnia. Zgaduję, że Jones liczy włącznie, a u Carmana to pomyłka w słowie; daty w obu tekstach są jednoznaczne.
- Tarcza exeligmos: Jones (akapit 109) pisze, że początek cyklu exeligmos jest na godzinie 1, żeby w epoce kalendarza wskazówki dolnych tarcz były równoległe. W modelu sektory exeligmos zaczynają się u góry. Tego nie zmieniałem, bo zadanie wyklucza zmiany wyglądu.

## Weryfikacja pozycji planet

Położenia startowe planet pochodzą ze średnich elementów Meeusa. Porównanie ich z Meeusem byłoby tautologią, więc szukałem źródła niezależnego. W tym środowisku jest dostępny JPL Horizons z efemerydą DE441, która obejmuje także 205 p.n.e. Wartości dla epoki modelu (`JD_START`) zapisałem w `test-dane/de441-205pne.json`, razem z parametrami zapytań i datą pobrania, więc `node test.js` działa bez sieci. Sekcja 5 testu sprawdza dwie rzeczy.

- **Faza synodyczna w epoce**, czyli wartość, którą model naprawdę bierze z Meeusa (`S0`). Liczę ją z oskulacyjnych elementów DE441 (L = Ω + ω + M, ekliptyka J2000). Różnice wynoszą: Merkury −0,002°, Wenus −0,002°, Mars −0,005°, Jowisz +0,21°, Saturn −0,49°. Tolerancja to 1°. U Jowisza i Saturna długość oskulacyjna różni się od średniej głównie przez wielką nierówność; jej amplitudy (około 0,3° dla Jowisza i 0,8° dla Saturna) podaję z pamięci, niesprawdzone. Test łapie błędy: Jowisz przesunięty o 3° albo epoka przesunięta o 10 dni dają czerwone wyniki.
- **Długość geocentryczna w epoce** (ekliptyka daty) wobec pozornej długości z DE441. Różnice wynoszą: Merkury +1,5°, Wenus −0,3°, Mars −3,4°, Jowisz −4,7°, Saturn −3,8°. Model ma orbity kołowe, więc granica błędu wynika z mimośrodów: przesunięcie planety i Ziemi o 2e·a widziane z odległości Δ, plus 1°. To słaby test, który wyłapie tylko grube pomyłki (znak, epokę, układ odniesienia). Dla Jowisza margines jest mały (4,7° przy granicy 5,9°).

Co z tego wynika, a co nie:

- Średnie elementy Meeusa, przeniesione liniowo na 205 p.n.e., zgadzają się z numeryczną efemerydą DE441 w granicach okresowych zaburzeń. Startowe położenia planet w modelu nie mają więc błędu rachunkowego.
- To **nie** jest weryfikacja wobec nieba widzianego w starożytności. DE441 i elementy Meeusa to dwie różne metody, ale obie wyrastają ze współczesnych obserwacji i współczesnej mechaniki nieba. Naprawdę niezależne byłyby starożytne obserwacje planet, na przykład babilońskie dzienniki astronomiczne z tego okresu. Nie znalazłem ich w tym środowisku w formie, której test mógłby użyć, i nie próbowałem ich zastępować.
- Test nie mówi nic o tym, jak położenia planet ustawił konstruktor mechanizmu. Tego nie da się sprawdzić bez zachowanych odczytów wskazówek planet.
- Sprawdzam tylko epokę. Później model obraca planety według przełożeń kół, a nie według rzeczywistych okresów, więc jego rozjazd z niebem w innych latach jest zamierzony i nie podlega temu testowi.

## Źródła

- D. de Solla Price, *Gears from the Greeks*, Trans. Am. Philos. Soc. 64 (1974).
- M. T. Wright, prace z lat 2002–2013 o tarczy Metona, planetarium i kołach planetarnych.
- T. Freeth i in., *Decoding the ancient Greek astronomical calculator known as the Antikythera Mechanism*, Nature 444 (2006).
- T. Freeth, A. Jones, J. M. Steele, Y. Bitsakis, *Calendars with Olympiad display and eclipse prediction on the Antikythera Mechanism*, Nature 454 (2008).
- C. Carman, J. Evans, *On the epoch of the Antikythera mechanism and its eclipse predictor*, Arch. Hist. Exact Sci. 68 (2014).
- T. Freeth i in., *A Model of the Cosmos in the ancient Greek Antikythera Mechanism*, Scientific Reports 11:5821 (2021), https://www.nature.com/articles/s41598-021-84310-w
- T. Freeth, *Eclipse prediction on the ancient Greek astronomical calculating machine known as the Antikythera Mechanism*, PLOS ONE 9:e103275 (2014).
- P. Iversen, *The Calendar on the Antikythera Mechanism and the Corinthian Family of Calendars*, Hesperia 86 (2017), s. 129–203.
- C. C. Carman, *The Final Date of the Antikythera Mechanism*, Journal for the History of Astronomy 48 (2017), s. 312–323 (czytane tylko streszczenie).
- A. Jones, *The Epoch Dates of the Antikythera Mechanism (With an Appendix on its Authenticity)*, ISAW Papers 17 (2020), http://dlib.nyu.edu/awdl/isaw/isaw-papers/17/
- J. Meeus, *Astronomical Algorithms*, 2. wyd. (1998).
- JPL Horizons, efemeryda DE441 (R. S. Park i in., Astron. J. 161:105, 2021), https://ssd.jpl.nasa.gov/horizons/

Strona działa pod `/antykithira/`, więc wszystkie ścieżki są względne. Plik `.nojekyll` wyłącza przetwarzanie przez Jekyll. GitHub Pages trzeba włączyć w ustawieniach repozytorium (gałąź `main`, katalog główny).
