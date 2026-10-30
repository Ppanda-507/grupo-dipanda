import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createContactHandler } from '../scripts/contact-handler.mjs';
import { createMemoryLimiter, createDurableLimiter, normalizeAddress } from '../scripts/contact-limits.mjs';
import { productionIssues } from '../scripts/production-readiness.mjs';
import { securityHeaders } from '../scripts/security.mjs';
import { validateContact } from '../scripts/contact.mjs';
import { renderPage } from '../src/pages.mjs';
import { runtimeIsPatched } from '../scripts/runtime-version.mjs';

const origin = 'https://audit.dipanda.test';
const form = () => ({ name: 'Pessoa Teste', email: 'audit@example.invalid', message: 'Pedido usado apenas no teste local.', website: '', startedAt: Date.now() - 5000 });
const request = (data = form(), headers = {}, method = 'POST') => new Request(origin + '/api/contact', { method, headers: { 'content-type': 'application/json', origin, ...headers }, ...(method === 'POST' ? { body: typeof data === 'string' ? data : JSON.stringify(data) } : {}) });
const environment = { SITE_URL: origin, CONTACT_ENABLED: 'true', VERCEL_ENV: 'production' };
const delivered = { status: 200, message: 'Simulação local, sem envio.' };

test('contact rejects cross origins, schemes, null origin, wrong methods, types and oversized bodies without sending', async () => {
  let sends = 0;
  const handler = createContactHandler({ environment, limit: async () => ({ status: 200 }), send: async () => { sends++; return delivered; } });
  for (const value of ['https://evil.invalid', 'http://audit.dipanda.test', 'null', 'https://audit.dipanda.test.evil.invalid']) assert.equal((await handler(request(form(), { origin: value }), '127.0.0.1')).status, 403);
  const noOrigin = request(); noOrigin.headers.delete('origin');
  assert.equal((await handler(noOrigin, '127.0.0.1')).status, 403);
  assert.equal((await handler(request(form(), { 'sec-fetch-site': 'cross-site' }), '127.0.0.1')).status, 403);
  assert.equal((await handler(request('', {}, 'GET'), '127.0.0.1')).status, 405);
  assert.equal((await handler(request(form(), { 'content-type': 'text/plain' }), '127.0.0.1')).status, 415);
  assert.equal((await handler(request(form(), { 'content-encoding': 'br' }), '127.0.0.1')).status, 415);
  assert.equal((await handler(request(form(), { 'content-length': '32769' }), '127.0.0.1')).status, 413);
  assert.equal((await handler(request('x'.repeat(32769)), '127.0.0.1')).status, 413);
  assert.equal((await handler(request('{bad'), '127.0.0.1')).status, 400);
  assert.equal(sends, 0);
});

test('form schema rejects unexpected fields, arrays, controls, duplicates and invalid UTF-8', async () => {
  for (const patch of [{ email: 'a\0@example.invalid' }, { message: 'Test message\0 with control' }, { name: 'test\tname' }, { startedAt: [] }, { admin: true }, { website: [] }, { name: ['Alice', 'Bob'] }]) assert.ok(validateContact({ ...form(), ...patch }).error);
  const handler = createContactHandler({ environment, limit: async () => ({ status: 200 }), send: async () => delivered });
  const encoded = new URLSearchParams(form()); encoded.append('name', 'Duplicate');
  assert.equal((await handler(request(encoded.toString(), { 'content-type': 'application/x-www-form-urlencoded' }), '127.0.0.1')).status, 400);
  const invalid = new Request(origin + '/api/contact', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: new Uint8Array([0xc3, 0x28]) });
  assert.equal((await handler(invalid, '127.0.0.1')).status, 400);
});

test('concurrent requests reserve quotas before provider work; invalid forms consume quota', async () => {
  let sends = 0;
  const handler = createContactHandler({ environment, limit: createMemoryLimiter(), send: async () => { sends++; await new Promise(resolve => setTimeout(resolve, 10)); return delivered; } });
  const results = await Promise.all(Array.from({ length: 20 }, () => handler(request(), '127.0.0.1')));
  assert.equal(results.filter(r => r.status === 200).length, 6);
  assert.equal(results.filter(r => r.status === 429).length, 14);
  assert.equal(sends, 6);
  assert.equal(results.find(r => r.status === 429).headers.get('retry-after'), '900');
  const invalid = createContactHandler({ environment, limit: createMemoryLimiter(), send: async () => { throw new Error('Must not send'); } });
  for (let i = 0; i < 6; i++) assert.equal((await invalid(request({}), '127.0.0.1')).status, 400);
  assert.equal((await invalid(request(), '127.0.0.1')).status, 429);
});

test('memory limiter expires and bounds memory; IPv6 /64 shares quota', async () => {
  let now = 0;
  const limit = createMemoryLimiter({ clock: () => now, maxEntries: 1 });
  assert.equal((await limit('2001:db8:1:2::1')).status, 200);
  for (let i = 0; i < 5; i++) await limit('2001:db8:1:2::2');
  assert.equal((await limit('2001:db8:1:2::abcd')).status, 429);
  assert.equal((await limit('127.0.0.1')).status, 503);
  now = 900000;
  assert.equal((await limit('127.0.0.1')).status, 200);
  assert.equal(normalizeAddress('not-an-ip'), null);
});

