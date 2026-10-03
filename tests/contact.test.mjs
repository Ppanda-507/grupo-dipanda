import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContact, sendContact } from '../scripts/contact.mjs';

const now = Date.now();
const form = { name: 'Pessoa Teste', email: 'pessoa@example.com', message: 'Quero conhecer as soluções de análise.', startedAt: now - 5000, website: '' };
test('contact rejects invalid fields, bots and implausible submission times', () => {
  assert.deepEqual(validateContact(form, now).value, { name: form.name, email: form.email, message: form.message });
  for (const patch of [{ name: 'x' }, { email: 'no-email' }, { message: 'curta' }, { website: 'spam' }, { startedAt: now }, { startedAt: 'invalid' }, { name: 'nome\nBcc: outro' }]) assert.ok(validateContact({ ...form, ...patch }, now).error);
});
test('contact never reports success without a configured service or a delivery acknowledgement', async () => {
  assert.equal((await sendContact(form, { environment: {} })).status, 503);
  const environment = { RESEND_API_KEY: 'test-key', CONTACT_FROM_EMAIL: 'Teste <sender@example.com>' };
  assert.equal((await sendContact(form, { environment, fetcher: async () => ({ ok: false, json: async () => ({}) }) })).status, 502);
  assert.equal((await sendContact(form, { environment, fetcher: async () => ({ ok: true, json: async () => ({}) }) })).status, 502);
  const sent = await sendContact(form, { environment, fetcher: async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    const payload = JSON.parse(options.body);
    assert.equal(payload.reply_to, form.email);
    assert.equal(payload.to[0], 'comercial@grupodipanda.com');
    assert.ok(payload.text.includes(form.message));
    return { ok: true, json: async () => ({ id: 'fake-test-ack' }) };
  } });
  assert.equal(sent.status, 200);
});
