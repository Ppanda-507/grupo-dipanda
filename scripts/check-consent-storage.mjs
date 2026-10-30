import { chromium, firefox, webkit } from 'playwright-core';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pages } from '../src/pages.mjs';

const base = process.env.TEST_URL || 'http://127.0.0.1:4173';
const origin = new URL(base).origin;
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname)) throw new Error('Only local, synthetic tests are allowed.');
const output = process.env.DIPANDA_CONSENT_REPORT || 'reports/consent-storage-2026-10-29/after-fix.json';
const engine = process.env.BROWSER_ENGINE || 'chromium';
const browserType = { chromium, firefox, webkit }[engine];
assert.ok(browserType, 'BROWSER_ENGINE must be chromium, firefox or webkit');
const launchOptions = { headless: true, ...(engine === 'chromium' ? { channel: 'chromium' } : {}), ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) };
const contextOptions = { reducedMotion: 'reduce', ignoreHTTPSErrors: origin.startsWith('https:'), viewport: { width: 1280, height: 900 } };
const browser = await browserType.launch(launchOptions);
const report = { startedAt: new Date().toISOString(), runtime: process.version, engine, browserVersion: browser.version(), executablePath: process.env.BROWSER_EXECUTABLE || browserType.executablePath(), platform: process.platform, origin, version: JSON.parse(await fs.readFile(process.env.AUDIT_VERSION || 'reports/local-audit-2026-10-29/code-version.json', 'utf8')), scenarios: [], snapshots: [], network: [], httpCache: [], storageOperations: [], errors: [], limits: ['Local only; no Vercel/domain assessment.', 'Development self-signed TLS: certificate errors ignored only in these dedicated local test contexts.', 'Only one optional category exists: functional.', 'No actual analytics/ad SDK, third-party iframe, login or private account area exists.', engine === 'chromium' ? 'HTTP disk-cache provenance via CDP; not a complete disk cache inventory.' : 'HTTP headers and Resource Timing observed; CDP disk-cache provenance unavailable in this engine.', 'Playwright WebKit on Windows is not Apple Safari.'] };
let scenarioId = '';
const consent = snapshot => {
  try { return JSON.parse(decodeURIComponent(snapshot.cookies.find(cookie => cookie.name === 'dipanda_consent')?.value || 'null')); } catch { return null; }
};
const pref = snapshot => snapshot.cookies.find(cookie => cookie.name === 'dipanda_preferences' && (cookie.expires === -1 || cookie.expires * 1000 > snapshot.capturedAt));
function checkStorage(snapshot, functional, { fixture = false } = {}) {
  assert.equal(Boolean(pref(snapshot)), functional, snapshot.id + ': functional cookie');
  assert.deepEqual(snapshot.cookies.filter(c => c.party === 'third-party'), [], 'No third-party cookies');
  assert.ok(snapshot.cookies.every(c => ['dipanda_consent', 'dipanda_preferences'].includes(c.name)), 'Only inventoried cookies');
  assert.ok(!snapshot.storage.error, snapshot.storage.error);
  assert.deepEqual(snapshot.storage.serviceWorkers, []);
  if (!fixture) {
    assert.deepEqual(snapshot.storage.localStorage, {});
    assert.deepEqual(snapshot.storage.sessionStorage, {});
    assert.deepEqual(snapshot.storage.indexedDB, []);
    assert.deepEqual(snapshot.storage.cacheStorage, []);
  }
}
async function instrument(context) {
  await context.addInitScript(() => {
    window.__storageAudit = [];
    const log = (mechanism, operation, key) => {
      if (!window.__auditInspecting) window.__storageAudit.push({ mechanism, operation, key: key == null ? null : String(key), time: Date.now() });
    };
    const cookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(Document.prototype, 'cookie', {
      configurable: cookie.configurable, enumerable: cookie.enumerable,
      get() { log('cookie', 'read', null); return cookie.get.call(this); },
      set(value) {
        const key = String(value).split('=')[0];
        log('cookie', /max-age=0(?:;|$)/i.test(value) ? 'delete' : 'set', key);
        if (!window.__auditInspecting) window.__storageAudit.at(-1).attributes = String(value).split(';').slice(1).map(v => v.trim());
        if (key === 'dipanda_preferences' && !window.__auditInspecting) {
          let authorized = false;
          try {
            const raw = cookie.get.call(this).split(';').map(v => v.trim()).find(v => v.startsWith('dipanda_consent='));
            const choice = JSON.parse(decodeURIComponent(raw.slice('dipanda_consent='.length)));
            authorized = choice.version === 1 && choice.necessary === true && choice.functional === true && choice.updatedAt <= Date.now() && choice.expiresAt > Date.now() && choice.expiresAt - choice.updatedAt === 180 * 86400000;
          } catch { /* absent or invalid authorization */ }
          window.__storageAudit.at(-1).authorized = authorized;
        }
        cookie.set.call(this, value);
      },
    });
    for (const operation of ['setItem', 'getItem', 'removeItem', 'clear']) {
      const native = Storage.prototype[operation];
      Storage.prototype[operation] = function (...args) { log(this === localStorage ? 'localStorage' : 'sessionStorage', operation, args[0]); return native.apply(this, args); };
    }
    const wrap = (prototype, operation, mechanism) => {
      if (!prototype?.[operation]) return;
      const native = prototype[operation];
      prototype[operation] = function (...args) { log(mechanism, operation, args[0]); return native.apply(this, args); };
    };
    wrap(window.IDBFactory?.prototype, 'open', 'IndexedDB');
    wrap(window.IDBFactory?.prototype, 'deleteDatabase', 'IndexedDB');
    for (const operation of ['open', 'delete']) wrap(window.CacheStorage?.prototype, operation, 'CacheStorage');
    wrap(window.ServiceWorkerContainer?.prototype, 'register', 'serviceWorker');
  });
  const requests = new WeakMap();
  context.on('request', request => {
    if (!/^https?:/.test(request.url())) return;
    const row = { scenario: scenarioId, url: request.url(), method: request.method(), type: request.resourceType(), party: new URL(request.url()).origin === origin ? 'first-party' : 'third-party' };
    requests.set(request, row); report.network.push(row);
    void request.allHeaders().then(headers => { row.cookieNames = (headers.cookie || '').split(';').map(v => v.trim().split('=')[0]).filter(Boolean); });
  });
  context.on('response', async response => {
    const row = requests.get(response.request());
    if (row) { row.status = response.status(); row.cacheControl = (await response.allHeaders())['cache-control'] || null; row.fromServiceWorker = response.fromServiceWorker(); }
  });
  context.on('page', wire);
  for (const page of context.pages()) await wire(page);
  async function wire(page) {
    page.on('pageerror', error => report.errors.push({ scenario: scenarioId, message: error.message }));
    if (engine !== 'chromium') return;
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    client.on('Network.responseReceived', ({ response }) => report.httpCache.push({ scenario: scenarioId, url: response.url, status: response.status, fromDiskCache: response.fromDiskCache || false, fromServiceWorker: response.fromServiceWorker || false, fromPrefetchCache: response.fromPrefetchCache || false }));
  }
}
async function fresh() {
  const context = await browser.newContext(contextOptions);
  await instrument(context);
  const page = await context.newPage();
  await page.goto(origin + '/', { waitUntil: 'networkidle' });
  return { context, page };
}
async function snapshot(page, label) {
  const storage = await page.evaluate(async () => {
    window.__auditInspecting = true;
    try {
      const indexedDB = [];
      for (const database of await window.indexedDB.databases()) {
        const details = await new Promise((resolve, reject) => {
          const request = window.indexedDB.open(database.name);
          request.onerror = () => reject(request.error);
          request.onsuccess = async () => {
            const db = request.result;
            const stores = [];
            for (const name of db.objectStoreNames) {
              const count = await new Promise((resolve, reject) => {
                const request = db.transaction(name, 'readonly').objectStore(name).count();
                request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
              }); stores.push({ name, count });
            }
            db.close(); resolve({ name: database.name, version: database.version, stores });
          };
        }); indexedDB.push(details);
      }
      const cacheStorage = [];
      for (const name of await caches.keys()) {
        const cache = await caches.open(name); const entries = [];
        for (const request of await cache.keys()) { const response = await cache.match(request); entries.push({ url: request.url, status: response.status, cacheControl: response.headers.get('cache-control'), bodyBytes: (await response.arrayBuffer()).byteLength }); }
        cacheStorage.push({ name, entries });
      }
      return { localStorage: Object.fromEntries(Object.entries(localStorage)), sessionStorage: Object.fromEntries(Object.entries(sessionStorage)), indexedDB, cacheStorage, serviceWorkers: (await navigator.serviceWorker.getRegistrations()).map(r => ({ scope: r.scope, scriptURL: r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL })) };
    } catch (error) { return { error: String(error) }; }
    finally { window.__auditInspecting = false; }
  });
  const cookies = (await page.context().cookies()).map(cookie => ({ ...cookie, party: cookie.domain.replace(/^\./, '') === new URL(origin).hostname ? 'first-party' : 'third-party' }));
  const value = { id: `${scenarioId}/${label}`, capturedAt: Date.now(), url: page.url(), cookies, storage, documentCookieNames: await page.evaluate(() => document.cookie.split(';').map(v => v.trim().split('=')[0]).filter(Boolean)) };
  value.resourceTiming = await page.evaluate(() => performance.getEntriesByType('resource').map(r => ({ name: r.name, transferSize: r.transferSize, encodedBodySize: r.encodedBodySize, decodedBodySize: r.decodedBodySize })));
  report.snapshots.push(value);
  const operations = await page.evaluate(() => window.__storageAudit.splice(0));
  report.storageOperations.push({ snapshot: value.id, operations });
  return value;
}
const choose = (page, choice) => page.locator(`[data-cookie-banner] [data-cookie-${choice}]`).click();
async function settings(page) { await page.locator('[data-cookie-settings]').first().click(); }
const motion = page => page.locator('[data-motion-toggle]').click();
async function persist(page, functional, decision) {
  await page.reload({ waitUntil: 'networkidle' });
  for (const [label, route] of [['reload', null], ['navigation', '/sobre/'], ['history', 'back']]) {
    if (route === 'back') await page.goBack({ waitUntil: 'networkidle' });
    else if (route) await page.goto(origin + route, { waitUntil: 'networkidle' });
    if (!functional) await motion(page);
    const state = await snapshot(page, label);
    checkStorage(state, functional);
    assert.deepEqual(consent(state), decision, 'Choice must not be renewed or replaced by automatic acceptance');
    assert.equal(await page.locator('[data-cookie-banner]').isVisible(), false);
  }
  const returning = await page.context().newPage();
  await returning.goto(origin + '/servicos/', { waitUntil: 'networkidle' });
  const state = await snapshot(returning, 'return-new-tab'); checkStorage(state, functional); assert.deepEqual(consent(state), decision); await returning.close();
}
async function scenario(id, expected, run) {
  scenarioId = id;
  const row = { id, expected, status: 'PASS' }; report.scenarios.push(row);
  try { row.observed = await run(); } catch (error) { row.status = 'FAIL'; row.observed = error.stack || String(error); }
  console.log(id + ': ' + row.status);
}

