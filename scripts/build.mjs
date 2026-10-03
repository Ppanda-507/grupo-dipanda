import { mkdir, rm, cp, writeFile, stat, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { pages, renderPage } from '../src/pages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try { process.loadEnvFile(path.join(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const outputIndex = process.argv.indexOf('--output');
const output = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : path.resolve(root, 'dist');
const normalOutput = path.resolve(root, 'dist');
const temporaryOutput = path.join(os.tmpdir(), 'dipanda-site-dist');
if (output !== normalOutput && output !== temporaryOutput) throw new Error('Build output must be the project dist folder or the dedicated temporary dipanda-site-dist folder.');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'public'), output, { recursive: true });
// Temporary fallback is used only by the restricted development environment.
for (const [temporaryName, folder] of [['dipanda-site-assets', 'assets/figma'], ['dipanda-site-fonts', 'fonts'], ['dipanda-process-assets', 'assets/process'], ['dipanda-hero-assets', 'assets/hero']]) {
  const temporary = path.join(os.tmpdir(), temporaryName);
  if ((await stat(temporary).catch(() => null))?.isDirectory()) {
    const destination = path.join(output, folder);
    await mkdir(destination, { recursive: true });
    for (const file of await readdir(temporary)) {
      const current = await stat(path.join(destination, file)).catch(() => null);
      if (!current?.isFile() || current.size < 2) await cp(path.join(temporary, file), path.join(destination, file));
    }
  }
}
for (const route of Object.keys(pages)) {
  const folder = path.join(output, route.slice(1));
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'index.html'), renderPage(route));
}
await writeFile(path.join(output, '404.html'), renderPage('/404'));
console.log(`Built ${Object.keys(pages).length} pages into ${output}`);
