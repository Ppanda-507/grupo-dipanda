import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright-core');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : { channel: 'msedge' }) });
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
const output = process.env.TEST_OUTPUT || path.join(os.tmpdir(), 'dipanda-browser-checks');
const checks = [];
function check(label, condition) { assert.ok(condition, label); checks.push(label); console.log('PASS', label); }
const scale = element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m11;
const mask = element => getComputedStyle(element.querySelector('.button-inner'), '::before').clipPath;
// Isolate foreground timing from GPU compilation and continuous mesh drawing.
// The real WebGL renderer and its lifecycle have their own integration suite.
function staticHeroBackground() {
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...options) {
    if (this.matches('[data-hero-shader]') && type.startsWith('webgl')) return null;
    return getContext.call(this, type, ...options);
  };
}
await mkdir(output, { recursive: true });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  context.setDefaultNavigationTimeout(60_000);
  await context.addInitScript(staticHeroBackground);
  const page = await context.newPage();
  // Observe actual entrance animations even when a slow browser has already
  // finished them by the time the first DevTools evaluation arrives.
  await page.addInitScript(() => {
    window.__heroEntrances = new WeakMap();
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (this.matches('[data-hero-text], [data-hero-buttons], [data-header]')) window.__heroEntrances.set(this, animation);
      return animation;
    };
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  check('hero uses the supplied gentle 32px fade-up sequence', await page.evaluate(() => {
    const text = window.__heroEntrances.get(document.querySelector('[data-hero-text]'));
    const copy = window.__heroEntrances.get(document.querySelector('.hero-copy p'));
    const buttons = window.__heroEntrances.get(document.querySelector('[data-hero-buttons]'));
    const header = window.__heroEntrances.get(document.querySelector('[data-header]'));
    return text?.effect.getTiming().duration === 1000 && copy?.effect.getTiming().delay === 100 && buttons?.effect.getTiming().delay === 200 && header?.effect.getTiming().duration === 700;
  }));
  await page.locator('[data-cookie-banner] [data-cookie-reject]').click();
  await page.waitForTimeout(1800);
  await page.evaluate(() => document.fonts.ready);
  check('three-card hero image has been removed', await page.locator('.hero-visual').count() === 0 && !await page.locator('img[src*="2-57-3e780"]').count());
  check('hero badge uses the new consulting and technology message', await page.locator('.hero-badge').textContent() === 'CONSULTORIA · TECNOLOGIA');
  check('consulting is the first hero action and demo remains the second', await page.locator('.hero-buttons>a').evaluateAll(actions => actions[0].getAttribute('href') === '/#contacto' && actions[1].getAttribute('href') === '/#demonstracao'));
  check('hero subtitle remains at the reference 16px size', await page.locator('.hero-copy p').evaluate(element => getComputedStyle(element).fontSize === '16px'));
  check('subtitle copy remains unchanged', await page.locator('.hero-copy p').textContent() === 'Cruze os dados da tua empresa e descubra exatamente onde está a perder tempo e dinheiro para maximizar os seus ganhos');
  check('hero occupies the full viewport like ResponsiveHeroBanner', await page.locator('.hero').evaluate(element => Math.abs(element.getBoundingClientRect().height - innerHeight) < 1));
  check('the matching mesh replaces the scene and compact tools remain inside the hero', await page.evaluate(() => {
    const surface = document.querySelector('.hero-surface');
    const hero = surface.getBoundingClientRect();
    const tools = document.querySelector('.hero-tools').getBoundingClientRect();
    const caption = document.querySelector('.hero-tools>p').getBoundingClientRect();
    return !surface.querySelector('.hero-scene, [data-hero-flow]') && !surface.querySelector('img[src^="/assets/hero/"]') && !!surface.querySelector('.hero-static-mesh image') && tools.bottom <= hero.bottom && caption.top > document.querySelector('.hero-buttons').getBoundingClientRect().bottom;
  }));
  const arrows = page.locator('.hero-direction-track');
  const arrowBefore = await arrows.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  await page.waitForTimeout(160);
  const arrowAfter = await arrows.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  check('decorative arrows travel left to right on a continuous linear loop', await arrows.evaluate(element => getComputedStyle(element).animationTimingFunction === 'linear' && getComputedStyle(element).animationPlayState === 'running') && (arrowAfter > arrowBefore || arrowBefore - arrowAfter > 60));
  check('initial menu uses the supplied compact pill geometry and stays centred', await page.locator('.desktop-nav').evaluate(element => {
    const r = element.getBoundingClientRect();
    return Math.abs((r.left + r.right) / 2 - innerWidth / 2) < .5 && r.width < 720 && r.height === 48 && getComputedStyle(element).borderRadius === '999px';
  }));
  await page.locator('.desktop-nav>a[href="/#sobre"]').hover();
  await page.waitForTimeout(750);
  check('transparent menu highlights hovered links with the reference green', await page.locator('.desktop-nav>a[href="/#sobre"]').evaluate(element => getComputedStyle(element).backgroundColor === 'rgb(214, 253, 112)' && getComputedStyle(element).color === 'rgb(19, 19, 19)'));
  const flow = page.locator('.desktop-nav .flow-button');
  await flow.hover();
  await page.waitForTimeout(950);
  check('contact button fills, swaps arrows and gains restrained depth', await flow.evaluate(element => {
    const incoming = element.querySelector('.flow-arrow--incoming'), outgoing = element.querySelector('.flow-arrow--outgoing');
    return getComputedStyle(element).color === 'rgb(255, 255, 255)' && getComputedStyle(element).borderRadius === '12px' && getComputedStyle(element).boxShadow !== 'none' && getComputedStyle(incoming).opacity === '1' && getComputedStyle(outgoing).opacity === '0' && getComputedStyle(element.querySelector('.flow-fill')).clipPath.startsWith('circle(75%');
  }));
  await page.mouse.move(1200, 100);
  await page.waitForTimeout(950);
  const demo = page.locator('.hero-buttons .pill-link');
  const consulting = page.locator('.hero-buttons .button');
  const restingBox = await consulting.boundingBox();
  const restingMask = await consulting.evaluate(mask);
  // Sample the real CSS transition at an exact point on its timeline, rather
  // than relying on DevTools round trips to finish inside an 800ms window.
  await consulting.evaluate(element => {
    element.addEventListener('pointerenter', () => {
      const inner = element.querySelector('.button-inner');
      getComputedStyle(inner, '::before').clipPath;
      const transition = inner.getAnimations({ subtree: true }).find(animation => animation.transitionProperty === 'clip-path');
      window.__consultingFill = transition;
      if (transition) { transition.pause(); transition.currentTime = 200; }
    }, { once: true });
  });
  await consulting.hover();
  const fillSamples = await consulting.evaluate(element => {
    const transition = window.__consultingFill;
    const inner = element.querySelector('.button-inner');
    const intermediate = getComputedStyle(inner, '::before').clipPath;
    transition?.finish();
    return { hasTransition: !!transition, intermediate, filled: getComputedStyle(inner, '::before').clipPath };
  });
  await page.waitForTimeout(750);
  const hoveredBox = await consulting.boundingBox();
  check('consulting hover leaves the entire outer button stationary', ['x', 'y', 'width', 'height'].every(key => Math.abs(restingBox[key] - hoveredBox[key]) < .1));
  check('black fill grows gradually within the inset surface', fillSamples.hasTransition && restingMask !== fillSamples.intermediate && fillSamples.intermediate !== fillSamples.filled && await consulting.evaluate(element => getComputedStyle(element.querySelector('.button-inner'), '::before').backgroundColor === 'rgb(0, 0, 0)'));
  check('a visible 4px green rim remains on all four sides', await consulting.evaluate(element => {
    const outer = element.getBoundingClientRect(), inner = element.querySelector('.button-inner').getBoundingClientRect();
    const edges = [inner.left - outer.left, inner.top - outer.top, outer.right - inner.right, outer.bottom - inner.bottom];
    return edges.every(edge => Math.abs(edge - 4) < .1) && getComputedStyle(element).backgroundColor === 'rgb(214, 253, 112)' && getComputedStyle(element).color === 'rgb(255, 255, 255)';
  }));
  await consulting.screenshot({ path: path.join(output, 'consulting-hover.png') });
  await page.mouse.move(1200, 100);
  await page.waitForTimeout(950);
  check('consulting fill returns smoothly to its arrow circle', await consulting.evaluate(mask) === restingMask);
  await demo.hover();
  await page.waitForTimeout(950);
  check('demo hover becomes black with only a subtle size change', await demo.evaluate(element => getComputedStyle(element).backgroundColor === 'rgb(0, 0, 0)' && Math.abs(new DOMMatrixReadOnly(getComputedStyle(element).transform).m11 - 1.025) < .001));
  check('buttons share FlowButton timing: 600ms surface and 800ms fill', await demo.evaluate(element => getComputedStyle(element).transitionDuration.includes('0.6s')) && await consulting.evaluate(element => getComputedStyle(element.querySelector('.button-inner'), '::before').transitionDuration === '0.8s'));
  await page.mouse.down();
  await page.waitForTimeout(180);
  check('demo press feedback stays subtle', await demo.evaluate(element => Math.abs(new DOMMatrixReadOnly(getComputedStyle(element).transform).m11 - .99) < .002));
  await page.mouse.move(1200, 100);
  await page.mouse.up();
  await page.waitForTimeout(950);
  check('demo returns to its original size after pointer leave', await demo.evaluate(element => Math.abs(new DOMMatrixReadOnly(getComputedStyle(element).transform).m11 - 1) < .001));

  await page.mouse.move(40, 300);
  await page.waitForTimeout(450);
  check('the original hero grid still repels the pointer', await page.locator('.hero-art').evaluate(element => element.hasAttribute('data-grid-active')));
  // The hero already fills the viewport. Capture it directly while the grid
  // and background move, without an element action's stability wait.
  await page.screenshot({ path: path.join(output, 'hero-grid-hover.png') });
  await page.mouse.move(1279, 899);
  await page.waitForFunction(() => !document.querySelector('.hero-art').hasAttribute('data-grid-active'), null, { timeout: 10_000 });
  check('grid returns when the pointer leaves', await page.locator('.hero-art').evaluate(element => !element.hasAttribute('data-grid-active')));

  const names = await page.locator('.integration-group').first().locator('.integration-tool>span:last-child').allTextContents();
  check('eleven real tool names remain in the marquee', ['Power BI', 'Python', 'Microsoft Fabric', 'Azure SQL', 'Microsoft Azure', 'Databricks', 'SQL Server', 'PostgreSQL', 'MySQL', 'Oracle', 'Microsoft'].every(name => names.includes(name)));
  check('carousel uses a shorter 420px capsule and overlapping 64px icons', await page.locator('.integration-strip').evaluate(element => {
    const circle = element.querySelector('.integration-tool'), style = getComputedStyle(circle);
    return element.getBoundingClientRect().width <= 420 && element.getBoundingClientRect().height === 74 && style.width === '64px' && style.marginRight === '-16px' && getComputedStyle(element).borderRadius === '999px';
  }));
  await page.locator('.integration-strip img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
  await page.waitForFunction(() => [...document.querySelectorAll('.integration-strip img')].every(image => image.complete && image.naturalWidth > 0));
  check('all eleven tools have working logos and no initials placeholders', await page.locator('.integration-group').first().locator('img').count() === 11 && await page.locator('.integration-icon--initials').count() === 0);
  const marquee = page.locator('.integration-track');
  await page.locator('.integration-strip').scrollIntoViewIfNeeded();
  await page.mouse.move(1279, 0);
  const xBefore = await marquee.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  await page.waitForTimeout(250);
  const xAfter = await marquee.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  check('tools keep travelling from right to left', xAfter < xBefore);
  await page.locator('.integration-strip').hover();
  const pausedX = await marquee.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  await page.waitForTimeout(250);
  const pausedLater = await marquee.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41);
  check('tools pause on hover as in the supplied component', Math.abs(pausedLater - pausedX) < .1);
  await page.mouse.move(1279, 0);
  await page.waitForTimeout(250);
  check('tools resume after pointer leave', await marquee.evaluate(element => getComputedStyle(element).animationPlayState === 'running'));
  await page.locator('.integration-strip').screenshot({ path: path.join(output, 'tools-marquee.png') });

  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
  await page.waitForTimeout(950);
  const header = page.locator('[data-header]');
  check('compact menu remains centred and translucent after scrolling', await header.evaluate(element => {
    const nav = element.querySelector('.desktop-nav'), box = nav.getBoundingClientRect();
    return element.hasAttribute('data-scrolled') && getComputedStyle(element).position === 'fixed' && getComputedStyle(nav).backdropFilter !== 'none' && Math.abs(element.getBoundingClientRect().top - 16) < .5 && Math.abs((box.left + box.right) / 2 - innerWidth / 2) < .5 && box.width < 720 && box.height === 48 && getComputedStyle(element).backgroundColor === 'rgba(0, 0, 0, 0)';
  }));
  await page.screenshot({ path: path.join(output, 'sticky-navigation.png') });
  for (const id of ['sobre', 'problema', 'processo', 'demonstracao', 'servicos', 'contacto']) {
    await page.evaluate(id => window.scrollTo({ top: document.getElementById(id).offsetTop - 100, behavior: 'instant' }), id);
    await page.waitForFunction(id => document.querySelector('.desktop-nav>a[aria-current]')?.getAttribute('href') === '/#' + id, id);
    check('menu follows the visible section: ' + id, await page.locator('.desktop-nav>a[aria-current]').count() === 1);
  }
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  check('navigation remains visible at the footer', await header.evaluate(element => { const r = element.getBoundingClientRect(); return r.top >= 0 && r.bottom < 120; }));
  check('tools pause outside the viewport', await marquee.evaluate(element => getComputedStyle(element).animationPlayState === 'paused'));
  check('decorative arrows pause outside the viewport', await arrows.evaluate(element => getComputedStyle(element).animationPlayState === 'paused'));
  await page.locator('[data-motion-toggle]').click();
  check('manual motion preference stops continuous tool motion', await marquee.evaluate(element => getComputedStyle(element).animationPlayState === 'paused'));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  check('manual motion preference keeps hero arrows still on return', await arrows.evaluate(element => getComputedStyle(element).animationPlayState === 'paused'));
  await demo.hover();
  await page.waitForTimeout(150);
  check('manual motion preference removes button scaling', await demo.evaluate(element => Math.abs(new DOMMatrixReadOnly(getComputedStyle(element).transform).m11 - 1) < .001));
  await page.locator('[data-motion-toggle]').click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.mouse.move(1279, 0);
  await page.waitForTimeout(950);
  check('menu returns to the original hero presentation at the top', await header.evaluate(element => !element.hasAttribute('data-scrolled')));
  check('decorative arrows resume after motion is enabled again', await arrows.evaluate(element => getComputedStyle(element).animationPlayState === 'running'));
  await page.screenshot({ path: path.join(output, 'hero-desktop-updated.png'), fullPage: false });
  await consulting.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);
  check('consulting keyboard activation still navigates to contact', await page.evaluate(() => location.hash === '#contacto'));
  check('anchor target is readable below the fixed menu', await page.locator('#contacto .section-heading').evaluate(element => element.getBoundingClientRect().top >= document.querySelector('[data-header]').getBoundingClientRect().bottom));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(base, { waitUntil: 'networkidle' });
  check('reduced motion keeps content readable and tools static', await page.evaluate(() => getComputedStyle(document.querySelector('.hero-copy h1')).opacity === '1' && getComputedStyle(document.querySelector('.integration-track')).animationPlayState === 'paused'));
  await page.mouse.move(40, 300);
  await page.waitForTimeout(150);
  check('reduced motion disables grid repulsion', await page.locator('.hero-art').evaluate(element => !element.hasAttribute('data-grid-active')));
  check('reduced motion removes the continuous hero arrow animation', await arrows.evaluate(element => getComputedStyle(element).animationName === 'none'));

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  await mobile.addInitScript(staticHeroBackground);
  const phone = await mobile.newPage();
  await phone.goto(base, { waitUntil: 'networkidle' });
  await phone.locator('[data-cookie-banner] [data-cookie-reject]').click();
  await phone.waitForTimeout(1700);
  check('mobile fits the hero and disables mouse-only effects', await phone.evaluate(() => {
    const hero = document.querySelector('.hero-copy').getBoundingClientRect();
    return !matchMedia('(hover: hover) and (pointer: fine)').matches && document.documentElement.scrollWidth <= innerWidth && hero.left >= 0 && hero.right <= innerWidth;
  }));
  check('phone hero also occupies the full viewport', await phone.locator('.hero').evaluate(element => Math.abs(element.getBoundingClientRect().height - innerHeight) < 1));
  await phone.screenshot({ path: path.join(output, 'hero-mobile-updated.png') });
  await phone.locator('.hero-buttons .pill-link').tap();
  await phone.waitForTimeout(1000);
  check('mobile demo button still navigates to demonstrations', await phone.evaluate(() => location.hash === '#demonstracao'));
  check('mobile fixed menu remains available after scrolling', await phone.locator('[data-header]').evaluate(element => element.hasAttribute('data-scrolled') && element.getBoundingClientRect().top >= 0 && element.getBoundingClientRect().bottom < 120));
  await phone.locator('[data-menu-toggle]').tap();
  check('mobile menu opens from its fixed position', await phone.locator('[data-menu-dialog]').evaluate(element => element.open));
  check('mobile menu keeps its logo readable after scrolling', await phone.locator('[data-menu-dialog] .brand').evaluate(element => getComputedStyle(element).color === 'rgb(255, 255, 255)' && getComputedStyle(element.querySelector('.brand-mark')).filter === 'brightness(0) invert(1)'));
  await phone.locator('[data-menu-close]').tap();
  await phone.setViewportSize({ width: 360, height: 800 });
  await phone.goto(base, { waitUntil: 'networkidle' });
  await phone.waitForTimeout(1700);
  check('small phones fit both complete buttons and their borders', await phone.locator('.hero-buttons>a').evaluateAll(elements => elements.every(element => { const r = element.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })));
  await phone.locator('#sobre').scrollIntoViewIfNeeded();
  await phone.waitForFunction(() => document.querySelector('[data-whisper]').dataset.whisperState === 'complete');
  check('rotating word remains within the phrase on small phones', await phone.locator('.about-statement .word-rotator').evaluate(element => { const r = element.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.right <= innerWidth && element.scrollWidth <= element.clientWidth; }));
  const plain = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await plain.goto(base, { waitUntil: 'networkidle' });
  check('about phrase and initial rotating word remain readable without JavaScript', await plain.locator('.about-statement [data-word-current]').evaluate(element => getComputedStyle(element).opacity === '1' && element.textContent === 'personalizadas' && element.getBoundingClientRect().width > 0));
  check('hero copy, both action links and matching mesh work without JavaScript', await plain.evaluate(() => !document.querySelector('.hero-scene, [data-hero-flow]') && !!document.querySelector('.hero-static-mesh image') && document.querySelector('.hero-buttons>a').getAttribute('href') === '/#contacto' && document.querySelector('.hero-copy h1').getBoundingClientRect().height > 0));
  await plain.close();
  check('no JavaScript errors in the new interactions', errors.length === 0);
  await writeFile(path.join(output, 'hero-results.json'), JSON.stringify(checks, null, 2));
  console.log(`${checks.length} hero checks passed.`);
} finally { await browser.close(); }
