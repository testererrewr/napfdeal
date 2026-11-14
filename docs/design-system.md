# napfdeal Design-System

Leitbild: **ein liebevoll gemachtes Tier-Magazin, das zufällig sehr gute Preisdaten hat.**
Warm, handgemacht, redaktionell. Gilt für jede Phase. Wer etwas baut, das hier nicht
abgedeckt ist, ergänzt zuerst dieses Dokument.

---

## 1. Farben

Alle Werte als Tailwind-Tokens in `src/app/globals.css` (`@theme`). Kontraste gegen `paper` gemessen.

| Token              | Wert      | Einsatz                                          | Kontrast auf paper |
|--------------------|-----------|--------------------------------------------------|--------------------|
| `paper`            | `#F7F1E6` | Seitenhintergrund (cremiges Papier)              | –                  |
| `paper-deep`       | `#EFE4D0` | Flächen: Tabellenköpfe, Kästen, Preisschilder    | –                  |
| `ink`              | `#1F1A17` | Text, Linien                                     | ≈ 15:1             |
| `ink-soft`         | `#5A4F47` | Sekundärtext, Zeitstempel                        | ≈ 7:1              |
| `line`             | `#CDBEA4` | Trennlinien, gestrichelte Kassenzettel-Linien     | Deko               |
| `terracotta`       | `#A9492A` | Akzent: Links, Wortmarke, Randnotizen            | ≈ 5,1:1 (AA)       |
| `terracotta-soft`  | `#E9C9B6` | Hinterlegung für Akzente                         | –                  |
| `moss`             | `#4A6636` | „Preis gefallen“, Ersparnis                       | ≈ 5,8:1 (AA)       |
| `moss-soft`        | `#D5DFC6` | Hinterlegung „Preis gefallen“                    | –                  |
| `mustard`          | `#C79A2E` | Hinweise (nur als Fläche/Rahmen, Text darauf ink)| Deko               |
| `mustard-soft`     | `#F0DFAE` | Hinweis-Kästen                                   | –                  |
| `alarm`            | `#A12820` | **Nur** echte Warnungen und Fehler               | ≈ 6,6:1 (AA)       |

Regeln:
- Rot (`alarm`) nie für Preise oder Rabatte. Preisfall = `moss`.
- Keine Verläufe. Keine Transparenz-Effekte. Keine Schatten außer dem „Preisschild“-Schatten (1 px versetzt, `ink` 15 %).
- Text auf `mustard` immer `ink`.

## 2. Schriften

Alle Schriften werden beim Build gebündelt und von napfdeal.com ausgeliefert
(`next/font`, `font-display: swap`). Kein Browser lädt je etwas von Google.

| Rolle        | Schrift          | Token        | Einsatz                                         |
|--------------|------------------|--------------|-------------------------------------------------|
| Überschriften| Fraunces (variabel, `opsz`, `SOFT`, `WONK`) | `font-serif` | H1–H3, Wortmarke, große Preise |
| Fließtext    | Source Sans 3    | `font-sans`  | Text, Tabellen, Formulare, Buttons              |
| Randnotizen  | Caveat           | `font-hand`  | **nur** handschriftliche Randnotizen, max. 1–2 pro Ansicht |

- Preise immer mit `tabular-nums` (Klasse `.tabular`), damit Spalten sauber stehen.
- Überschriften: Fraunces mit `SOFT 50`, `opsz` automatisch. Kein Versal-Satz für ganze Überschriften.
- Rubrikenköpfe (z. B. „Größte Preisstürze heute“): Source Sans 3, 13 px, Versalien, Sperrung 0,08 em, darüber eine 2-px-Linie in `ink`.

## 3. Abstände und Raster

- Basiseinheit 4 px (Tailwind-Standard). Bewusst **unterschiedliche** Abstände: dichte Datenbereiche (`gap-3`), luftige Lesebereiche (`gap-8`).
- Seitenbreite max. 72 rem, Seitenrand `px-4` / `md:px-8`.
- Startseite: 12-Spalten-Raster, asymmetrisch. Hauptspalte 7–8 Spalten, Nebenspalte 4–5, getrennt durch eine senkrechte 1-px-Linie (wie in einer Zeitung).
- Rundungen: `rounded-none` als Standard, `rounded-sm` für Buttons und Eingabefelder. **Nie** `rounded-2xl`.

## 4. Komponenten

