import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright-core');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : { channel: 'msedge' }) });
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
const output = process.env.TEST_OUTPUT || path.join(os.tmpdir(), 'dipanda-browser-checks');
await mkdir(output, { recursive: true });
const checks = [], errors = [];
const check = (label, condition) => { assert.ok(condition, label); checks.push(label); console.log('PASS', label); };
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
async function ready(target) {
  await target.goto(base, { waitUntil: 'networkidle' });
  if (await target.locator('[data-cookie-banner]').isVisible()) await target.locator('[data-cookie-banner] [data-cookie-reject]').click();
  await target.evaluate(() => document.fonts.ready);
  await target.locator('.process-section img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
  await target.waitForFunction(() => [...document.querySelectorAll('.process-section img')].every(image => image.complete && image.naturalWidth > 0));
}
try {
  await ready(page);
  const cards = page.locator('.solution-card');
  const group = page.locator('[data-process-cards]');
  const steps = group.locator('[data-process-card]');
  const slot = page.locator('.process-rotator');
  check('Nossa solução replaces the old iceberg and introduces three services', await page.locator('.process-art').count() === 0 && await cards.count() === 3);
  check('the full descriptions remain while duplicate labels and actions are removed', await cards.evaluateAll(cards =>
    cards.every(card => !card.querySelector('.solution-role,.solution-card-link')) && !document.querySelector('.solution-image-note') &&
    cards[0].querySelector('.solution-description').textContent.includes('tomar decisões com confiança') && cards[1].querySelector('.solution-description').textContent.includes('recolher informação') && cards[2].querySelector('.solution-description').textContent.includes('facilitamos marcações')));
  check('each solution has three distinct loaded images with descriptions', await cards.evaluateAll(cards => cards.every(card => {
    const images = [...card.querySelectorAll('.solution-images img')];
    return images.length === 3 && new Set(images.map(image => image.src)).size === 3 && images.every(image => image.naturalWidth > 0 && image.alt.length > 10);
  })));
  await cards.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1600);
  await cards.first().hover();
  await page.waitForTimeout(400);
  check('hover fans the stacked images outward and lifts the card gently', await cards.first().evaluate(card => {
    const frames = [...card.querySelectorAll('.solution-image')], last = new DOMMatrixReadOnly(getComputedStyle(frames[2]).transform);
    return new DOMMatrixReadOnly(getComputedStyle(card).transform).m42 === -4 && last.m41 > 100 && last.m12 > 0 && new DOMMatrixReadOnly(getComputedStyle(frames[0]).transform).m12 < 0 && [...card.querySelectorAll('.solution-image img')].every(image => getComputedStyle(image).transform === 'none');
  }));
  await page.mouse.move(1439, 0);
  await cards.first().focus();
  await page.keyboard.press('Tab');
  await page.waitForTimeout(400);
  check('keyboard focus offers the same image fan effect', await cards.nth(1).locator('.solution-image').nth(2).evaluate(frame => new DOMMatrixReadOnly(getComputedStyle(frame).transform).m41 > 100));
  for (const href of await cards.evaluateAll(cards => cards.map(card => card.getAttribute('href')))) check(`solution action resolves: ${href}`, (await context.request.get(`${base}${href}`)).status() === 200);
  await slot.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.process-heading [data-whisper]').dataset.whisperState === 'complete');
  const slotWidth = await slot.evaluate(element => element.getBoundingClientRect().width);
  await page.waitForFunction(() => document.querySelector('.process-rotator [data-word-next]').textContent === 'Desde o primeiro dia' && document.querySelector('.process-rotator [data-word-next]').getAnimations().length > 0);
  check('the process phrase uses the same spring as the About phrase', await slot.locator('[data-word-next]').evaluate(element => {
    const effect = element.getAnimations()[0]?.effect;
    return effect?.getTiming().duration === 1600 && effect.getKeyframes().length === 97;
  }));
  await page.waitForFunction(() => document.querySelector('.process-rotator [data-word-current]').textContent === 'Desde o primeiro dia');
  check('the rotating process phrase changes without changing its width', Math.abs(await slot.evaluate(element => element.getBoundingClientRect().width) - slotWidth) < .1);
  await page.waitForFunction(() => document.querySelector('.process-rotator [data-word-current]').textContent === 'Valor em cada entrega.');
  check('the process phrase loops back to the first expression', await slot.locator('[data-word-current]').textContent() === 'Valor em cada entrega.');
  await group.scrollIntoViewIfNeeded();
  await page.locator('.process-cta .button').focus();
  await page.mouse.move(1439, 0);
  await page.waitForTimeout(650);
  check('MVP is integrated into Business blueprint and not a separate stage', await steps.count() === 3 && await steps.nth(1).locator('h3').textContent() === 'Business blueprint' && (await steps.nth(1).locator('.process-detail').textContent()).includes('(MVP)'));
  check('the accordion and consultation box share the exact content edges', await group.evaluate(element => {
    const row = element.getBoundingClientRect(), cta = document.querySelector('.process-cta').getBoundingClientRect();
    return Math.abs(row.left - cta.left) < .1 && Math.abs(row.right - cta.right) < .1 && Math.abs(row.width - 1280) < .1;
  }));
  check('collapsed stages show a thumbnail and summary, hiding the detailed copy', await steps.evaluateAll(cards => cards.filter(card => !card.classList.contains('is-active')).every(card => {
    const image = card.querySelector('.process-card-image').getBoundingClientRect(), summary = card.querySelector('.process-summary');
    return image.height > 100 && image.height < 180 && image.bottom < summary.getBoundingClientRect().top && getComputedStyle(summary).display !== 'none' && card.querySelector('.process-detail').hidden;
  })));
  for (let index = 0; index < 3; index++) {
    const stage = steps.nth(index);
    const initialHeight = await group.evaluate(element => element.getBoundingClientRect().height);
    // Sample the expansion in-page, so intermediate heights cannot be missed.
    await group.evaluate(element => {
      window.processHeights = [];
      const end = performance.now() + 650;
      const sample = () => { window.processHeights.push(element.getBoundingClientRect().height); if (performance.now() < end) requestAnimationFrame(sample); };
      requestAnimationFrame(sample);
    });
    await stage.hover();
    await page.waitForTimeout(750);
    check(`stage ${index + 1} expands without making the row jump in height`, await group.evaluate((element, height) => Math.abs(element.getBoundingClientRect().height - height) < .1 && window.processHeights.every(value => Math.abs(value - height) < .1), initialHeight));
    check(`stage ${index + 1} reveals its full copy and an image filling the frame`, await stage.evaluate(card => {
      const image = card.querySelector('.process-card-image'), picture = image.querySelector('img'), frame = image.getBoundingClientRect(), photo = picture.getBoundingClientRect(), box = card.getBoundingClientRect(), text = card.querySelector('.process-text').getBoundingClientRect();
      return card.classList.contains('is-active') && card.querySelector('[data-process-toggle]').getAttribute('aria-expanded') === 'true' && !card.querySelector('.process-detail').hidden && frame.height > 350 && getComputedStyle(picture).objectFit === 'cover' && Math.abs(frame.width - photo.width) < .1 && Math.abs(frame.height - photo.height) < .1 && text.bottom <= box.bottom - 20 && text.right < frame.left;
    }));
  }
  await page.mouse.move(1439, 0);
  await steps.nth(1).locator('[data-process-toggle]').focus();
  await page.keyboard.press('Enter');
  check('a native keyboard control expands Business blueprint with accessible state', await steps.nth(1).locator('[data-process-toggle]').getAttribute('aria-expanded') === 'true' && await group.locator('.process-detail:not([hidden])').count() === 1);
  // Hide fixed chrome only in exported section previews.
  await page.addStyleTag({ content: '.site-header,.skip-link{visibility:hidden!important}' });
  await page.locator('[data-motion-toggle]').click();
  check('manual pause stops the new rotator and hover animation', await slot.evaluate(element => element.getAnimations({ subtree: true }).length === 0) && await cards.first().evaluate(element => getComputedStyle(element).transitionDuration === '0s'));
  check('paused image stacks retain three visible positions', await cards.first().locator('.solution-image').evaluateAll(frames => new Set(frames.map(frame => new DOMMatrixReadOnly(getComputedStyle(frame).transform).m41)).size === 3));
  await page.locator('.process-section').screenshot({ path: path.join(output, 'process-and-solutions-desktop.png'), animations: 'disabled' });
  for (const width of [1280, 1100, 992, 860, 640, 430, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    for (let index = 0; index < 3; index++) {
      await steps.nth(index).locator('[data-process-toggle]').focus();
      await page.waitForTimeout(50);
      check(`${width}px stage ${index + 1} keeps its expanded text, images and phrase inside`, await steps.nth(index).evaluate(card => {
        const box = card.getBoundingClientRect(), text = card.querySelector('.process-text').getBoundingClientRect(), photo = card.querySelector('.process-card-image').getBoundingClientRect(), slot = document.querySelector('.process-rotator').getBoundingClientRect();
        return document.documentElement.scrollWidth <= innerWidth && text.left >= box.left && text.right <= box.right && text.bottom <= box.bottom && photo.left >= box.left && photo.right <= box.right && slot.left >= 0 && slot.right <= innerWidth;
      }));
    }
  }
  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  const mobile = await touch.newPage();
  mobile.on('pageerror', error => errors.push(error.message));
  await ready(mobile);
  const mobileControls = mobile.locator('[data-process-toggle]');
  await mobileControls.nth(1).tap();
  check('touch opens the Blueprint description including MVP', await mobileControls.nth(1).getAttribute('aria-expanded') === 'true' && await mobile.locator('#process-detail-1').isVisible());
  await mobileControls.nth(2).tap();
  check('touch opens delivery and collapses the previous details', await mobileControls.nth(2).getAttribute('aria-expanded') === 'true' && !await mobile.locator('#process-detail-1').isVisible());
  await mobile.addStyleTag({ content: '.site-header,.skip-link{visibility:hidden!important}' });
  await mobile.locator('.process-section').screenshot({ path: path.join(output, 'process-and-solutions-mobile.png'), animations: 'disabled' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await cards.first().hover();
  check('reduced motion keeps solutions readable and stops fans and text swaps', await cards.first().evaluate(element => getComputedStyle(element).transitionDuration === '0s') && await slot.evaluate(element => element.getAnimations({ subtree: true }).length === 0));
  const plain = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await plain.goto(base, { waitUntil: 'networkidle' });
  check('without JavaScript all three detailed stages remain readable', await plain.locator('.process-detail').evaluateAll(elements => elements.length === 3 && elements.every(element => getComputedStyle(element).display === 'block')));
  check('without JavaScript the new section fits a small phone', await plain.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  check('the shared section also appears on the About page', (await context.request.get(`${base}/sobre/`)).status() === 200 && (await (await context.request.get(`${base}/sobre/`)).text()).includes('Nossa solução'));
  check('new section interactions produce no JavaScript errors', errors.length === 0);
  await writeFile(path.join(output, 'process-results.json'), JSON.stringify({ checks, errors }, null, 2));
  console.log(`${checks.length} process checks passed.`);
} catch (error) {
  await page.screenshot({ path: path.join(output, 'process-failure.png'), fullPage: true });
  throw error;
} finally { await browser.close(); }
