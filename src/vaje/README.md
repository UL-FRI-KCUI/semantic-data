# Interaktivne vaje

Statični portal uporablja TutorialKit 1.6.0 kot vsebinski okvir, vaje pa se izvajajo z lastnimi odjemalskimi komponentami. WebContainer editor, predogled procesov in terminal so izključeni, zato portal deluje na GitHub Pages brez posebnih strežniških glav.

## Lokalni razvoj

Zahtevana je različica Node.js 22.

```sh
npm ci
npm run dev
```

Odprite <http://localhost:4321/semantic-data/vaje/>.

## Preverjanje in izgradnja

```sh
npm test
npm run test:e2e
npm run build
```

Statični rezultat je v `dist/`. Vsebina lekcij je urejena kot deli, poglavja in lekcije v `src/content/tutorial/`. Enokoračne vaje uporablja skupna komponenta `src/components/Exercise.tsx`, zaključna vaja pa ima namensko večstopenjsko komponento.

Napredek ostane samo v uporabnikovem brskalniku pod ključi `semantic-data:vaje:v1:<lesson-id>` oziroma pod obstoječimi različicami ključev posameznih vaj.
