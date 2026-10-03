import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright-core');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : { channel: 'msedge' }) });
const output = path.join(os.tmpdir(), 'dipanda-browser-checks');
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    window.__heroCost = { gridDraws: 0, svgDraws: 0, gridMs: 0, meshDraws: 0, meshPixels: 0, rasterisations: 0 };
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(source, ...args) {
      if (source instanceof HTMLImageElement && source.matches('.hero-grid')) window.__heroCost.rasterisations++;
      if (!this.canvas.matches('.hero-grid-canvas')) return draw.call(this, source, ...args);
      const start = performance.now();
      const result = draw.call(this, source, ...args);
      window.__heroCost.gridDraws++;
      window.__heroCost.svgDraws += source instanceof HTMLImageElement ? 1 : 0;
      window.__heroCost.gridMs += performance.now() - start;
      return result;
    };
    const mesh = WebGLRenderingContext.prototype.drawArrays;
    WebGLRenderingContext.prototype.drawArrays = function(...args) {
      if (this.canvas.matches('[data-hero-shader]')) {
        window.__heroCost.meshDraws++;
        window.__heroCost.meshPixels += this.canvas.width * this.canvas.height;
      }
      return mesh.apply(this, args);
    };
  });
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForFunction(() => document.querySelector('[data-hero-shader]').dataset.shaderState === 'running', null, { timeout: 60_000 });
  if (await page.locator('[data-cookie-banner]').isVisible()) await page.locator('[data-cookie-banner] [data-cookie-reject]').click();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1600);
  const result = await page.evaluate(() => new Promise(resolve => {
    const hero = document.querySelector('.hero-surface'), start = performance.now();
    const before = { ...window.__heroCost }, deltas = [];
    let previous = null, index = 0;
    function frame(now) {
      if (previous !== null) deltas.push(now - previous);
      previous = now;
      hero.dispatchEvent(new PointerEvent('pointermove', { clientX: 170 + Math.sin(index * .18) * 130, clientY: 350 + Math.cos(index * .13) * 100, pointerType: 'mouse' }));
      index++;
      if (now - start < 2000) { requestAnimationFrame(frame); return; }
      const elapsed = performance.now() - start;
      const cost = Object.fromEntries(Object.entries(window.__heroCost).map(([key, value]) => [key, value - before[key]]));
      const sorted = deltas.toSorted((a, b) => a - b), rounded = value => Math.round(value * 10) / 10;
      const mesh = document.querySelector('[data-hero-shader]'), grid = document.querySelector('.hero-grid-canvas');
      resolve({ elapsedMs: Math.round(elapsed), rafFps: rounded(deltas.length * 1000 / elapsed), rafP95Ms: rounded(sorted[Math.floor(sorted.length * .95)]), meshPixels: mesh.width * mesh.height, meshDrawsPerSecond: rounded(cost.meshDraws * 1000 / elapsed), meshPixelsPerSecond: Math.round(cost.meshPixels * 1000 / elapsed), gridSourceDraws: cost.gridDraws, gridSVGDraws: cost.svgDraws, gridDrawCpuMs: rounded(cost.gridMs), gridBitmapPixels: grid.width * grid.height, gridRasterisations: window.__heroCost.rasterisations, gridResponded: document.querySelector('.hero-art').hasAttribute('data-grid-active') });
    }
    requestAnimationFrame(frame);
  }));
  assert.ok(result.gridSourceDraws > 0 && result.gridResponded, 'grid remains interactive');
  assert.equal(result.gridSVGDraws, 0, 'interactive frames reuse the cached bitmap');
  assert.equal(result.gridRasterisations, 1, 'SVG is rasterised only once');
  assert.ok(result.gridBitmapPixels <= 500_000 && result.meshPixels <= 320_000, 'rendering budgets are bounded');
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'hero-performance-after.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await browser.close(); }
