import test from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandler } from '../scripts/contact-handler.mjs';

test('contact success and provider errors remain no-store without reflecting submitted data', async () => {
  const origin = 'https://audit.dipanda.test';
  const submitted = { name: 'Synthetic Private Name', email: 'private-fixture@example.invalid', message: 'Synthetic message that must never be reflected in a cacheable response.', website: '', startedAt: Date.now() - 5000 };
  for (const status of [200, 502, 503]) {
    const handle = createContactHandler({
      environment: { SITE_URL: origin, CONTACT_ENABLED: 'true', VERCEL_ENV: 'production' },
      limit: async () => ({ status: 200 }),
      send: async data => { assert.equal(data.message, submitted.message); return { status, message: 'Generic synthetic acknowledgement.' }; },
    });
    const response = await handle(new Request(origin + '/api/contact', {
      method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(submitted),
    }), '192.0.2.1');
    assert.equal(response.status, status);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.has('set-cookie'), false);
    const text = await response.text();
    for (const value of [submitted.name, submitted.email, submitted.message]) assert.ok(!text.includes(value));
  }
});
