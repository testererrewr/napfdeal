# Awin-Testdaten

**Erfundene Testdaten** im Awin-Feedformat, nur für `FEEDS_TEST_MODE=1`.

- Alle Produktnamen beginnen mit `TESTDATEN`, alle Shops heißen „Testshop … (Testdaten)“.
- GTINs liegen im Bereich 200…, der für interne Nummern reserviert ist. Keine echte Ware.
- Links zeigen auf `example.com`.
- Sie landen im eigenen Netzwerk `awin-test` und werden öffentlich nie angezeigt.
  Startet der Worker ohne Testmodus, löscht er sie automatisch.

Was die Dateien abdecken: gleiche GTIN in 3 Shops/2 Ländern, Mehrfachpackung, Streu in Litern,
Zubehör mit Literangabe, Produkt ohne GTIN mit ähnlichem Gegenstück (→ Prüfliste), Hunde-Gewichtsbereich
(kein Grundpreis), unklare Tierart (→ Prüfliste), nicht lieferbar, Zeile ohne Link (wird übersprungen),
nicht freigeschalteter Feed (wird ignoriert).