| Komponente      | Datei                                  | Kurzbeschreibung |
|-----------------|----------------------------------------|------------------|
| Wortmarke       | `components/Wordmark.tsx`              | „napf“ in ink, „deal“ kursiv in terracotta, kleiner gezeichneter Napf |
| Kopfzeile       | `components/SiteHeader.tsx`            | Wortmarke, Ausgabe-Hinweis, Länder-Umschalter |
| Fußzeile        | `components/SiteFooter.tsx`            | Gestrichelte Kassenzettel-Linie, Pflicht-Links |
| Länder-Umschalter | `components/CountrySwitch.tsx`       | SVG-Flaggen (keine Emojis), speichert in `localStorage` |
| Rubrikenkopf    | `components/editorial.tsx` → `SectionHead` | Versal-Kicker mit Linie, optional Untertitel |
| Randnotiz       | `components/editorial.tsx` → `HandNote`    | Caveat, terracotta, gezeichneter Pfeil |
| Preisschild     | `components/editorial.tsx` → `PriceTag`    | Preis in Fraunces, Lochung links, `paper-deep`, versetzter Schatten. Nur mit echten Preisen + Zeitstempel |
| Leerzustand     | `components/editorial.tsx` → `EmptyState`  | Ehrlicher Hinweis + kleine Illustration |
| Illustrationen  | `components/illustrations/*`           | Strichzeichnungen, `currentColor`, 1,6 px, runde Enden |

Buttons:
- Primär: `bg-ink text-paper`, `rounded-sm`, Hover: `bg-terracotta`.
- Sekundär: Rahmen 1 px `ink`, transparent.
- Shop-Button immer mit Zusatz „Werbelink“ in `ink-soft`, 12 px.

Icons: Keine Icon-Bibliotheken auf Karten. Wo ein Bild nötig ist, eigene Illustration.

## 5. Illustrationen

- Eigene SVG-Strichzeichnungen: Napf, Pfote, Futtersack, Streuschaufel, Fischglas, Vogelhaus.
- Linien leicht unregelmäßig (handgezeichnet wirkend), keine Füllungen außer gelegentlich `paper-deep`.
- **Sparsam:** höchstens eine Illustration pro Bildschirmhöhe. Nie als Hintergrundmuster.

## 6. Tonalität

Du-Ansprache, kurz, konkret, freundlich. Zahlen statt Adjektive. Jeder Preis mit Zeitstempel.

**Gut**
- „Royal Canin Mini Adult 8 kg kostet heute 4,10 € weniger als letzte Woche.“
- „Tiefster Preis seit 94 Tagen.“
- „Noch keine Preisdaten. Der erste Import läuft, sobald die Partnerprogramme freigeschaltet sind.“
- „Preis geprüft: 14.11.2026, 05:34 Uhr. Es gilt der Preis im Shop.“

**Verboten**
- „Entdecke“, „Tauche ein“, „nahtlos“, „revolutionär“, „Dein ultimativer Begleiter“, „Egal ob … oder …“
- Mehrere Ausrufezeichen, Gedankenstrich-Ketten, Emojis in Überschriften.
- Erfundene Zahlen („10.000+ zufriedene Nutzer“), erfundene Kundenstimmen, Fake-Dringlichkeit („Nur noch 2 Stunden!“).
- Heilversprechen. Bei Gesundheitsthemen: „Ersetzt keinen Tierarzt.“

Leerzustände sind ehrlich: Wenn es keine Daten gibt, steht da genau das.

## 7. Verboten im Layout (KI-Look)

- Lila/blaue oder Neon-Verläufe, Glassmorphism, schwebende Blobs.
- Zentrierter Hero mit Riesen-Überschrift, zwei Buttons, „Trusted by“-Logos.
- Drei gleiche Feature-Karten mit Icon oben.
- Überall gleiche Schatten, Rundungen und Abstände.
- Inter oder Roboto.
- Stockfotos und KI-generierte Tierfotos. Bilder nur aus erlaubten Händler-Feeds und eigene Illustrationen.

## 8. Barrierefreiheit

- Kontrast mind. WCAG AA (siehe Tabelle).
- Sichtbarer Fokus: 2 px `terracotta`-Umriss, 2 px Abstand (`:focus-visible`, global gesetzt).
- Jede Illustration ist dekorativ (`aria-hidden`), außer sie trägt Information.
- Bedienbar ohne Maus. Länderwahl funktioniert auch ohne JavaScript (normale Links).
