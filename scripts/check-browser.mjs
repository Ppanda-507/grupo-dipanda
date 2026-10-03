import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { pages } from '../src/pages.mjs';

const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright-core');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
const output = process.env.TEST_OUTPUT || path.join(os.tmpdir(), 'dipanda-browser-checks');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : { channel: 'msedge' }) });
const errors = [], failedResources = [], checks = [];
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400 && !response.url().includes('/api/') && !response.url().endsWith('/404/')) failedResources.push({ url: response.url(), status: response.status() }); });
const check = (label, condition) => { assert.ok(condition, label); checks.push(label); console.log('PASS', label); };
async function imagesReady() {
  await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
  await page.waitForFunction(() => [...document.images].every(image => image.complete));
}
try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  check('first visit asks for consent', await page.locator('[data-cookie-banner]').isVisible());
  check('no cookies before a choice', (await context.cookies()).length === 0);
  await page.locator('[data-cookie-banner] [data-cookie-reject]').click();
  let cookies = await context.cookies();
  check('rejecting optional cookies stores only the essential decision', cookies.length === 1 && cookies[0].name === 'dipanda_consent' && !JSON.parse(decodeURIComponent(cookies[0].value)).functional);
  await page.reload({ waitUntil: 'networkidle' });
  check('choice persists after reload', !await page.locator('[data-cookie-banner]').isVisible());
  await page.locator('.footer-legal [data-cookie-settings]').click();
  check('settings open a modal', await page.locator('[data-cookie-dialog]').evaluate(element => element.open));
  await page.locator('[data-cookie-dialog] [name="functional"]').check();
  await page.locator('[data-cookie-save]').click();
  await page.locator('[data-motion-toggle]').click();
  cookies = await context.cookies();
  check('optional cookie records the actual motion preference', JSON.parse(decodeURIComponent(cookies.find(c => c.name === 'dipanda_preferences').value)).motionPaused === true);
  await page.reload({ waitUntil: 'networkidle' });
  check('accepted motion preference restores after reload', await page.locator('[data-motion-toggle]').getAttribute('aria-pressed') === 'true');
  await page.locator('.footer-legal [data-cookie-settings]').click();
  await page.locator('[data-cookie-dialog] [data-cookie-reject]').click();
  check('revoking consent removes the optional cookie', !(await context.cookies()).some(cookie => cookie.name === 'dipanda_preferences'));
  await page.locator('#tab-informacao-dispersa').focus();
  await page.keyboard.press('ArrowRight');
  check('problem tabs support keyboard navigation', await page.locator('#tab-relatorios-manuais').getAttribute('aria-selected') === 'true' && await page.locator('#panel-relatorios-manuais').isVisible());
  await page.locator('#tab-informacao-dispersa').click();
  const initialService = await page.locator('[data-service-carousel]').evaluate(element => element.scrollLeft);
  await page.locator('[data-carousel-next]').click();
  await page.waitForFunction(initial => document.querySelector('[data-service-carousel]').scrollLeft > initial + 100, initialService);
  check('services carousel reveals the additional services', await page.locator('[data-carousel-progress]').textContent() !== '01 — 06');
  for (const route of Object.keys(pages).filter(route => route !== '/404')) {
    const url = `${base}${route === '/' ? '/' : route + '/'}`;
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    await imagesReady();
    check(`page ${route} opens`, response.status() === 200 && await page.locator('h1').count() === 1);
    check(`page ${route} has no failed images`, await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
    const links = await page.locator('a[href^="/"]').evaluateAll(anchors => anchors.map(a => a.getAttribute('href')));
    check(`page ${route} links resolve`, links.every(href => Object.hasOwn(pages, href.split('#')[0].replace(/\/+$/, '') || '/')));
  }
  await page.goto(`${base}/demo/dre/`, { waitUntil: 'networkidle' });
  const quarter = await page.locator('.metric-value').first().textContent();
  await page.locator('[data-demo-period]').selectOption('month');
  check('demo period changes actual values', quarter !== await page.locator('.metric-value').first().textContent());
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-demo-download]').click();
  check('demo exports CSV', (await downloadPromise).suggestedFilename() === 'dipanda-dre-month.csv');
  await page.goto(`${base}/contacto/`, { waitUntil: 'networkidle' });
  await page.locator('[name="name"]').fill('Pessoa Teste');
  await page.locator('[name="email"]').fill('pessoa@example.com');
  await page.locator('[name="message"]').fill('Pedido de demonstração de teste, sem envio real.');
  await page.locator('[data-started-at]').evaluate(element => { element.value = Date.now() - 5000; });
  const unavailable = page.waitForResponse(response => response.url().endsWith('/api/contact'));
  await page.locator('[data-contact-form] button[type="submit"]').click();
  check('unconfigured form gives an honest error', (await unavailable).status() === 503);
  await page.locator('[data-contact-status][data-state="error"]').waitFor();
  check('failed form preserves the message', (await page.locator('[name="message"]').inputValue()).includes('sem envio real'));
  await page.route('**/api/contact', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Mensagem enviada — resposta simulada no teste.' }) }));
  await page.locator('[data-contact-form] button[type="submit"]').click();
  await page.locator('[data-contact-status][data-state="success"]').waitFor();
  check('form handles confirmed success and resets', await page.locator('[name="message"]').inputValue() === '');
  await page.unroute('**/api/contact');
  for (const width of [1280, 860, 430, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await imagesReady();
    check(`home has no horizontal overflow at ${width}px`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(output, `home-${width}.png`), fullPage: true });
    if (width === 1280) {
      for (const selector of ['.hero', '.about-section', '.problems-section', '.process-section', '.demos-section', '.services-section', '.contact-section']) await page.locator(selector).screenshot({ path: path.join(output, selector.slice(1) + '.png') });
    }
    if (width === 390) {
      await page.locator('[data-menu-toggle]').click();
      check('mobile menu opens', await page.locator('[data-menu-dialog]').evaluate(element => element.open));
      await page.keyboard.press('Escape');
      check('mobile menu closes with Escape and restores state', await page.locator('[data-menu-toggle]').getAttribute('aria-expanded') === 'false');
    }
  }
  for (const route of ['/problemas/informacao-dispersa/', '/servicos/pedido-personalizado/', '/demo/operacional/', '/politica-de-cookies/', '/contacto/']) {
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    check(`${route} fits mobile`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.goto(`${base}/demo/dre/`, { waitUntil: 'networkidle' });
  await imagesReady();
  await page.screenshot({ path: path.join(output, 'demo-mobile.png'), fullPage: true });
  await page.goto(base, { waitUntil: 'networkidle' });
  check('reduced motion stops the marquee and process text rotation', await page.locator('.marquee-track').first().evaluate(element => getComputedStyle(element).animationName === 'none') && await page.locator('.process-rotator').evaluate(element => element.getAnimations({ subtree: true }).length === 0));
  await context.clearCookies();
  await context.addCookies([{ name: 'dipanda_consent', value: encodeURIComponent(JSON.stringify({ version: 1, necessary: true, functional: true, updatedAt: 1, expiresAt: 2 })), url: base }, { name: 'dipanda_preferences', value: encodeURIComponent('{"motionPaused":true}'), url: base }]);
  await page.reload({ waitUntil: 'networkidle' });
  check('expired consent asks again and removes optional storage', await page.locator('[data-cookie-banner]').isVisible() && !(await context.cookies()).some(cookie => cookie.name === 'dipanda_preferences'));
  check('no JavaScript errors', errors.length === 0);
  check('all requested static resources exist', failedResources.length === 0);
  await writeFile(path.join(output, 'results.json'), JSON.stringify({ checks, errors, failedResources }, null, 2));
  console.log(`${checks.length} browser checks passed. Screenshots: ${output}`);
} catch (error) {
  await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true });
  console.error({ errors, failedResources });
  throw error;
} finally { await browser.close(); }
