import { mkdir, rm, cp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { pages, renderPage } from '../src/pages.mjs';
import { assertProjectAssets } from './project-assets.mjs';
import { assertProductionReady } from './production-readiness.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try { process.loadEnvFile(path.join(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (process.argv.includes('--production') || process.env.VERCEL_ENV === 'production') assertProductionReady();
const outputIndex = process.argv.indexOf('--output');
const output = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : path.resolve(root, 'dist');
const normalOutput = path.resolve(root, 'dist');
const temporaryOutput = path.join(os.tmpdir(), 'dipanda-site-dist');
if (output !== normalOutput && output !== temporaryOutput) throw new Error('Build output must be the project dist folder or the dedicated temporary dipanda-site-dist folder.');
const renderedPages = new Map(Object.keys(pages).map(route => [route, renderPage(route)]));
const assetCount = await assertProjectAssets(path.join(root, 'public'), renderedPages.values());
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'public'), output, { recursive: true });
for (const [route, html] of renderedPages) {
  const folder = path.join(output, route.slice(1));
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'index.html'), html);
}
await writeFile(path.join(output, '404.html'), renderPage('/404'));
await writeFile(path.join(output, '500.html'), renderPage('/500'));
await writeFile(path.join(output, '503.html'), renderPage('/503'));
console.log(`Built ${renderedPages.size} pages with ${assetCount} verified local resources into ${output}`);
