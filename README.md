# MY STYLE — Personal Style Studio

Mobile-first, deutschsprachige Fashion-Web-App (erste Testversion).

## Aktueller Stand
- **Wardrobe:** eigene Kleidungsstücke mit Foto, Kategorie und Notiz erfassen; Fotos werden vor dem Speichern verkleinert.
- **Look Finder:** eigene Pieces auswählen und Outfit-Entwürfe speichern.
- **Discover:** kuratierte Style-Richtung und Links zu externen Inspirationsquellen. Noch **kein** automatisch aktualisierter Instagram-/Film-Feed.
- **Shopping:** Suchanfragen an Vinted oder Google Shopping weitergeben. Noch **kein** Live-Preisvergleich und keine Verfügbarkeitsprüfung.
- **Sell Studio:** Anzeigenentwürfe lokal speichern und Text kopieren. Noch keine direkte Vinted-Veröffentlichung.
- **Backup:** JSON-Sicherung exportieren und bewusst wieder einspielen.
- **PWA-Grundlagen:** Manifest und eigenes SVG-Icon.

## App öffnen
Bei aktivierten GitHub Pages (Branch `main`, Verzeichnis `/(root)`):
https://yztg676k7r-arch.github.io/my-style/

Die App ist eine statische Website ohne Build-Schritt. Lokal lässt sie sich über einen einfachen HTTP-Server testen, z. B. `python3 -m http.server 8000` und dann `http://localhost:8000` öffnen.

## Datenschutz und Grenzen
**Wichtig:** Diese Version bietet **noch keine Anmeldung und keine geräteübergreifende Synchronisierung**. Daten und verkleinerte Fotos liegen ausschließlich im `localStorage` des jeweiligen Browsers und können bei gelöschten Browserdaten oder Gerätewechsel verloren gehen. Regelmäßig ein Backup herunterladen und geschützt aufbewahren. Import ersetzt nach Bestätigung den lokalen Datenbestand.

Das GitHub-Repository ist öffentlich. **Niemals Zugangsdaten, API-Schlüssel, private Fotos oder Nutzerdaten in Repository-Dateien committen.** Die eigenen Fotos aus dem Kleiderschrank werden nicht ins Repository hochgeladen.

## Nächste technische Schritte
1. Browser- und iPhone-Funktionstests sowie Accessibility- und Speichergrenzen prüfen.
2. Authentifizierung über einen geeigneten Dienst mit verwalteten Benutzerkonten und sicherer, benutzerbezogener Speicherung planen; keine Passwortverwaltung im Frontend.
3. Migration vorhandener lokaler Daten erst nach Backup und ausdrücklicher Freigabe anbieten.
4. Discover-Datenquellen mit Nutzungsrechten und Aktualisierung beim Öffnen integrieren.
5. Shopping- und Vinted-Funktionen mit überprüfbaren Ergebnissen statt Platzhaltern ausbauen.

## Technische Struktur
- `index.html` – statische App mit HTML, CSS und JavaScript
- `manifest.webmanifest` – Installationsmetadaten
- `icon.svg` – App-Icon

Alle vorhandenen Daten sollten bei späteren Updates erhalten bleiben. Keine stillschweigende Löschung oder Ersetzung von Nutzerdaten.
