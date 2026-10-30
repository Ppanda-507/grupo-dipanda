import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import { pages } from '../src/pages.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) throw new Error('This test only targets a local server.');
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const results = [], errors = [], csp = [], external = new Set();
const check = (name, passed) => { results.push({ name, passed }); if (!passed) throw new Error(name); };
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (/violates.*content security|refused.*content security/i.test(message.text())) csp.push(message.text()); });
  page.on('request', request => { if (!request.url().startsWith(base) && !request.url().startsWith('data:')) external.add(new URL(request.url()).origin); });
  for (const route of Object.keys(pages).filter(route => route !== '/404')) {
    const response = await page.goto(base + (route === '/' ? '/' : route + '/'), { waitUntil: 'networkidle' });
    check(route + ': HTTP 200 and single h1', response.status() === 200 && await page.locator('h1').count() === 1);
    check(route + ': CSP and anti-framing', response.headers()['content-security-policy']?.includes("script-src 'self'") && response.headers()['x-frame-options'] === 'DENY');
    check(route + ': no mobile overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.goto(base, { waitUntil: 'networkidle' });
  check('no cookies before choice', (await context.cookies()).length === 0);
  await page.locator('[data-cookie-banner] [data-cookie-reject]').click();
  check('reject saves only essential choice', (await context.cookies()).every(cookie => cookie.name === 'dipanda_consent') && (await context.cookies()).length === 1);
  await page.locator('[data-cookie-settings]').first().click();
  await page.locator('[data-cookie-dialog] [name="functional"]').check();
  await page.locator('[data-cookie-save]').click();
  check('functional cookie created only after explicit consent', (await context.cookies()).some(cookie => cookie.name === 'dipanda_preferences'));
  await page.locator('[data-cookie-settings]').first().click();
  await page.locator('[data-cookie-dialog] [name="functional"]').uncheck();
  await page.locator('[data-cookie-save]').click();
  check('withdrawal removes optional cookie', !(await context.cookies()).some(cookie => cookie.name === 'dipanda_preferences'));
  check('no third-party tracking requests in tested navigation', external.size === 0);
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/demos/', '/servicos/desenvolvimento-web/']) {
      await page.goto(base + route, { waitUntil: 'networkidle' });
      check(route + ': fits ' + width, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
  }
  // HTTPS mirror: all responses come from the same local server, never an external host.
  const secure = await browser.newContext({ reducedMotion: 'reduce' });
  await secure.route('https://dipanda-audit.invalid/**', async route => {
    const url = new URL(route.request().url());
    const response = await context.request.get(base + url.pathname + url.search);
    await route.fulfill({ status: response.status(), headers: response.headers(), body: await response.body() });
  });
  const securePage = await secure.newPage();
  await securePage.goto('https://dipanda-audit.invalid/', { waitUntil: 'networkidle' });
  await securePage.locator('[data-cookie-banner] [data-cookie-accept]').click();
  const cookies = await secure.cookies();
  check('HTTPS cookies use Secure and SameSite=Lax', cookies.length === 2 && cookies.every(cookie => cookie.secure && cookie.sameSite === 'Lax'));
  check('no JavaScript exceptions', errors.length === 0);
  check('CSP does not break existing navigation and scripts', csp.length === 0);
  await fs.writeFile(process.env.DIPANDA_SECURITY_REPORT || 'reports/production-2026-10-29/browser-checks.json', JSON.stringify({ runtime: process.version, results, errors, csp, external: [...external], note: 'Mobile emulado. HTTPS mirror testa cookies, não certificados/TLS reais.' }, null, 2));
  console.log(`${results.length} browser checks passed.`);
} finally { await browser.close(); }
