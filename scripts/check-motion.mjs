import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright-core');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : { channel: 'msedge' }) });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
const page = await context.newPage();
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
const output = process.env.TEST_OUTPUT || path.join(os.tmpdir(), 'dipanda-browser-checks');
await mkdir(output, { recursive: true });
const checks = [];
function check(label, condition) { assert.ok(condition, label); checks.push(label); console.log('PASS', label); }
const about = page.locator('.about-statement[data-whisper]');
try {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('[data-cookie-banner] [data-cookie-reject]').click();
  const reveal = page.locator('.problems-section .section-heading');
  check('word reveals wait until the section enters the viewport', await reveal.locator('[data-whisper-word]').first().evaluate(element => getComputedStyle(element).opacity === '0'));
  // Observe the first playing frame in the browser. Separate round trips can
  // outlast the entrance on a busy machine and sample a later, valid state.
  const entrancePromise = page.waitForFunction(() => {
    const element = document.querySelector('.about-statement[data-whisper]');
    if (element.dataset.whisperState !== 'playing') return false;
    const words = [...element.querySelectorAll('[data-whisper-word]')];
    const end = (words.length - 1) * 100 + 500;
    return {
      words: words.every((word, index) => {
        const effect = word.getAnimations()[0]?.effect;
        return effect?.getTiming().duration === 500 && effect.getTiming().delay === index * 100 && effect.getKeyframes()[0].transform === 'translateX(-20px)';
      }),
      icons: [...element.querySelectorAll('[data-whisper-icon]')].every((icon, index) => icon.getAnimations()[0]?.effect.getTiming().delay === end + index * 120 && getComputedStyle(icon).opacity === '0'),
      rotation: element.querySelector('[data-word-current]').textContent === 'personalizadas' && element.querySelector('[data-word-current]').getAnimations().length === 0
    };
  });
  await page.locator('.about-section').scrollIntoViewIfNeeded();
  const entrance = await (await entrancePromise).jsonValue();
  check('WhisperText reveals words at 100ms intervals over 500ms from the left', entrance.words);
  check('icons wait until the entire phrase has appeared', entrance.icons);
  check('rotating word waits for the phrase and icons', entrance.rotation);
  await page.waitForFunction(() => document.querySelector('.about-statement[data-whisper]').dataset.whisperState === 'complete');
  check('the phrase and both icons finish fully visible', await about.evaluate(element => [...element.querySelectorAll('[data-whisper-word],[data-whisper-icon]')].every(item => getComputedStyle(item).opacity === '1')));
  const initialWordWidth = await about.locator('.word-rotator').evaluate(element => element.getBoundingClientRect().width);
  await page.waitForFunction(() => document.querySelector('[data-word-next]').textContent === 'escaláveis');
  check('AnimatedHero uses a sampled stiffness-50 spring for the upward swap', await about.locator('[data-word-next]').evaluate(element => {
    const effect = element.getAnimations()[0]?.effect, keys = effect?.getKeyframes();
    return effect?.getTiming().duration === 1600 && keys.length === 97 && keys[0].transform === 'translateY(150px)' && keys.at(-1).transform === 'translateY(0px)' && keys.some(key => new DOMMatrixReadOnly(key.transform).m42 < 0);
  }));
  await page.waitForFunction(() => document.querySelector('[data-word-current]').textContent !== 'personalizadas');
  check('rotating word actually changes', ['escaláveis', 'confiáveis', 'inteligentes', 'flexíveis'].includes(await about.locator('[data-word-current]').textContent()));
  check('rotating slot fits the current word and stays close to the icon', await about.locator('.word-rotator').evaluate((element, width) => {
    const box = element.getBoundingClientRect(), current = element.querySelector('[data-word-current]');
    const range = document.createRange(); range.selectNodeContents(current);
    const text = range.getBoundingClientRect(), icon = element.closest('.about-line').querySelector('[data-whisper-icon]').getBoundingClientRect();
    return box.width < width && Math.abs(box.width - text.width) < 1 && text.left - icon.right >= 0 && text.left - icon.right < 24;
  }, initialWordWidth));
  check('about cards have equal reference proportions and keep all text inside', await page.locator('.about-grid>*').evaluateAll(cards => {
    const boxes = cards.map(card => card.getBoundingClientRect());
    return cards.length === 3 && boxes.every(box => Math.abs(box.width - boxes[0].width) < 1 && Math.abs(box.height - boxes[0].height) < 1 && box.height >= 307) && cards.every(card => !card.querySelector('p') || card.querySelector('p').getBoundingClientRect().bottom <= card.getBoundingClientRect().bottom - 18);
  }));
  await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
  await page.locator('.about-section').scrollIntoViewIfNeeded();
  check('word reveal runs once and does not hide again on return', await about.evaluate(element => element.dataset.whisperState === 'complete' && element.querySelector('[data-whisper-word]').getAnimations().length === 0));
  const before = await page.locator('.marquee-track').evaluateAll(tracks => tracks.slice(0, 2).map(track => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41));
  await page.waitForTimeout(300);
  const after = await page.locator('.marquee-track').evaluateAll(tracks => tracks.slice(0, 2).map(track => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41));
  check('marquee rows travel in opposite directions', after[0] < before[0] && after[1] > before[1]);
  await reveal.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.problems-section [data-whisper]').dataset.whisperState === 'complete');
  check('other section titles also become fully readable word by word', await reveal.locator('[data-whisper-word]').evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === '1')));
  const problemOptions = page.locator('[data-problem-tabs] button');
  await problemOptions.nth(1).hover();
  await page.waitForTimeout(750);
  check('hover uses orange text and a menu-like background without changing the selected panel', await problemOptions.nth(1).evaluate(button => getComputedStyle(button).color === 'rgb(232, 90, 32)' && getComputedStyle(button).backgroundColor !== 'rgba(0, 0, 0, 0)' && button.getAttribute('aria-selected') === 'false') && await problemOptions.first().getAttribute('aria-selected') === 'true' && await page.locator('.problem-panel:not([hidden])').count() === 1);
  check('Nossa solução replaces the iceberg with three service cards', await page.locator('.process-art').count() === 0 && await page.locator('.solution-card').count() === 3);
  const process = page.locator('[data-process-cards]');
  await page.mouse.move(1279, 0);
  await process.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const steps = process.locator('[data-process-card]');
  const widthsBefore = await steps.evaluateAll(cards => cards.map(card => card.getBoundingClientRect().width));
  check('three stages remain available and the open stage takes half the usable strip', await steps.count() === 3 && Math.abs(widthsBefore[0] - widthsBefore.slice(1).reduce((sum, width) => sum + width, 0)) < 1);
  await steps.nth(1).hover();
  await page.waitForTimeout(700);
  check('hover expands the chosen stage and reveals its image', await steps.nth(1).evaluate(card => card.classList.contains('is-active') && getComputedStyle(card.querySelector('.process-card-image')).opacity === '1') && await steps.evaluateAll(cards => cards[1].getBoundingClientRect().width > cards[0].getBoundingClientRect().width * 1.8));
  await page.mouse.move(1279, 0);
  await steps.nth(2).locator('[data-process-toggle]').focus();
  await page.waitForTimeout(700);
  check('keyboard focus can expand a different process stage', await steps.nth(2).evaluate(card => card.classList.contains('is-active') && getComputedStyle(card.querySelector('.process-card-image')).opacity === '1') && await process.locator('.is-active').count() === 1);
  await page.locator('.process-cta .button').focus();
  await page.waitForTimeout(950);
  check('leaving the stages restores the first card', await steps.first().evaluate(card => card.classList.contains('is-active')));
  const consulting = page.locator('.process-cta .button');
  await consulting.hover();
  await page.waitForTimeout(950);
  check('the new process CTA retains the consulting inset fill and visible rim', await consulting.evaluate(button => {
    const inner = button.querySelector('.button-inner'), outerBox = button.getBoundingClientRect(), innerBox = inner.getBoundingClientRect();
    return button.getAttribute('href') === '/#contacto' && getComputedStyle(inner, '::before').backgroundColor === 'rgb(0, 0, 0)' && getComputedStyle(inner, '::before').clipPath === 'inset(0px round 999px)' && [innerBox.left - outerBox.left, innerBox.top - outerBox.top, outerBox.right - innerBox.right, outerBox.bottom - innerBox.bottom].every(edge => Math.abs(edge - 4) < .1);
  }));
  await process.screenshot({ path: path.join(output, 'process-cards-desktop.png') });
  const pricing = page.locator('[data-pricing-group]');
  check('service cards wait below the viewport', await pricing.locator('[data-pricing-pending]').count() === 6);
  await pricing.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('[data-pricing-card]')].every(card => !card.hasAttribute('data-pricing-pending') && getComputedStyle(card).opacity === '1' && card.getAnimations().length === 0));
  check('service cards reveal on scroll and keep Consultoria BI in the primary position', await pricing.locator('.service-card.is-featured').count() === 1 && await pricing.locator('.service-card').first().locator('h3').textContent() === 'Consultoria BI' && await pricing.locator('.is-featured').evaluate(card => getComputedStyle(card).backgroundColor === 'rgb(214, 253, 112)'));
  check('pricing titles and benefits use the requested compact hierarchy', await pricing.locator('.service-card').first().evaluate(card => getComputedStyle(card.querySelector('h3')).fontSize === '20px' && getComputedStyle(card.querySelector('.service-benefits li')).fontSize === '14px'));
  const serviceAction = pricing.locator('.service-card').first().locator('.button');
  await serviceAction.hover();
  await page.waitForTimeout(950);
  check('dark pill actions reuse the inset fill with the inverted green colour', await serviceAction.evaluate(button => getComputedStyle(button.querySelector('.button-inner'), '::before').backgroundColor === 'rgb(214, 253, 112)' && getComputedStyle(button.querySelector('.button-inner'), '::before').clipPath === 'inset(0px round 999px)' && getComputedStyle(button).color === 'rgb(19, 19, 19)'));
  await pricing.locator('details').first().locator('summary').click();
  check('service details retain the full description and audience and can be closed', await pricing.locator('details').first().evaluate(details => details.open && details.querySelectorAll('.service-copy p').length >= 2 && details.querySelector('.service-copy h4').textContent === 'Para quem é indicado?'));
  await pricing.locator('details').first().locator('summary').click();
  check('service details close without leaving the page', !await pricing.locator('details').first().evaluate(details => details.open));
  await page.mouse.move(1279, 0);
  await pricing.screenshot({ path: path.join(output, 'services-desktop-updated.png') });
  const demoAction = page.locator('.demo-card').first().locator('.pill-link');
  await demoAction.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  const demoCard = page.locator('.demo-card--showcase').first();
  await demoCard.hover();
  await page.waitForTimeout(700);
  check('new demo cards scale gently and animate their corner preview', await demoCard.evaluate(card => {
    const preview = new DOMMatrixReadOnly(getComputedStyle(card.querySelector('.demo-image')).transform);
    return Math.abs(new DOMMatrixReadOnly(getComputedStyle(card).transform).m11 - 1.02) < .001 && Math.abs(Math.hypot(preview.m11, preview.m12) - 1.1) < .001 && Math.abs(preview.m41 - 10) < .1 && getComputedStyle(card.querySelector('.demo-image')).opacity === '1';
  }));
  await demoAction.hover();
  await page.waitForTimeout(950);
  check('demo pills outside the hero also fill black gently', await demoAction.evaluate(button => getComputedStyle(button).backgroundColor === 'rgb(0, 0, 0)' && getComputedStyle(button).color === 'rgb(255, 255, 255)' && Math.abs(new DOMMatrixReadOnly(getComputedStyle(button).transform).m11 - 1.025) < .001));
  await page.locator('[data-motion-toggle]').click();
  check('manual pause stops continuous animation', await page.locator('.marquee-track').first().evaluate(element => getComputedStyle(element).animationPlayState === 'paused') && await page.locator('.process-rotator').evaluate(element => element.getAnimations({ subtree: true }).length === 0));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
  await page.waitForFunction(() => [...document.images].every(image => image.complete));
  await page.screenshot({ path: path.join(output, 'mobile-first-screen.png'), fullPage: false });
  check('hero copy and calls to action fit a phone', await page.locator('.hero-copy').evaluate(element => { const r = element.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= document.querySelector('.hero-surface').getBoundingClientRect().bottom; }));
  await page.locator('.about-section').scrollIntoViewIfNeeded();
  await page.locator('.about-section').screenshot({ path: path.join(output, 'about-mobile.png'), animations: 'disabled' });
  check('rotating sentence fits a phone', await page.locator('.about-statement').evaluate(element => element.scrollWidth <= element.clientWidth));
  check('phone demo copy stays above the corner images and all actions remain inside', await page.locator('.demo-card--showcase').evaluateAll(cards => cards.length === 3 && cards.every(card => {
    const box = card.getBoundingClientRect(), text = card.querySelector('.demo-content p').getBoundingClientRect(), image = card.querySelector('.demo-image').getBoundingClientRect(), link = card.querySelector('.pill-link').getBoundingClientRect();
    return box.left >= 0 && box.right <= innerWidth && text.bottom < image.top && link.left >= box.left && link.right <= box.right && link.bottom <= box.bottom;
  })));
  await process.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  check('phone layout exposes every process image without relying on hover', await steps.evaluateAll(cards => cards.length === 3 && cards.every(card => getComputedStyle(card.querySelector('.process-card-image')).opacity === '1' && card.getBoundingClientRect().right <= innerWidth)));
  await process.screenshot({ path: path.join(output, 'process-cards-mobile.png'), animations: 'disabled' });
  await pricing.locator('.service-card').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  check('phone pricing fits one card and retains its featured hierarchy', await pricing.locator('.service-card').first().evaluate(card => { const box = card.getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth && getComputedStyle(card).opacity === '1' && getComputedStyle(card.querySelector('h3')).fontSize === '20px'; }));
  await page.screenshot({ path: path.join(output, 'services-mobile-updated.png') });
  await pricing.locator('.service-card').nth(5).scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelectorAll('[data-pricing-card]')[5].hasAttribute('data-pricing-pending') && getComputedStyle(document.querySelectorAll('[data-pricing-card]')[5]).opacity === '1');
  check('later service cards reveal when reached in the mobile carousel', await pricing.locator('.service-card').nth(5).evaluate(card => card.getBoundingClientRect().right <= innerWidth && getComputedStyle(card).opacity === '1'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base, { waitUntil: 'networkidle' });
  check('reduced motion reveals the full about sentence immediately', await about.evaluate(element => element.dataset.whisperState === 'complete' && [...element.querySelectorAll('[data-whisper-word],[data-whisper-icon]')].every(item => getComputedStyle(item).opacity === '1')));
  check('reduced motion also leaves pricing and other headings readable', await page.locator('[data-pricing-card],[data-whisper-word]').evaluateAll(elements => elements.every(element => getComputedStyle(element).opacity === '1')));
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'motion-results.json'), JSON.stringify(checks, null, 2));
  console.log(`${checks.length} motion checks passed.`);
} finally { await browser.close(); }
