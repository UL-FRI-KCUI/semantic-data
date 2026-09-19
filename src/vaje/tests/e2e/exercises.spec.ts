import { expect, test, type Page } from '@playwright/test';

const codeLessons = [
  'od-tabele-do-grafa/podatki/tsv-v-rdf/',
  'od-tabele-do-grafa/podatki/popravi-turtle/',
  'model-in-povezave/ontologije/formaliziraj-obcino/',
  'model-in-povezave/ontologije/povezi-vira/',
  'poizvedovanje/sparql/sparql-nad-grafom/',
];

async function replaceEditor(page: Page, value: string) {
  const editor = page.locator('.cm-content');
  await editor.click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.insertText(value);
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
});

test('portal prikaže osem vaj, napredek in tipkovniško dostopne povezave', async ({ page }) => {
  await page.reload();
  await expect(page.getByRole('heading', { name: /Od tabele do/ })).toBeVisible();
  await expect(page.locator('.exercise-card')).toHaveCount(8);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '8');
  const firstExerciseLink = page.locator('.exercise-card a').first();
  await firstExerciseLink.focus();
  await expect(firstExerciseLink).toBeFocused();
  await expect(firstExerciseLink).toHaveCSS('outline-style', 'solid');
});

test('vaja 1: JSON-LD, schema.org, živi primer in trajen uspeh', async ({ page }) => {
  await page.goto('semantika-na-spletu/json-ld/kaj-pove-json-ld/');

  await expect(page.getByLabel('Skrajšan posnetek JSON-LD članka RTV Slovenija')).toContainText('"@type": "NewsArticle"');
  await expect(page.getByLabel('Skrajšan posnetek JSON-LD članka RTV Slovenija')).not.toContainText('ob_id');

  for (const name of ['NewsArticle', 'datePublished', 'publisher']) {
    await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute('target', '_blank');
    await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute('rel', 'noopener');
  }
  const liveLink = page.getByRole('link', { name: 'novico Predstavništva Evropske komisije v Sloveniji' });
  await expect(liveLink).toHaveAttribute('target', '_blank');
  await expect(liveLink).toHaveAttribute('href', /slovenia\.representation\.ec\.europa\.eu/);

  await page.getByTestId('check').click();
  await expect(page.getByTestId('feedback')).toContainText('@context');
  await page.getByTestId('hint').click();
  await expect(page.getByTestId('hint-text')).toContainText('Expected Type');
  await page.getByTestId('show-solution').click();
  await expect(page.getByTestId('solution')).toContainText('Thing > CreativeWork > Article > NewsArticle');
  await expect(page.getByTestId('completed')).toHaveCount(0);
  await page.getByTestId('reset').click();

  await page.getByTestId('context-meaning').selectOption('vocabulary');
  await page.getByTestId('type-meaning').selectOption('instance-class');
  await page.getByTestId('hierarchy').selectOption('thing-creativework-article-newsarticle');
  await page.getByTestId('date-type').selectOption('date-datetime');
  await page.getByTestId('publisher-type').selectOption('organization-person');
  await page.getByTestId('check').click();
  await expect(page.getByTestId('feedback')).toContainText('Pravilno');
  await expect(page.getByTestId('completed')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('completed')).toBeVisible();
  await expect(page.getByTestId('context-meaning')).toHaveValue('vocabulary');
});

test('vaja 2: napačen odgovor, namig, rešitev, ponastavitev in trajen uspeh', async ({ page }) => {
  await page.goto('od-tabele-do-grafa/podatki/kaj-nam-tsv-ne-pove/');
  await page.getByTestId('check').click();
  await expect(page.getByTestId('feedback')).toContainText('ob_id');
  await page.getByTestId('hint').click();
  await expect(page.getByTestId('hint-text')).toBeVisible();
  await page.getByTestId('show-solution').click();
  await expect(page.getByTestId('solution')).toBeVisible();
  await expect(page.getByTestId('completed')).toHaveCount(0);
  await page.getByTestId('reset').click();
  await expect(page.getByTestId('solution-panel')).toHaveCount(0);

  await page.getByTestId('id-type').selectOption('string');
  await page.getByTestId('population-type').selectOption('integer');
  await page.getByTestId('scope').check();
  await page.getByTestId('entity').check();
  await page.getByTestId('context').check();
  await page.getByTestId('check').click();
  await expect(page.getByTestId('completed')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('completed')).toBeVisible();
});

test('vaja 3 prikaže polne URI-je in začne brez predpon', async ({ page }) => {
  await page.goto('od-tabele-do-grafa/podatki/tsv-v-rdf/');
  const propertyTable = page.getByRole('table');
  await expect(propertyTable).toContainText('idObcinaSurs');
  await expect(propertyTable).toContainText('naziv');
  await expect(propertyTable).toContainText('steviloPrebivalcev');
  const editor = page.locator('.cm-content');
  await expect(editor).toContainText('https://onto.mdp.gov.si/obcina/ajdovscina');
  await expect(editor).not.toContainText('@prefix');
  await expect(editor).not.toContainText(';');
});