try {
  await scenario('S01-before-choice', 'No optional storage or third-party requests, including late/scroll-loaded resources.', async () => {
    const { context, page } = await fresh();
    try {
      const initial = await snapshot(page, 'initial'); checkStorage(initial, false); assert.equal(initial.cookies.length, 0);
      await settings(page); await page.locator('[data-cookie-close]').click();
      await motion(page);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(8000);
      const late = await snapshot(page, 'after-scroll-and-eight-seconds'); checkStorage(late, false); assert.equal(late.cookies.length, 0);
      for (const route of Object.keys(pages).filter(route => route !== '/404')) {
        await page.goto(origin + (route === '/' ? '/' : route + '/'), { waitUntil: 'networkidle' });
        const state = await snapshot(page, 'route-' + route); checkStorage(state, false); assert.equal(state.cookies.length, 0);
      }
      return 'All current pages and late resource window stayed free of optional storage.';
    } finally { await context.close(); }
  });
  await scenario('S02-reject', 'Only the essential choice cookie; no optional writes after interaction, reload or return.', async () => {
    const { context, page } = await fresh();
    try {
      await choose(page, 'reject'); await motion(page);
      await page.evaluate(async () => { await import('/js/motion.js'); document.dispatchEvent(new CustomEvent('dipanda:motion-change')); });
      await page.waitForTimeout(1000);
      const state = await snapshot(page, 'rejected-with-late-action'); checkStorage(state, false); assert.equal(consent(state).functional, false);
      await persist(page, false, consent(state)); return 'Rejection persisted without functional cookie or automatic acceptance.';
    } finally { await context.close(); }
  });
  await scenario('S03-accept-all', 'Essential and functional cookies only; preference is restored with its original authorization.', async () => {
    const { context, page } = await fresh();
    try {
      await choose(page, 'accept'); await motion(page);
      const state = await snapshot(page, 'accepted-and-paused'); checkStorage(state, true); assert.equal(state.cookies.length, 2); assert.equal(consent(state).functional, true);
      assert.equal(JSON.parse(decodeURIComponent(pref(state).value)).motionPaused, true);
      assert.ok(pref(state).expires * 1000 <= consent(state).expiresAt + 1000, 'Preference may not outlive authorization');
      await persist(page, true, consent(state));
      assert.equal(await page.locator('[data-motion-toggle]').getAttribute('aria-pressed'), 'true');
      return 'Only the single authorized optional service persisted; no other storage.';
    } finally { await context.close(); }
  });
  await scenario('S04-custom-essential-only', 'Saving personalization with functional unchecked grants no optional storage.', async () => {
    const { context, page } = await fresh();
    try {
      await settings(page); assert.equal(await page.locator('[name="functional"]').isChecked(), false);
      await page.locator('[data-cookie-save]').click(); const state = await snapshot(page, 'custom-essential'); checkStorage(state, false); assert.equal(consent(state).functional, false);
      await persist(page, false, consent(state)); return 'Essential-only selection respected. There is no subset of two optional categories to test.';
    } finally { await context.close(); }
  });
  await scenario('S05-custom-functional', 'Selecting functional enables only that category (the only optional category).', async () => {
    const { context, page } = await fresh();
    try {
      await settings(page); await page.locator('[name="functional"]').check(); await page.locator('[data-cookie-save]').click();
      const state = await snapshot(page, 'custom-functional'); checkStorage(state, true); assert.equal(consent(state).functional, true);
      await persist(page, true, consent(state)); return 'Functional category enabled; analytics/advertising categories do not exist.';
    } finally { await context.close(); }
  });
  await scenario('S06-withdraw', 'Delete owned optional identifier and stop all future preference writes.', async () => {
    const { context, page } = await fresh();
    try {
      await choose(page, 'accept'); await motion(page); checkStorage(await snapshot(page, 'before-withdraw'), true);
      await settings(page); await page.locator('[name="functional"]').uncheck(); await page.locator('[data-cookie-save]').click();
      await motion(page); await page.waitForTimeout(1000);
      const state = await snapshot(page, 'withdrawn-and-used-again'); checkStorage(state, false); assert.equal(consent(state).functional, false);
      await persist(page, false, consent(state)); return 'Preference removed and not recreated by subsequent motion or page navigation.';
    } finally { await context.close(); }
  });
  await scenario('S07-other-tab-revocation', 'An old tab cannot recreate a preference after another tab revokes consent.', async () => {
    const { context, page } = await fresh();
    try {
      await choose(page, 'accept'); const second = await context.newPage(); await second.goto(origin + '/sobre/', { waitUntil: 'networkidle' });
      await settings(second); await second.locator('[data-cookie-dialog] [data-cookie-reject]').click();
      await page.evaluate(() => document.dispatchEvent(new CustomEvent('dipanda:motion-change')));
      checkStorage(await snapshot(page, 'old-tab-after-late-action'), false);
      await settings(page); assert.equal(await page.locator('[name="functional"]').isChecked(), false); await page.locator('[data-cookie-close]').click();
      return 'Previously failing stale-tab write is now blocked; dialog reflects shared refusal.';
    } finally { await context.close(); }
  });
  await scenario('S08-expiry-open-tab', 'Expired authorization cannot be used by an already-open tab.', async () => {
    const { context, page } = await fresh();
    try {
      await choose(page, 'accept'); const old = Date.now() - 181 * 86400000;
      await context.addCookies([{ name: 'dipanda_consent', value: encodeURIComponent(JSON.stringify({ version: 1, necessary: true, functional: true, updatedAt: old, expiresAt: old + 180 * 86400000 })), url: origin, expires: Date.now() / 1000 + 500 }]);
      await page.evaluate(() => document.dispatchEvent(new CustomEvent('dipanda:motion-change')));
      checkStorage(await snapshot(page, 'expired-payload-late-action'), false);
      assert.equal(await page.locator('[data-cookie-banner]').isVisible(), true);
      return 'Expired payload fails closed and asks for a new choice, with no automatic acceptance.';
    } finally { await context.close(); }
  });
  await scenario('S09-expiry-timer-and-ttl', 'Optional cookie TTL ends with consent; expiry removes authorization without interaction.', async () => {
    const { context, page } = await fresh();
    try {
      await choose(page, 'accept'); const expiresAt = Date.now() + 2500;
      await context.addCookies([{ name: 'dipanda_consent', value: encodeURIComponent(JSON.stringify({ version: 1, necessary: true, functional: true, updatedAt: expiresAt - 180 * 86400000, expiresAt })), url: origin, expires: expiresAt / 1000 }]);
      await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await motion(page);
      const state = await snapshot(page, 'shortened-fixture'); checkStorage(state, true); assert.ok(pref(state).expires * 1000 <= expiresAt + 1000);
      await page.waitForTimeout(3200);
      const expired = await snapshot(page, 'expired-without-action'); checkStorage(expired, false); assert.equal(await page.locator('[data-cookie-banner]').isVisible(), true);
      assert.ok(!expired.documentCookieNames.includes('dipanda_preferences') && !expired.documentCookieNames.includes('dipanda_consent'), 'Expired cookies are not accessible to page JavaScript');
      const request = page.waitForRequest(request => request.url().endsWith('/js/consent-core.js?audit=expired'));
      await page.evaluate(() => fetch('/js/consent-core.js?audit=expired', { cache: 'no-store' }));
      const headers = await (await request).allHeaders(); assert.ok(!/dipanda_(consent|preferences)=/.test(headers.cookie || ''), 'Expired cookies are not sent on the network');
      return 'TTL and automatic expiry verified through page access and actual outgoing cookie headers. Raw browser inventory is retained, including expired entries returned by Firefox.';
    } finally { await context.close(); }
  });
  await scenario('S10-selective-cleanup', 'Withdrawal removes only owned optional identifiers, preserving unrelated/technical storage.', async () => {
    const { context, page } = await fresh();
    try {
      await choose(page, 'accept');
      await page.evaluate(async () => {
        window.__auditInspecting = true;
        try {
          localStorage.setItem('audit-unrelated', 'non-personal-test-fixture'); sessionStorage.setItem('audit-tab', 'non-personal-test-fixture');
          const cache = await caches.open('audit-static-fixture'); await cache.put('/audit-static-fixture.txt', new Response('non-personal static content', { headers: { 'Cache-Control': 'public, max-age=3600' } }));
          await new Promise((resolve, reject) => { const r = indexedDB.open('audit-fixture-db', 1); r.onupgradeneeded = () => r.result.createObjectStore('layout'); r.onerror = () => reject(r.error); r.onsuccess = () => { const db = r.result; const tx = db.transaction('layout', 'readwrite'); tx.objectStore('layout').put('compact', 'layout'); tx.oncomplete = () => { db.close(); resolve(); }; }; });
        } finally { window.__auditInspecting = false; }
      });
      await settings(page); await page.locator('[data-cookie-dialog] [data-cookie-reject]').click();
      const state = await snapshot(page, 'fixture-after-withdraw'); checkStorage(state, false, { fixture: true });
      assert.equal(state.storage.localStorage['audit-unrelated'], 'non-personal-test-fixture'); assert.equal(state.storage.sessionStorage['audit-tab'], 'non-personal-test-fixture');
      assert.equal(state.storage.indexedDB[0].stores[0].count, 1); assert.equal(state.storage.cacheStorage[0].entries.length, 1);
      return 'Synthetic non-personal sentinels survived. They are test fixtures, not actual site storage.';
    } finally { await context.close(); }
  });
  await scenario('S11-contact-private-cache', 'Contact responses are no-store and are not saved to Cache Storage.', async () => {
    const { context, page } = await fresh();
    try {
      const response = await page.evaluate(async () => { const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); return { status: response.status, cacheControl: response.headers.get('cache-control'), body: await response.json() }; });
      assert.ok([400, 429].includes(response.status)); assert.equal(response.cacheControl, 'no-store');
      checkStorage(await snapshot(page, 'invalid-form-response'), false);
      return 'Real local API rejects invalid synthetic input with no-store; no login/logout or authenticated private pages exist.';
    } finally { await context.close(); }
  });
  for (const choice of ['reject', 'accept']) await scenario('S12-reopen-browser-' + choice, 'Choice survives closing and reopening a dedicated browser profile.', async () => {
    const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'dipanda-consent-profile-'));
    let context = await browserType.launchPersistentContext(profile, { ...launchOptions, ...contextOptions });
    await instrument(context); let page = await context.newPage(); let decision;
    try { await page.goto(origin, { waitUntil: 'networkidle' }); await choose(page, choice); decision = consent(await snapshot(page, 'before-browser-close')); await context.addCookies([{ name: 'audit_persistence_control', value: 'non-personal-control', url: origin, expires: Date.now() / 1000 + 86400 }]); report.scenarios.at(-1).profile = profile; report.scenarios.at(-1).beforeCloseCookies = await context.cookies(); await page.waitForTimeout(2000); } finally { await context.close(); }
    context = await browserType.launchPersistentContext(profile, { ...launchOptions, ...contextOptions }); await instrument(context);
    try {
      page = await context.newPage(); await page.goto(origin + '/sobre/', { waitUntil: 'networkidle' }); const state = await snapshot(page, 'reopened-same-profile');
      if (!state.cookies.some(c => c.name === 'audit_persistence_control') && !consent(state)) {
        report.scenarios.at(-1).status = 'UNVERIFIED';
        assert.equal(await page.locator('[data-cookie-banner]').isVisible(), true);
        assert.equal(Boolean(pref(state)), false);
        return 'This automated profile lost both the site cookie and an independent persistent control cookie. Disk persistence cannot be attributed to the site; it safely requested a new choice.';
      }
      checkStorage({ ...state, cookies: state.cookies.filter(c => c.name !== 'audit_persistence_control') }, choice === 'accept'); assert.deepEqual(consent(state), decision);
      return 'Actual dedicated ' + engine + ' profile reopened; independent cookie and original choice preserved. No storageState used.';
    } finally { await context.close(); }
  });
  await scenario('S13-https-cookie-attributes', 'Consent and functional cookies use Secure and SameSite=Lax over HTTPS.', async () => {
    if (!origin.startsWith('https:')) { report.scenarios.at(-1).status = 'NOT_APPLICABLE'; return 'HTTP run. Run the same suite against real local HTTPS separately.'; }
    const { context, page } = await fresh();
    try { const response = await page.reload({ waitUntil: 'networkidle' }); await choose(page, 'accept'); const state = await snapshot(page, 'real-local-https'); const cookies = state.cookies; assert.equal(cookies.length, 2); assert.ok(cookies.every(c => c.secure), 'Secure flag');
      const evidence = { securityDetails: await response.securityDetails(), headers: await response.allHeaders(), sameSiteReported: cookies.map(c => c.sameSite) }; report.scenarios.at(-1).tls = evidence;
      // WinCairo WebKit reports SameSite=None even for an independently created Lax control.
      // Keep this observable limitation visible; do not turn a source attribute into a browser PASS.
      if (!cookies.every(c => c.sameSite === 'Lax')) { report.scenarios.at(-1).status = 'UNVERIFIED'; return 'Secure verified over real local TLS; SameSite is reported as None by this engine and needs separate validation. See cookie snapshots.'; }
      return 'Secure and SameSite=Lax verified over actual local TLS (no route interception).';
    } finally { await context.close(); }
  });
  await scenario('S14-network-and-write-audit', 'No unconfigured third parties, trackers or storage mechanisms activated across tested scenarios.', async () => {
    assert.deepEqual(report.network.filter(r => r.party === 'third-party'), []);
    assert.deepEqual(report.errors, []);
    const otherStores = report.storageOperations.flatMap(batch => batch.operations.filter(op => op.mechanism !== 'cookie'));
    assert.deepEqual(otherStores, [], 'Actual application should not touch other storage; test-fixture activity excluded');
    assert.ok(report.storageOperations.every(b => !b.operations.some(op => op.mechanism === 'cookie' && op.operation === 'set' && op.key === 'dipanda_preferences' && !op.authorized)), 'No unauthorized preference writes');
    return `${report.network.length} requests inventoried, including headers/cache provenance; no third-party request or non-cookie app storage API use.`;
  });
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  report.summary = { scenarios: report.scenarios.length, passed: report.scenarios.filter(s => s.status === 'PASS').length, failed: report.scenarios.filter(s => s.status === 'FAIL').length, unverified: report.scenarios.filter(s => s.status === 'UNVERIFIED').length, notApplicable: report.scenarios.filter(s => s.status === 'NOT_APPLICABLE').length, snapshots: report.snapshots.length, requests: report.network.length };
  await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary));
  for (const scenario of report.scenarios.filter(s => s.status === 'FAIL')) console.error(scenario.id + ': ' + scenario.observed);
  if (report.summary.failed) process.exitCode = 1;
}
