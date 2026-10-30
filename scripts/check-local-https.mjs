import https from 'node:https';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { X509Certificate } from 'node:crypto';

const origin = new URL(process.env.TEST_URL || 'https://127.0.0.1:4443').origin;
assert.ok(origin.startsWith('https:') && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname));
const ca = await fs.readFile(process.env.TLS_CERT);
const certificate = new X509Certificate(ca);
const report = { origin, runtime: process.version, certificate: { subject: certificate.subject, issuer: certificate.issuer, subjectAltName: certificate.subjectAltName, validFrom: certificate.validFrom, validTo: certificate.validTo, fingerprint256: certificate.fingerprint256 }, checks: [] };
function request(route, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(origin + route, { ca, ...options }, res => {
      const transport = { authorized: res.socket.authorized, protocol: res.socket.getProtocol(), cipher: res.socket.getCipher() };
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, transport, body: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject); req.setTimeout(10000, () => req.destroy(new Error('Timeout'))); req.end(options.body);
  });
}
for (const protocol of ['TLSv1.2', 'TLSv1.3']) {
  const value = await request('/', { minVersion: protocol, maxVersion: protocol });
  assert.equal(value.status, 200); assert.equal(value.transport.authorized, true); assert.equal(value.transport.protocol, protocol);
  assert.ok(value.headers['content-security-policy'].includes("connect-src 'self'"));
  assert.equal(value.headers['x-content-type-options'], 'nosniff'); assert.equal(value.headers['x-frame-options'], 'DENY');
  assert.equal(value.headers['set-cookie'], undefined);
  report.checks.push({ name: protocol + ' validated with explicit development CA', status: 'PASS', observed: { ...value, body: undefined } });
}
for (const protocol of ['TLSv1', 'TLSv1.1']) {
  let rejected = false;
  try { await request('/', { minVersion: protocol, maxVersion: protocol, ciphers: 'DEFAULT:@SECLEVEL=0' }); }
  catch (error) { rejected = true; report.checks.push({ name: protocol + ' rejected', status: 'PASS', error: error.message }); }
  assert.ok(rejected);
}
try { await request('/', { ca: undefined }); throw new Error('Unexpectedly trusted certificate'); }
catch (error) { assert.ok(/self.signed/i.test(error.message)); report.checks.push({ name: 'No system trust installed', status: 'PASS', error: error.message }); }
const api = await request('/api/contact', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{}' });
assert.ok([400, 429].includes(api.status)); assert.equal(api.headers['cache-control'], 'no-store'); assert.equal(api.headers['set-cookie'], undefined);
report.checks.push({ name: 'Invalid synthetic contact; no-store, no email', status: 'PASS', observed: api });
const asset = await request('/js/consent.js'); assert.equal(asset.headers['cache-control'], 'no-store');
report.checks.push({ name: 'Development static asset cache', status: 'PASS', observed: { ...asset, body: undefined } });
report.scope = 'Real loopback TLS; no platform, public certificate, domain, HSTS preload or automatic renewal assessment.';
console.log(JSON.stringify(report, null, 2));
