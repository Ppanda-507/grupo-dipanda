import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { pages } from '../src/pages.mjs';

const browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:4173';
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, isMobile: width === 390, hasTouch: width === 390, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of Object.keys(pages)) {
      await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
      const result = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        toggle: !!document.querySelector('.footer-brand [data-motion-toggle]'),
        sizes: [...document.querySelectorAll('.inner-description p,.detail-card>p,.detail-card .check-list li,.solution-description,.workflow-description,.problem-detail-section p,.demo-empty p,.legal-content p,.service-overview p,.service-audience p,.service-scope p,.service-pricing p,.service-related-card p,.service-summary-copy p')].map(e => getComputedStyle(e).fontSize)
      }));
      assert.equal(result.overflow, false, `${width} ${route}: horizontal overflow`);
      assert.equal(result.toggle, false, `${route}: footer motion toggle`);
      assert(result.sizes.every(size => size === (width === 390 ? '16px' : '18px')), `${width} ${route}: ${result.sizes}`);
      if (route.startsWith('/servicos/')) {
        assert.equal(await page.locator('.service-overview-rows article').count(), 3);
        assert.equal(await page.locator('.service-related-card').count(), 3);
        const first = page.locator('.service-scope-grid details').first();
        await first.locator('summary').click();
        assert.equal(await first.getAttribute('open'), '');
        assert.equal(await page.locator('.service-scope-grid').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length), width === 390 ? 1 : 2);
        const photo = page.locator(route.endsWith('/desenvolvimento-web') ? '.service-hero-cutout img' : '.service-hero-backdrop img');
        assert.equal(await photo.count(),1,`${route}: photo banner`);
        await photo.evaluate(image=>image.decode());
      }
      if (route.startsWith('/problemas/')) {
        assert.equal(await page.locator('.problem-detail-benefit .problem-detail-marker').count(), 0, `${route}: benefit icons removed`);
        assert.equal(await page.locator('[data-flow-preview]').count(), route.includes('informacao-dispersa') ? 1 : 0, `${route}: flow only on integration page`);
        if (/relatorios-manuais|numeros-duvidosos/.test(route)) {
          assert.equal(await page.locator('.problem-detail-reading--grid details').count(), 4);
          const grid = await page.locator('.problem-detail-reading--grid').evaluate(e => {
            const cards = [...e.children].map(c => c.getBoundingClientRect());
            return { columns: getComputedStyle(e).gridTemplateColumns.split(' ').length, sameTop: Math.abs(cards[0].top-cards[1].top)<1 };
          });
          assert.equal(grid.columns, width === 390 ? 1 : 2);
          if (width > 1100) {
            assert.equal(grid.sameTop, true);
            assert(await page.locator('.problem-detail-process-grid h2').evaluate(e => e.getBoundingClientRect().height <= parseFloat(getComputedStyle(e).lineHeight)+1), `${route}: single-line desktop heading`);
          }
        }
      }
    }
    await page.goto(origin + '/servicos/solucoes-analytics/', { waitUntil: 'domcontentloaded' });
    const navTrips=[];
    const record=frame=>{if(frame===page.mainFrame())navTrips.push(new URL(frame.url()).pathname)};
    page.on('framenavigated',record);
    const nav=width===390 ? '.mobile-navigation' : '.desktop-nav';
    if(width===390) await page.locator('[data-menu-toggle]').click();
    await page.locator(`${nav} [data-nav-target="problema"]`).click();
    await page.waitForURL('**/problemas/informacao-dispersa/');
    assert.ok(!navTrips.includes('/'),'inner menu must not detour through home');
    page.off('framenavigated',record);
    await page.waitForLoadState('domcontentloaded');
    assert.equal(await page.locator('.desktop-nav [data-nav-target="problema"]').getAttribute('aria-current'),'page');
    assert.equal(await page.locator('.problem-detail-scope').count(), 0);
    assert.equal(await page.locator('.problem-related-preview').count(), 3);
    const band = await page.locator('#como-ajudamos').evaluate(e => ({ bg: getComputedStyle(e).backgroundColor, color: getComputedStyle(e.querySelector('h2')).color }));
    assert.equal(band.bg, 'rgb(17, 23, 21)');
    assert.equal(band.color, 'rgb(255, 255, 255)');
    const flow = page.locator('[data-flow-toggle]');
    await flow.click();
    assert.equal(await flow.getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('[data-flow-image]').getAttribute('src'), /\.gif$/);
    await flow.click();
    assert.match(await page.locator('[data-flow-image]').getAttribute('src'), /static\.png$/);
    for (const selector of ['.problem-detail-hero .button--motion', '.mobile-navigation .button--motion']) {
      if (selector.includes('mobile-navigation')) await page.locator('[data-menu-dialog]').evaluate(dialog => dialog.showModal());
      const target = page.locator(selector).first();
      await target.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 1, clientY: 1, bubbles: true });
      assert.match(await target.getAttribute('class'), /is-touch-pressed/);
      await target.dispatchEvent('pointercancel', { pointerType: 'touch', bubbles: true });
      assert.doesNotMatch(await target.getAttribute('class'), /is-touch-pressed/);
      if (selector.includes('mobile-navigation')) await page.locator('[data-menu-dialog]').evaluate(dialog => dialog.close());
    }
    await page.locator('.desktop-nav .flow-button').dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 1, clientY: 1, bubbles: true });
    assert.match(await page.locator('.desktop-nav .flow-button').getAttribute('class'), /is-touch-pressed/);
    await page.locator('.desktop-nav .flow-button').dispatchEvent('pointercancel', { pointerType: 'touch', bubbles: true });
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${width}px: ${Object.keys(pages).length} pages, typography, overflow, previews, flow playback and touch feedback`);
  }
} finally { await browser.close(); }
