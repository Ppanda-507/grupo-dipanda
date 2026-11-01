import test from 'node:test';
import assert from 'node:assert/strict';

import { smtpOptions, sendSmtpContact } from '../../server/contact/smtp.mjs';
import { createContactLimiter } from '../../server/contact/limits.mjs';
import { createContactHandler } from '../../server/contact/handler.mjs';
import { validateContact, sendContact } from '../../server/contact/service.mjs';

// Only fake credentials and injected transports are used in this test file.
const smtpEnvironment = {
  SMTP_HOST: 'smtp.hostinger.com', SMTP_PORT: '465',
  SMTP_USER: 'geral@grupodipanda.com', SMTP_PASSWORD: 'fake-test-password',
  CONTACT_FROM_EMAIL: 'Dipanda <geral@grupodipanda.com>',
  CONTACT_TO_EMAIL: 'geral@grupodipanda.com',
};
const sender = { name: 'Teste local', email: 'visitante@example.net', message: 'Pedido de contacto de teste.' };
const validBody = () => ({ ...sender, website: '', startedAt: Date.now() - 3000 });
function fakeTransport(result, reject) {
  const capture = { options: null, message: null, closed: false, calls: 0 };
  const createTransport = options => {
    capture.options = options;
    return {
      async sendMail(message) {
        capture.calls++;
        capture.message = message;
        if (reject) throw reject;
        return result;
      },
      close() { capture.closed = true; },
    };
  };
  return { capture, createTransport };
}

test('SMTP 465 requires implicit TLS and protects access to files and URLs', () => {
  const options = smtpOptions(smtpEnvironment);
  assert.equal(options.host, 'smtp.hostinger.com');
  assert.equal(options.port, 465);
  assert.equal(options.secure, true);
  assert.equal(options.tls.minVersion, 'TLSv1.2');
  assert.deepEqual(options.auth, { user: smtpEnvironment.SMTP_USER, pass: smtpEnvironment.SMTP_PASSWORD });
  assert.equal(options.disableFileAccess, true);
  assert.equal(options.disableUrlAccess, true);
});

test('SMTP 587 requires STARTTLS, unsupported ports and absent passwords stay unavailable', () => {
  const options = smtpOptions({ ...smtpEnvironment, SMTP_PORT: '587' });
  assert.equal(options.secure, false);
  assert.equal(options.requireTLS, true);
  for (const port of ['25', '80', '465abc', '0']) assert.equal(smtpOptions({ ...smtpEnvironment, SMTP_PORT: port }), null);
  assert.equal(smtpOptions({ ...smtpEnvironment, SMTP_PASSWORD: '' }), null);
});

test('SMTP mail uses company sender and visitor Reply-To and confirms destination acceptance', async () => {
  const fake = fakeTransport({ accepted: ['geral@grupodipanda.com'], rejected: [], messageId: 'fake-message-id' });
  const result = await sendSmtpContact(sender, { environment: smtpEnvironment, createTransport: fake.createTransport });
  assert.equal(result.status, 200);
  assert.equal(fake.capture.calls, 1);
  assert.equal(fake.capture.message.from, smtpEnvironment.CONTACT_FROM_EMAIL);
  assert.equal(fake.capture.message.to, smtpEnvironment.CONTACT_TO_EMAIL);
  assert.deepEqual(fake.capture.message.replyTo, { name: sender.name, address: sender.email });
  assert.ok(fake.capture.message.text.includes(sender.message));
  assert.equal(fake.capture.closed, true);
});

test('contact provider routes SMTP by explicit choice and by default, preserving Resend compatibility', async () => {
  for (const provider of [undefined, 'smtp']) {
    const fake = fakeTransport({ accepted: ['geral@grupodipanda.com'], rejected: [] });
    const environment = { ...smtpEnvironment, ...(provider ? { CONTACT_PROVIDER: provider } : {}) };
    const result = await sendContact(sender, { environment, createTransport: fake.createTransport });
    assert.equal(result.status, 200);
    assert.equal(fake.capture.calls, 1);
  }
  let posted;
  const resend = await sendContact(sender, {
    environment: { CONTACT_PROVIDER: 'resend', RESEND_API_KEY: 'fake-key', CONTACT_FROM_EMAIL: smtpEnvironment.CONTACT_FROM_EMAIL },
    fetcher: async (url, options) => { posted = { url, options }; return new Response(JSON.stringify({ id: 'fake-id' }), { status: 200 }); },
  });
  assert.equal(resend.status, 200);
  assert.equal(posted.url, 'https://api.resend.com/emails');
  assert.equal(JSON.parse(posted.options.body).reply_to, sender.email);
});

