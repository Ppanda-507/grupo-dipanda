import { mkdir, rm, copyFile, writeFile, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { pages, renderPage } from '../src/pages/index.mjs';
import { assertProjectAssets } from './project-assets.mjs';
import { assertPublicFiles, assertDistFiles } from './public-artifacts.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try { process.loadEnvFile(path.join(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const outputIndex = process.argv.indexOf('--output');
const output = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : path.resolve(root, 'dist');
const normalOutput = path.resolve(root, 'dist');
const temporaryOutput = path.join(os.tmpdir(), 'dipanda-site-dist');
if (output !== normalOutput && output !== temporaryOutput) throw new Error('Build output must be the project dist folder or the dedicated temporary dipanda-site-dist folder.');
const renderedPages = new Map(Object.keys(pages).map(route => [route, renderPage(route)]));
const publicFiles = await assertPublicFiles(path.join(root, 'public'));
const assetCount = await assertProjectAssets(path.join(root, 'public'), renderedPages.values());
const existingOutput = await lstat(output).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
if (existingOutput?.isSymbolicLink()) throw new Error('Build output must not be a symbolic link.');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of publicFiles) {
  const destination = path.join(output, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(path.join(root, 'public', file), destination);
}
for (const [route, html] of renderedPages) {
  const folder = path.join(output, route.slice(1));
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'index.html'), html);
}
await writeFile(path.join(output, '404.html'), renderPage('/404'));
await writeFile(path.join(output, '500.html'), renderPage('/500'));
await writeFile(path.join(output, '503.html'), renderPage('/503'));
const artifactCount = await assertDistFiles(output, renderedPages.keys(), publicFiles);
console.log(`Built ${renderedPages.size} pages with ${assetCount} verified resources (${artifactCount} public files) into ${output}`);
