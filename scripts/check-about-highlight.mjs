import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import os from 'node:os';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright-core');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : { channel: 'msedge' }) });
const output = path.join(os.tmpdir(), 'dipanda-browser-checks'), checks = [], errors = [];
const check = (label, passed) => { assert.ok(passed, label); checks.push(label); console.log('PASS', label); };
await mkdir(output, { recursive: true });
try {
  for (const width of [1280, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1280 ? 900 : 844 }, reducedMotion: 'reduce', ...(width < 641 ? { isMobile: true, hasTouch: true } : {}) });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.TEST_URL || 'http://127.0.0.1:4173', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    if (await page.locator('[data-cookie-banner]').isVisible()) await page.locator('[data-cookie-banner] [data-cookie-reject]').click();
    await page.evaluate(() => document.fonts.ready);
    check('both title markers are removed at ' + width, await page.locator('.word-highlight,.about-word-ring').count() === 0);
    check('perder retains orange fill and uses white text at ' + width, await page.locator('.hero-highlight--orange').evaluate(word => word.textContent === 'perder' && getComputedStyle(word).backgroundColor === 'rgb(255, 106, 61)' && getComputedStyle(word).color === 'rgb(255, 255, 255)'));
    check('Transforme is fully green and its background meets the cursor at ' + width, await page.evaluate(() => {
      const word = document.querySelector('.hero-text-loop-word'), reveal = document.querySelector('.hero-text-loop-reveal'), cursor = document.querySelector('.hero-text-loop-cursor');
      const background = getComputedStyle(reveal, '::before'), a = reveal.getBoundingClientRect(), b = cursor.getBoundingClientRect();
      return getComputedStyle(word).color === 'rgb(214, 253, 112)' && getComputedStyle(word).backgroundImage === 'none' && [background.top,background.right,background.bottom,background.left].every(value => value === '0px') && Math.abs(a.right-b.right)<.1 && Math.abs(a.top-b.top)<.1 && Math.abs(a.bottom-b.bottom)<.1;
    }));
    check('scroll cue and title chevrons are absent at ' + width, await page.locator('.hero-scroll-cue,.hero-direction').count() === 0);
    check('gain phrase uses plain text at ' + width, await page.locator('.hero-copy p').evaluate(element => element.textContent.includes('maximizar os seus ganhos') && element.querySelectorAll('span').length === 1 && !element.querySelector('.hero-highlight--ink')));
    check('active tool uses white with dark readable text at ' + width, await page.locator('[data-tool-selector] .is-active').evaluate(element => getComputedStyle(element).backgroundColor === 'rgb(255, 255, 255)' && getComputedStyle(element.querySelector('.integration-name')).color === 'rgb(19, 19, 19)'));
    check('hero fits at ' + width, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('.hero-copy').getBoundingClientRect().right <= innerWidth));
    check('all four expanded tools fit inside the hero at ' + width, await page.evaluate(() => {
      const strip = document.querySelector('[data-tool-selector]'), items = [...strip.querySelectorAll('.integration-tool')];
      const original = items.findIndex(item => item.classList.contains('is-active'));
      const fits = items.every((item, index) => {
        items.forEach((tool, i) => tool.classList.toggle('is-active', i === index));
        const boxes = items.map(tool => tool.getBoundingClientRect()), box = strip.getBoundingClientRect();
        return boxes.every(tool => tool.left >= 0 && tool.right <= innerWidth) && box.bottom <= document.querySelector('.hero-surface').getBoundingClientRect().bottom;
      });
      items.forEach((tool, i) => tool.classList.toggle('is-active', i === original));
      return fits;
    }));
    await page.screenshot({ path: path.join(output, 'hero-plain-title-' + width + '.png') });
    await page.locator('.about-statement').scrollIntoViewIfNeeded();
    check('about title remains readable at ' + width, await page.locator('.about-statement').evaluate(heading => heading.scrollWidth <= heading.clientWidth && heading.querySelector('[data-whisper-word]').textContent === 'Aproximamos' && getComputedStyle(heading.querySelector('[data-whisper-word]')).fontStyle === 'normal'));
    await context.close();
  }
  check('no browser errors', errors.length === 0);
  await writeFile(path.join(output, 'about-highlight-results.json'), JSON.stringify({ checks, errors }, null, 2));
} finally { await browser.close(); }
