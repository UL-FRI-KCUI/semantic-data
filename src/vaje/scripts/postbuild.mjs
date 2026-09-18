import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDir = fileURLToPath(new URL('../dist/', import.meta.url));
const projectPath = process.cwd().replaceAll('\\', '/');
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.map', '.txt', '.xml']);

async function textFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? textFiles(path) : [path];
  }));
  return files.flat().filter((path) => textExtensions.has(extname(path)));
}

for (const path of await textFiles(outputDir)) {
  const source = await readFile(path, 'utf8');
  const sanitized = source.replaceAll(projectPath, '[project]');
  if (sanitized !== source) await writeFile(path, sanitized);
}

const remaining = [];
for (const path of await textFiles(outputDir)) {
  const source = await readFile(path, 'utf8');
  if (source.includes(projectPath) || source.includes('/Users/')) remaining.push(path);
}

if (remaining.length) {
  throw new Error(`Build contains absolute local paths:\n${remaining.join('\n')}`);
}
