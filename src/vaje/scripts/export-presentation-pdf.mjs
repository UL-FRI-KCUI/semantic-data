import { access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const sourceDirectory = resolve(scriptDirectory, '../..');
const htmlPath = resolve(sourceDirectory, process.argv[2] ?? 'predstavitev.html');
const pdfPath = resolve(sourceDirectory, process.argv[3] ?? 'predstavitev.pdf');

await access(htmlPath);

const browser = await chromium.launch();

try {
  const page = await browser.newPage();
  const loadFailures = [];

  page.on('pageerror', (error) => loadFailures.push(error.message));
  page.on('requestfailed', (request) => {
    loadFailures.push(`${request.url()} (${request.failure()?.errorText ?? 'request failed'})`);
  });

  const presentationUrl = new URL(pathToFileURL(htmlPath));
  presentationUrl.searchParams.set('print-pdf', '');

  await page.goto(presentationUrl.href, { waitUntil: 'load' });
  await page.waitForFunction(
    () => {
      const reveal = Reflect.get(window, 'Reveal');
      return (
        reveal?.isReady() &&
        reveal?.isPrintingPDF() &&
        reveal.getSlides().length > 0 &&
        document.querySelectorAll('.pdf-page').length === reveal.getSlides().length
      );
    },
    undefined,
    { timeout: 60_000 },
  );

  const result = await page.evaluate(async () => {
    const reveal = Reflect.get(window, 'Reveal');
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));

    // Reveal.js 4.2.1 forces a page break after every generated page, including
    // the last one. Chromium otherwise appends an empty page to the PDF.
    const pdfPages = [...document.querySelectorAll('.pdf-page')];
    const lastPage = pdfPages.at(-1);
    if (lastPage instanceof HTMLElement) {
      lastPage.style.breakAfter = 'auto';
    }
    await new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame)));

    return {
      brokenImages: [...document.images]
        .filter((image) => image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
      pageCount: pdfPages.length,
      slideCount: reveal.getSlides().length,
    };
  });

  if (loadFailures.length > 0) {
    throw new Error(`Predstavitev vsebuje neuspele zahteve:\n${loadFailures.join('\n')}`);
  }
  if (result.brokenImages.length > 0) {
    throw new Error(`Slike se niso naložile:\n${result.brokenImages.join('\n')}`);
  }
  if (result.pageCount !== result.slideCount) {
    throw new Error(`Pričakovanih je ${result.slideCount} strani PDF, pripravljenih pa je ${result.pageCount}.`);
  }

  await page.pdf({
    path: pdfPath,
    printBackground: true,
    preferCSSPageSize: true,
  });

  console.log(`PDF vsebuje ${result.pageCount} strani: ${pdfPath}`);
} finally {
  await browser.close();
}