test('durable quota uses an atomic script and pseudonymous keys, fails closed on outages', async () => {
  const env = { UPSTASH_REDIS_REST_URL: 'https://audit.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'local-test-only', RATE_LIMIT_KEY_SECRET: 'a'.repeat(32) };
  const limit = createDurableLimiter(env, async (url, options) => {
    assert.equal(url, 'https://audit.upstash.io');
    assert.equal(options.redirect, 'error');
    const payload = JSON.parse(options.body);
    assert.equal(payload[0], 'EVAL');
    assert.match(payload[1], /INCR/);
    assert.match(payload[1], /EXPIRE/);
    assert.doesNotMatch(options.body, /192\.0\.2\.1/);
    return { ok: true, json: async () => ({ result: [200, 0] }) };
  });
  assert.equal((await limit('192.0.2.1')).status, 200);
  assert.equal((await createDurableLimiter({})('192.0.2.1')).status, 503);
  assert.equal((await createDurableLimiter(env, async () => { throw new Error('Network outage'); })('192.0.2.1')).status, 503);
  assert.equal((await createDurableLimiter(env, async () => ({ ok: true, json: async () => ({ error: 'Redis error' }) }))('192.0.2.1')).status, 503);
});

test('production/preview form is disabled by default and responses never cache', async () => {
  for (const patch of [{ CONTACT_ENABLED: 'false' }, { VERCEL_ENV: 'preview' }, { SITE_URL: 'http://invalid.test' }]) {
    const handler = createContactHandler({ environment: { ...environment, ...patch }, send: async () => { throw new Error('Unexpected delivery'); } });
    assert.equal((await handler(request(), '127.0.0.1')).status, 503);
  }
  const handler = createContactHandler({ environment, limit: async () => ({ status: 503 }), send: async () => { throw new Error('Unexpected delivery'); } });
  const response = await handler(request(), '127.0.0.1');
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('production cannot build without confirmed identity, policies and valid configuration', () => {
  assert.ok(productionIssues({}).length >= 9);
  const approved = { SITE_URL: origin, LEGAL_CONTROLLER_NAME: 'Fixture only', LEGAL_TAX_ID: 'TEST-NOT-REAL', LEGAL_ADDRESS: 'Test fixture', LEGAL_ESTABLISHMENT_COUNTRY: 'PT', LEGAL_RETENTION_NOTICE: 'Approved fixture', LEGAL_PROCESSORS_NOTICE: 'Approved fixture', LEGAL_CONSUMER_NOTICE: 'Approved fixture', LEGAL_LAST_REVIEW_DATE: '2026-10-29', LEGAL_REVIEW_APPROVED: 'true', CONTACT_ENABLED: 'false' };
  assert.deepEqual(productionIssues(approved, '24.22.1'), []);
  assert.ok(productionIssues({ ...approved, SITE_URL: 'https://example.com' }).length);
  assert.ok(productionIssues({ ...approved, CONTACT_ENABLED: 'true' }).length >= 5);
  assert.ok(productionIssues({ ...approved, LEGAL_COMPLAINTS_URL: 'javascript:alert(1)' }, '24.22.1').length);
  assert.ok(productionIssues({ ...approved, LEGAL_COMPLAINTS_URL: 'https://user:pass@audit.dipanda.test/' }, '24.22.1').length);
});

test('consumer notices escape HTML and omit unsafe complaints links', () => {
  const oldNotice = process.env.LEGAL_CONSUMER_NOTICE;
  const oldUrl = process.env.LEGAL_COMPLAINTS_URL;
  process.env.LEGAL_CONSUMER_NOTICE = '<img src=x onerror=alert(1)>';
  process.env.LEGAL_COMPLAINTS_URL = 'javascript:alert(1)';
  try {
    const html = renderPage('/termos-e-condicoes');
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(html, /href="javascript:/);
  } finally {
    if (oldNotice === undefined) delete process.env.LEGAL_CONSUMER_NOTICE; else process.env.LEGAL_CONSUMER_NOTICE = oldNotice;
    if (oldUrl === undefined) delete process.env.LEGAL_COMPLAINTS_URL; else process.env.LEGAL_COMPLAINTS_URL = oldUrl;
  }
});

test('production rejects unpatched Node runtimes', () => {
  for (const version of ['24.11.1', '24.22.0', '22.23.4', 'bad']) assert.equal(runtimeIsPatched(version), false);
  for (const version of ['24.22.1', '24.22.2', '24.23.0']) assert.equal(runtimeIsPatched(version), true);
});

test('Vercel and local server use the same CSP; output escapes HTML, cookies are not sessions', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url)));
  assert.deepEqual(Object.fromEntries(config.headers[0].headers.map(h => [h.key, h.value])), securityHeaders);
  assert.match(securityHeaders['Content-Security-Policy'], /script-src 'self';/);
  assert.doesNotMatch(securityHeaders['Content-Security-Policy'], /unsafe-eval/);
  assert.match(securityHeaders['Content-Security-Policy'], /frame-ancestors 'none'/);
  const old = process.env.LEGAL_CONTROLLER_NAME;
  process.env.LEGAL_CONTROLLER_NAME = '<img src=x onerror=alert(1)>';
  try {
    const html = renderPage('/politica-de-privacidade');
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
  } finally { if (old === undefined) delete process.env.LEGAL_CONTROLLER_NAME; else process.env.LEGAL_CONTROLLER_NAME = old; }
});
