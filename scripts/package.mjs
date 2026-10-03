import { mkdir, cp, stat, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = path.join(os.tmpdir(), 'dipanda-delivery', 'dipanda');
await mkdir(destination, { recursive: true });
for (const item of ['src', 'public', 'scripts', 'tests', 'package.json', 'package-lock.json', '.gitignore', '.env.example', 'README.md']) await cp(path.join(root, item), path.join(destination, item), { recursive: true });
for (const [temporaryName, folder] of [['dipanda-site-assets', 'public/assets/figma'], ['dipanda-site-fonts', 'public/fonts'], ['dipanda-process-assets', 'public/assets/process'], ['dipanda-hero-assets', 'public/assets/hero'], ['dipanda-site-dist', 'dist']]) {
  const temporary = path.join(os.tmpdir(), temporaryName);
  if ((await stat(temporary).catch(() => null))?.isDirectory()) await cp(temporary, path.join(destination, folder), { recursive: true });
}
const assets = await readdir(path.join(destination, 'public/assets/figma'));
for (const asset of assets.filter(file => /\.(svg|png|jpg|jpeg|webp|avif)$/i.test(file))) if ((await stat(path.join(destination, 'public/assets/figma', asset))).size < 2) throw new Error(`Empty asset: ${asset}`);
const checks = path.join(os.tmpdir(), 'dipanda-browser-checks', 'results.json');
if ((await stat(checks).catch(() => null))?.isFile()) await cp(checks, path.join(destination, 'tests', 'browser-results.json'));
const motionChecks = path.join(os.tmpdir(), 'dipanda-browser-checks', 'motion-results.json');
if ((await stat(motionChecks).catch(() => null))?.isFile()) await cp(motionChecks, path.join(destination, 'tests', 'motion-results.json'));
const heroChecks = path.join(os.tmpdir(), 'dipanda-browser-checks', 'hero-results.json');
if ((await stat(heroChecks).catch(() => null))?.isFile()) await cp(heroChecks, path.join(destination, 'tests', 'hero-results.json'));
const processChecks = path.join(os.tmpdir(), 'dipanda-browser-checks', 'process-results.json');
if ((await stat(processChecks).catch(() => null))?.isFile()) await cp(processChecks, path.join(destination, 'tests', 'process-results.json'));
for (const report of ['image-reference-results.json', 'compact-solution-results.json', 'about-problem-results.json', 'hero-shader-results.json', 'hero-startup-results.json']) {
  const reportPath = path.join(os.tmpdir(), 'dipanda-browser-checks', report);
  if ((await stat(reportPath).catch(() => null))?.isFile()) await cp(reportPath, path.join(destination, 'tests', report));
}
await writeFile(path.join(destination, 'DELIVERY.txt'), 'Projeto completo Dipanda. Consulte README.md para executar e configurar. Imagens e fontes locais incluídas.\n');
console.log(destination);
