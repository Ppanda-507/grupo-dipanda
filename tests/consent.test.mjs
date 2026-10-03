import test from 'node:test';
import assert from 'node:assert/strict';
import { createConsent, parseConsent, getCookie, cookieAttributes, CONSENT_DAYS } from '../public/js/consent-core.js';

test('consent defaults to essential cookies and stores an explicit choice', () => {
  const now = 1000;
  for (const value of [false, undefined, 'true', null]) assert.equal(createConsent(value, now).functional, false);
  const consent = createConsent(true, now);
  assert.equal(consent.necessary, true);
  assert.deepEqual(parseConsent(encodeURIComponent(JSON.stringify(consent)), now), consent);
});

test('expired, malformed, future or obsolete consent is rejected', () => {
  const consent = createConsent(false, 1000);
  assert.equal(parseConsent(encodeURIComponent(JSON.stringify(consent)), 1000 + CONSENT_DAYS * 86400000), null);
  for (const value of ['bad-json', '%zz', '', JSON.stringify({ ...consent, version: 0 }), JSON.stringify({ ...consent, functional: 'yes' }), JSON.stringify({ ...consent, expiresAt: Infinity })]) assert.equal(parseConsent(value, 1000), null);
  assert.equal(parseConsent(JSON.stringify(consent), 999), null);
});

test('cookie names cannot match a suffix or another cookie', () => {
  assert.equal(getCookie('dipanda_consent', 'other_dipanda_consent=bad; dipanda_consent=good; x=y'), 'good');
  assert.equal(getCookie('missing', 'x=y'), null);
});

test('secure cookies on HTTPS, available for local preview on HTTP', () => {
  assert.match(cookieAttributes('https:'), /; Secure$/);
  assert.doesNotMatch(cookieAttributes('http:'), /Secure/);
  assert.match(cookieAttributes('https:', 0), /Max-Age=0/);
});
