# Predstavitev delavnice

Izvor predstavitve je `predstavitev.Rmd`, izhoda pa sta Reveal.js HTML in PDF v razmerju 16 : 9.

## Izgradnja

V tej mapi zaženite:

```sh
./build_predstavitev.sh
```

Skript najprej ustvari `predstavitev.html`, nato pa iz iste predstavitve s tiskalnim načinom Reveal.js ustvari `predstavitev.pdf`. Potrebujete odvisnosti portala (`cd vaje && npm ci`) in Chromium za Playwright (`npx playwright install chromium`). PDF vsebuje en diapozitiv na stran in ne vsebuje govornih opomb.

Ker predstavitev ni samostojna datoteka (`self_contained: false`), jo odprite prek lokalnega spletnega strežnika:

```sh
python3 -m http.server 8000
```

Nato obiščite <http://localhost:8000/predstavitev.html>. Pri objavi vedno prenesite `predstavitev.html`, `predstavitev.pdf`, `predstavitev_files/`, `assets/` in `gradivo/` skupaj.

## Interaktivne vaje

Portal TutorialKit je v mapi `vaje/`. Za lokalni razvoj potrebujete Node.js 22:

```sh
cd vaje
npm ci
npm test
npm run dev
```

Portal je zaradi nastavitve za GitHub Pages dosegljiv na lokalni poti <http://localhost:4321/semantic-data/vaje/>. Produkcijski izhod nastane z `npm run build` v mapi `vaje/dist/`.

GitHub Actions obe gradnji združi v en Pages artefakt: predstavitev je na korenu strani, vaje pa pod `/vaje/`.
