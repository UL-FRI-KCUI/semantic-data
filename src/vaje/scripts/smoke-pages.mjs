import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium } from '@playwright/test';

const siteDirectory = resolve(process.argv[2] ?? '_site');
const repositoryBase = '/semantic-data';
const portalBase = `${repositoryBase}/vaje/`;
const portalRoutes = [
  '',
  'semantika-na-spletu/json-ld/kaj-pove-json-ld/',
  'od-tabele-do-grafa/podatki/kaj-nam-tsv-ne-pove/',
  'od-tabele-do-grafa/podatki/tsv-v-rdf/',
  'od-tabele-do-grafa/podatki/popravi-turtle/',
  'model-in-povezave/ontologije/formaliziraj-obcino/',
  'model-in-povezave/ontologije/povezi-vira/',
  'model-in-povezave/ontologije/od-podatkov-do-povezanega-grafa/',
  'poizvedovanje/sparql/sparql-nad-grafom/',
];

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    if (!pathname.startsWith(repositoryBase)) {
      response.writeHead(404).end('Not found');
      return;
    }

    pathname = pathname.slice(repositoryBase.length) || '/';
    let filePath = resolve(siteDirectory, pathname.replace(/^\/+/, ''));
    if (filePath !== siteDirectory && !filePath.startsWith(`${siteDirectory}${sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    if ((await stat(filePath)).isDirectory()) filePath = resolve(filePath, 'index.html');
    const body = await readFile(filePath);
    response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

await new Promise((resolveStarted) => server.listen(0, '127.0.0.1', resolveStarted));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('Local test server did not start.');
const origin = `http://127.0.0.1:${address.port}`;

const browser = await chromium.launch();

try {
  const presentation = await browser.newPage();
  const presentationResponse = await presentation.goto(`${origin}${repositoryBase}/`, { waitUntil: 'domcontentloaded' });
  if (!presentationResponse?.ok()) throw new Error('Presentation entry point did not return HTTP 200.');
  await presentation.locator('.reveal').waitFor();

  const pdfResponse = await presentation.request.get(`${origin}${repositoryBase}/predstavitev.pdf`);
  if (!pdfResponse.ok()) throw new Error('Presentation PDF did not return HTTP 200.');
  const pdfBody = await pdfResponse.body();
  if (!pdfBody.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('Presentation PDF is not a valid PDF file.');
  await presentation.close();

  const page = await browser.newPage();
  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => problems.push(`request: ${request.url()} (${request.failure()?.errorText})`));
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== origin) problems.push(`external request: ${request.url()}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`);
  });

  for (const route of portalRoutes) {
    const response = await page.goto(`${origin}${portalBase}${route}`, { waitUntil: 'networkidle' });
    if (!response?.ok()) problems.push(`route did not return HTTP 200: ${route || '/'}`);

    if (route === '') {
      if (await page.locator('.exercise-card').count() !== 8) problems.push('portal does not contain eight exercise cards');
      const pdfLink = page.locator('a[href="/semantic-data/predstavitev.pdf"]');
      if (await pdfLink.count() !== 1) problems.push('portal does not contain the presentation PDF link');
    } else {
      await page.locator('.exercise-shell').waitFor();
      await page.getByTestId('check').waitFor({ state: 'visible' });
    }

    const brokenImages = await page.locator('img').evaluateAll((images) =>
      images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.getAttribute('src')),
    );
    if (brokenImages.length) problems.push(`broken images on ${route || '/'}: ${brokenImages.join(', ')}`);
  }

  await page.getByTestId('show-solution').click();
  const sparqlSolution = await page.getByTestId('solution').innerText();
  await page.locator('.cm-content').click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.insertText(sparqlSolution);
  await page.getByTestId('check').click();
  await page.getByTestId('completed').waitFor();
  if (await page.locator('[data-testid="results"] tbody tr').count() !== 2) {
    problems.push('SPARQL exercise did not return the two expected rows');
  }

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.exercise-shell').waitFor();

  if (problems.length) throw new Error(`Pages smoke test failed:\n${[...new Set(problems)].join('\n')}`);
  console.log(`Pages smoke test passed for the presentation and ${portalRoutes.length} portal routes.`);
} finally {
  await browser.close();
  await new Promise((resolveClosed) => server.close(resolveClosed));
}
