import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import os from 'node:os';
import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright-core');
const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : { channel: 'msedge' }) });
const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
const output = path.join(os.tmpdir(), 'dipanda-browser-checks');
const checks = [], errors = [];
const check = (label, passed) => { assert.ok(passed, label); checks.push(label); console.log('PASS', label); };
const time = page => page.locator('[data-hero-shader]').evaluate(canvas => {
  const gl = canvas.getContext('webgl');
  return gl.getUniform(gl.getParameter(gl.CURRENT_PROGRAM), gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'u_scene'))[2];
});
async function visit(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout:60_000 });
  if (await page.locator('[data-cookie-banner]').isVisible()) await page.locator('[data-cookie-banner] [data-cookie-reject]').click();
  await page.evaluate(() => document.fonts.ready);
  return page;
}
await mkdir(output, { recursive: true });
try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const page = await visit(desktop);
  await page.waitForFunction(() => document.querySelector('[data-hero-shader]').dataset.shaderState === 'paused');
  check('WebGL compiles the supplied Mesh drift and draws below the content', await page.locator('[data-hero-shader]').evaluate(canvas => {
    const gl = canvas.getContext('webgl'), box = canvas.getBoundingClientRect(), parent = canvas.parentElement.getBoundingClientRect();
    return gl.getProgramParameter(gl.getParameter(gl.CURRENT_PROGRAM), gl.LINK_STATUS) && canvas.closest('.hero-surface').hasAttribute('data-shader-ready') && Math.abs(box.width - parent.width) < 1 && Math.abs(box.height - parent.height) < 1 && getComputedStyle(canvas).pointerEvents === 'none' && getComputedStyle(canvas).zIndex === '0' && gl.getError() === gl.NO_ERROR;
  }));
  check('the palette contains only the four requested brand blues', await page.locator('[data-hero-shader]').evaluate(canvas => {
    const gl = canvas.getContext('webgl'), program = gl.getParameter(gl.CURRENT_PROGRAM);
    const expected = [[6,43,92],[0,76,211],[107,165,239],[168,208,243]];
    return expected.every((color, i) => [...gl.getUniform(program, gl.getUniformLocation(program, `u_colors[${i}]`))].every((value, channel) => Math.abs(value * 255 - color[channel]) < .01));
  }));
  const first = await time(page);
  console.log('RENDERER', await page.locator('[data-hero-shader]').evaluate(canvas => { const gl=canvas.getContext('webgl'); const info=gl.getExtension('WEBGL_debug_renderer_info'); return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); }));
  await page.emulateMedia({ reducedMotion:'no-preference' });
  await page.waitForFunction(() => document.querySelector('[data-hero-shader]').dataset.shaderState === 'running');
  await page.waitForTimeout(500);
  await page.evaluate(async () => { const { setMotionPaused } = await import('/js/motion.js'); setMotionPaused(true); });
  const second = await time(page);
  check('the mesh advances between rendered frames', second > first);
  await page.waitForFunction(() => document.querySelector('[data-hero-shader]').dataset.shaderState === 'paused');
  const frozen = await time(page);
  await page.waitForTimeout(400);
  check('manual pause freezes the shader timeline while retaining its blue frame', await time(page) === frozen && await page.locator('.hero-surface').evaluate(hero => hero.hasAttribute('data-shader-ready')));
  await page.screenshot({ path: path.join(output, 'hero-shader-desktop.png') });
  await page.evaluate(async () => { const { setMotionPaused } = await import('/js/motion.js'); setMotionPaused(false); scrollTo({ top:document.getElementById('problema').offsetTop, behavior:'instant' }); });
  await page.waitForFunction(() => document.querySelector('[data-hero-shader]').dataset.shaderState === 'offscreen');
  const offscreen = await time(page);
  await page.waitForTimeout(400);
  check('offscreen hero stops drawing and accumulating animation time', await time(page) === offscreen);
  await page.evaluate(() => scrollTo({ top:0, behavior:'instant' }));
  await page.waitForFunction(() => document.querySelector('[data-hero-shader]').dataset.shaderState === 'running');
  const resumed = await time(page);
  check('returning to the hero resumes from its previous phase', resumed >= offscreen && resumed - offscreen < .4);
  await page.evaluate(() => { const canvas = document.querySelector('[data-hero-shader]'); window.__heroLossExtension = canvas.getContext('webgl').getExtension('WEBGL_lose_context'); window.__heroLossExtension.loseContext(); });
  await page.waitForFunction(() => document.querySelector('[data-hero-shader]').dataset.shaderState === 'lost');
  check('a lost context reveals the matching static mesh immediately', await page.locator('.hero-surface').evaluate(hero => !hero.hasAttribute('data-shader-ready') && !hero.querySelector('.hero-scene') && !!hero.querySelector('.hero-static-mesh image')));
  await page.evaluate(() => { window.__heroLossExtension.restoreContext(); delete window.__heroLossExtension; });
  await page.waitForFunction(() => document.querySelector('[data-hero-shader]').dataset.shaderState === 'running');
  check('a restored context rebuilds the shader without breaking the page', await page.locator('.hero-surface').evaluate(hero => hero.hasAttribute('data-shader-ready')));
  await desktop.close();
  for (const [width, height, dpr] of [[390,844,3], [320,700,2], [844,390,2]]) {
    const context = await browser.newContext({ viewport:{ width,height }, deviceScaleFactor:dpr, isMobile:true, hasTouch:true, reducedMotion:'reduce' });
    const phone = await visit(context);
    await phone.waitForFunction(() => document.querySelector('[data-hero-shader]').dataset.shaderState === 'paused');
    check(`mobile ${width}px keeps content in bounds and caps the rendering budget`, await phone.evaluate(() => {
      const canvas = document.querySelector('[data-hero-shader]');
      return document.documentElement.scrollWidth <= innerWidth && canvas.width * canvas.height <= 450_000 && canvas.getAttribute('aria-hidden') === 'true' && [...document.querySelectorAll('.hero-buttons>a')].every(button => { const r=button.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth; });
    }));
    if (width===390) await phone.screenshot({ path:path.join(output,'hero-shader-mobile.png') });
    await context.close();
  }
  const reduce = await browser.newContext({ viewport:{width:390,height:844}, reducedMotion:'reduce', isMobile:true, hasTouch:true });
  const calm = await visit(reduce);
  await calm.waitForFunction(() => document.querySelector('[data-hero-shader]').dataset.shaderState === 'paused');
  const calmTime = await time(calm);
  await calm.waitForTimeout(400);
  check('reduced motion shows a static mesh, without a continuous render loop', await time(calm)===calmTime && calmTime===0);
  await calm.setViewportSize({ width:844, height:390 });
  await calm.waitForTimeout(200);
  check('a paused shader still fits when a phone rotates', await calm.locator('[data-hero-shader]').evaluate(canvas => {
    const r=canvas.getBoundingClientRect(); return Math.abs(canvas.width/canvas.height-r.width/r.height)<.01;
  }));
  const fallback = await browser.newContext({ viewport:{width:390,height:844} });
  await fallback.addInitScript(() => { const get=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(type,...args){ return type==='webgl' ? null : get.call(this,type,...args); }; });
  const unsupported = await visit(fallback);
  await unsupported.waitForFunction(() => document.querySelector('[data-hero-shader]').dataset.shaderState === 'fallback');
  check('disabled WebGL keeps the matching mesh and both links usable', await unsupported.locator('[data-hero-shader]').evaluate(canvas => canvas.dataset.shaderState==='fallback' && !canvas.closest('.hero-surface').hasAttribute('data-shader-ready') && !canvas.closest('.hero-surface').querySelector('.hero-scene') && !!canvas.closest('.hero-surface').querySelector('.hero-static-mesh image')));
  await unsupported.locator('.hero-buttons .pill-link').click();
  check('the fallback demo action still navigates', await unsupported.evaluate(() => location.hash==='#demonstracao'));
  const plain = await browser.newPage({ javaScriptEnabled:false, viewport:{width:390,height:844} });
  await plain.goto(base,{waitUntil:'networkidle'});
  check('without JavaScript the matching mesh and hero remain visible', await plain.locator('.hero-surface').evaluate(hero => !hero.querySelector('.hero-scene') && !!hero.querySelector('.hero-static-mesh image') && getComputedStyle(hero.querySelector('.hero-shader')).opacity==='0' && hero.querySelector('h1').getBoundingClientRect().height>0));
  check('no JavaScript errors during rendering, resizing, pause or recovery', errors.length===0);
  await writeFile(path.join(output,'hero-shader-results.json'),JSON.stringify({checks,errors},null,2));
  console.log(`${checks.length} shader checks passed.`);
} finally { await browser.close(); }