test('vaja 6 poda štiri pare občin in rešitev iz prikazanih povezav', async ({ page }) => {
  await page.goto('model-in-povezave/ontologije/povezi-vira/');
  const pairs = page.getByRole('table');
  await expect(pairs).toContainText('Obcina_1');
  await expect(pairs).toContainText('Obcina_11');
  await expect(pairs).toContainText('Obcina_61');
  await expect(pairs).toContainText('Obcina_70');
  await page.getByTestId('show-solution').click();
  const solution = page.getByTestId('solution');
  await expect(solution).toContainText('sursTBox:Obcina rdfs:subClassOf crp:Obcina');
  await expect(solution).toContainText('crp:Obcina_70 owl:sameAs sursABox:maribor');
  await expect(solution).not.toContainText('geo:Feature');
  await expect(solution).not.toContainText('skos:prefLabel');
});

test('vaja 7 vodi od vrstice SURS do povezanega grafa in obnovi napredek', async ({ page }) => {
  await page.goto('model-in-povezave/ontologije/od-podatkov-do-povezanega-grafa/');

  await expect(page.getByLabel('Podatkovna vrstica SURS za Kranj')).toContainText('052');
  await expect(page.getByTestId('capstone-step-2')).toBeDisabled();
  await page.getByTestId('check').click();
  await expect(page.getByTestId('feedback')).toContainText('URI');
  await page.getByTestId('hint').click();
  await expect(page.getByTestId('hint-text')).toContainText('Oznaka 052');
  await page.getByTestId('show-solution').click();
  await expect(page.getByTestId('solution')).toContainText('ločen primerek');
  await expect(page.getByTestId('completed')).toHaveCount(0);

  await page.getByTestId('capstone-uri').selectOption('obcina-kranj');
  await page.getByTestId('capstone-id-type').selectOption('string');
  await page.getByTestId('capstone-measurement-model').selectOption('separate-resource');
  await page.getByTestId('check').click();
  await expect(page.getByTestId('capstone-step-2')).toBeEnabled();
  await expect(page.getByTestId('capstone-abox-editor')).toBeVisible();

  await page.getByTestId('show-solution').click();
  await replaceEditor(page, await page.getByTestId('solution').innerText());
  await page.getByTestId('check').click();
  await expect(page.getByTestId('capstone-tbox-editor')).toBeVisible();

  await page.getByTestId('show-solution').click();
  await replaceEditor(page, await page.getByTestId('solution').innerText());
  await page.getByTestId('check').click();
  await expect(page.getByTestId('capstone-links-editor')).toBeVisible();

  await page.getByTestId('show-solution').click();
  await replaceEditor(page, await page.getByTestId('solution').innerText());
  await page.getByTestId('capstone-identity-relation').selectOption('same-as-instances');
  await page.getByTestId('check').click();
  await expect(page.getByTestId('completed')).toBeVisible();
  await expect(page.locator('.graph-panel')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('completed')).toBeVisible();
  await expect(page.getByTestId('capstone-links-editor')).toBeVisible();
  await expect(page.locator('.graph-panel')).toBeVisible();

  await page.getByTestId('capstone-step-2').click();
  await page.locator('.cm-content').click();
  await page.keyboard.insertText(' ');
  await expect(page.getByTestId('completed')).toHaveCount(0);
  await expect(page.getByTestId('capstone-step-3')).toBeDisabled();
  await page.getByTestId('reset').click();
  await expect(page.getByTestId('capstone-step-2')).toBeDisabled();
  await expect(page.getByTestId('capstone-uri')).toHaveValue('');
});

for (const lesson of codeLessons) {
  test(`${lesson}: napačen odgovor, namig, rešitev, ponastavitev in trajen uspeh`, async ({ page }) => {
    await page.goto(lesson);
    await page.getByTestId('check').click();
    await expect(page.getByTestId('feedback')).toBeVisible();
    await page.getByTestId('hint').click();
    await expect(page.getByTestId('hint-text')).toBeVisible();
    await page.getByTestId('show-solution').click();
    const solution = await page.getByTestId('solution').innerText();
    await expect(page.getByTestId('completed')).toHaveCount(0);
    await page.getByTestId('reset').click();
    await expect(page.getByTestId('solution-panel')).toHaveCount(0);

    await replaceEditor(page, solution);
    await page.getByTestId('check').click();
    await expect(page.getByTestId('feedback')).toContainText(/Odlično|Model je skladen|Vira sta povezana|Pravilno/);
    await expect(page.getByTestId('completed')).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('completed')).toBeVisible();
  });
}
