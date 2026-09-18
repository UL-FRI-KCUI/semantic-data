# Predstavitev delavnice

Izvor predstavitve je `predstavitev.Rmd`, izhod pa je Reveal.js HTML v razmerju 16 : 9.

## Izgradnja

V tej mapi zaženite:

```sh
Rscript -e "rmarkdown::render('predstavitev.Rmd')"
```

Ker predstavitev ni samostojna datoteka (`self_contained: false`), jo odprite prek lokalnega spletnega strežnika:

```sh
python3 -m http.server 8000
```

Nato obiščite <http://localhost:8000/predstavitev.html>. Pri objavi vedno prenesite `predstavitev.html`, `predstavitev_files/`, `assets/` in `gradivo/` skupaj.

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
