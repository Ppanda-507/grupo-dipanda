import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import os from 'node:os';
import path from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright-core');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : { channel: 'msedge' }) });
const output = path.join(os.tmpdir(), 'dipanda-browser-checks');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
const checks = [], errors = [];
function check(label, condition) { assert.ok(condition, label); checks.push(label); console.log('PASS', label); }
await mkdir(output, { recursive: true });

async function colourDifference(page, initial, ready) {
  return page.evaluate(async ({ initial, ready }) => {
    async function pixels(encoded) {
      const image = await createImageBitmap(await (await fetch('data:image/png;base64,' + encoded)).blob());
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0); image.close();
      return context.getImageData(0, 0, canvas.width, canvas.height);
    }
    const first = await pixels(initial), final = await pixels(ready);
    const box = document.querySelector('.hero-surface').getBoundingClientRect();
    const points = [[.04,.15],[.5,.15],[.96,.15],[.04,.5],[.96,.5],[.04,.9],[.5,.94],[.96,.9]];
    return points.map(([x, y]) => {
      const cx = Math.round(box.left + box.width * x), cy = Math.round(box.top + box.height * y);
      const sums = [0, 0, 0];
      let count = 0;
      for (let py = cy - 3; py <= cy + 3; py++) for (let px = cx - 3; px <= cx + 3; px++) {
        const i = (py * first.width + px) * 4;
        for (let channel = 0; channel < 3; channel++) sums[channel] += first.data[i + channel] - final.data[i + channel];
        count++;
      }
      return Math.max(...sums.map(sum => Math.abs(sum / count)));
    });
  }, { initial: initial.toString('base64'), ready: ready.toString('base64') });
}

try {
  for (const [width, height] of [[1280,900], [390,844]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const held = [];
    await context.route('**/js/hero-shader.js', route => { held.push(route); });
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    page.on('pageerror', error => errors.push(error.message));
    for (const visit of ['cold-load', 'refresh']) {
      if (visit === 'refresh') await page.reload({ waitUntil: 'commit' });
      else await page.goto(base, { waitUntil: 'commit' });
      await page.waitForFunction(() => {
        const surface = document.querySelector('.hero-surface');
        return surface?.querySelector('.hero-static-mesh image') && getComputedStyle(surface).backgroundColor === 'rgb(6, 43, 92)';
      });
      await page.evaluate(() => document.fonts.ready);
      const initial = await page.screenshot({ path: path.join(output, `hero-startup-${width}-${visit}-initial.png`) });
      check(`${width}px ${visit}: the final mesh appearance is visible before JavaScript is ready`, await page.evaluate(() => {
        const hero = document.querySelector('.hero-surface');
        return !hero.hasAttribute('data-shader-ready') && !hero.querySelector('.hero-scene') && hero.querySelector('.hero-static-mesh image').getAttribute('href').startsWith('data:image/webp;') && getComputedStyle(hero.querySelector('h1')).opacity === '1' && document.documentElement.scrollWidth <= innerWidth;
      }));
      await Promise.all(held.splice(0).map(route => route.continue()));
      await page.waitForFunction(() => document.querySelector('[data-hero-shader]').dataset.shaderState === 'paused');
      if (await page.locator('[data-cookie-banner]').isVisible()) await page.locator('[data-cookie-banner] [data-cookie-reject]').click();
      const ready = await page.screenshot({ path: path.join(output, `hero-startup-${width}-${visit}-ready.png`) });
      const differences = await colourDifference(page, initial, ready);
      console.log('COLOUR DIFFERENCES', width, visit, differences.map(value => Number(value.toFixed(2))));
      check(`${width}px ${visit}: the first paint and real shader share the same background colours`, Math.max(...differences) < 12);
    }
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  let grid;
  await context.route('**/assets/figma/2-57-13a95.svg', route => { grid = route; });
  await context.addInitScript(() => { window.__pageLoaded = false; window.addEventListener('load', () => { window.__pageLoaded = true; }, { once: true }); });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'commit' });
  await page.waitForFunction(() => document.querySelector('[data-hero-shader]')?.dataset.shaderState === 'running', null, { timeout: 60_000 });
  check('the live mesh starts while unrelated images are still loading', await page.evaluate(() => !window.__pageLoaded && !document.querySelector('.hero-grid').complete && document.querySelector('.hero-surface').hasAttribute('data-shader-ready')));
  await grid.continue();
  await page.waitForLoadState('load');
  check('startup and refresh produce no JavaScript errors', errors.length === 0);
  await writeFile(path.join(output, 'hero-startup-results.json'), JSON.stringify({ checks, errors }, null, 2));
  console.log(`${checks.length} startup checks passed.`);
} finally { await browser.close(); }