test('SMTP missing credentials, wrong acceptance, rejection and provider errors never claim success', async () => {
  const missing = fakeTransport({ accepted: ['geral@grupodipanda.com'], rejected: [] });
  assert.equal((await sendSmtpContact(sender, { environment: { ...smtpEnvironment, SMTP_PASSWORD: '' }, createTransport: missing.createTransport })).status, 503);
  assert.equal(missing.capture.calls, 0);
  for (const providerResult of [
    { accepted: [], rejected: [] },
    { accepted: ['someone-else@example.net'], rejected: [] },
    { accepted: ['geral@grupodipanda.com'], rejected: ['geral@grupodipanda.com'] },
  ]) {
    const fake = fakeTransport(providerResult);
    assert.equal((await sendSmtpContact(sender, { environment: smtpEnvironment, createTransport: fake.createTransport })).status, 502);
  }
  const failure = fakeTransport(null, new Error('fake failure, no connection made'));
  assert.equal((await sendSmtpContact(sender, { environment: smtpEnvironment, createTransport: failure.createTransport })).status, 502);
});

test('basic production limiter works without Upstash and rejects request seven', async () => {
  const limit = createContactLimiter({});
  for (let i = 0; i < 6; i++) assert.equal((await limit('192.0.2.15')).status, 200);
  assert.equal((await limit('192.0.2.15')).status, 429);
  assert.equal((await limit('192.0.2.16')).status, 200);
});

test('partially configured durable limiter fails closed instead of memory fallback', async () => {
  for (const environment of [
    { UPSTASH_REDIS_REST_URL: 'https://test.upstash.io' },
    { UPSTASH_REDIS_REST_TOKEN: 'fake-token' },
  ]) assert.equal((await createContactLimiter(environment)('192.0.2.20')).status, 503);
});

async function invoke(origin, environment, { requestOrigin = origin, local = false, body = validBody(), method = 'POST', headers = {} } = {}) {
  const calls = [];
  const send = async value => { calls.push(value); return { status: 200, message: 'Fake accepted' }; };
  const handle = createContactHandler({ environment, local, send, limit: async () => ({ status: 200 }) });
  const request = new Request(origin + '/api/contact', {
    method,
    headers: { origin: requestOrigin, 'content-type': 'application/json', ...headers },
    ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
  });
  return { response: await handle(request, '192.0.2.44'), calls };
}

test('production accepts canonical company origin and rejects cross-origin POSTs', async () => {
  const environment = { SITE_URL: 'https://grupodipanda.com', CONTACT_ENABLED: 'true', VERCEL_ENV: 'production' };
  const valid = await invoke('https://grupodipanda.com', environment);
  assert.equal(valid.response.status, 200);
  assert.equal(valid.calls.length, 1);
  const invalid = await invoke('https://grupodipanda.com', environment, { requestOrigin: 'https://evil.example.net' });
  assert.equal(invalid.response.status, 403);
  assert.equal(invalid.calls.length, 0);
  assert.equal((await invoke('https://grupodipanda.com', environment, { headers: { 'sec-fetch-site': 'cross-site' } })).response.status, 403);
});

test('explicitly enabled Vercel Preview and production deployment host accept same-origin requests', async () => {
  const environment = {
    SITE_URL: 'https://grupodipanda.com', CONTACT_ENABLED: 'true', VERCEL_ENV: 'preview',
    VERCEL_URL: 'grupo-dipanda-fake-preview.vercel.app',
    VERCEL_PROJECT_PRODUCTION_URL: 'grupo-dipanda.vercel.app',
  };
  assert.equal((await invoke('https://' + environment.VERCEL_URL, environment)).response.status, 200);
  assert.equal((await invoke('https://' + environment.VERCEL_PROJECT_PRODUCTION_URL, environment)).response.status, 200);
  assert.equal((await invoke('https://unrelated.vercel.app', environment)).response.status, 403);
});

test('disabled contacts never call transport in production or local development', async () => {
  const environment = { SITE_URL: 'https://grupodipanda.com', CONTACT_ENABLED: 'false' };
  for (const [origin, local] of [['https://grupodipanda.com', false], ['http://127.0.0.1:4173', true]]) {
    const disabled = await invoke(origin, environment, { local });
    assert.equal(disabled.response.status, 503);
    assert.equal(disabled.calls.length, 0);
  }
});

test('enabled local development accepts matching origin; input validation, honeypot and methods remain active', async () => {
  const environment = { CONTACT_ENABLED: 'true' };
  assert.equal((await invoke('http://127.0.0.1:4173', environment, { local: true })).response.status, 200);
  const badHoneypot = await invoke('http://127.0.0.1:4173', environment, { local: true, body: { ...validBody(), website: 'spam' } });
  assert.equal(badHoneypot.response.status, 400);
  assert.equal(badHoneypot.calls.length, 0);
  assert.equal((await invoke('http://127.0.0.1:4173', environment, { local: true, method: 'GET' })).response.status, 405);
  assert.ok(validateContact({ ...validBody(), email: 'bad\r\nInjected@example.net' }).error);
  assert.ok(validateContact({ ...validBody(), message: 'short' }).error);
  assert.ok(validateContact({ ...validBody(), startedAt: Date.now() }).error);
});
