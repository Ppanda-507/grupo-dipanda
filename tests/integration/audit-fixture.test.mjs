import test from 'node:test';
import assert from 'node:assert/strict';
import { startAuditServer, FIXTURE_HEADER } from '../fixtures/server.mjs';

test('audit fixture rejects non-loopback binding and simulates valid contacts without provider configuration', async () => {
  await assert.rejects(startAuditServer({ host: '0.0.0.0' }), /loopback/);
  const fixture = await startAuditServer();
  try {
    const homepage = await fetch(fixture.origin);
    assert.equal(homepage.status, 200);
    assert.equal(homepage.headers.get(FIXTURE_HEADER), '1');
    const response = await fetch(fixture.origin + '/api/contact', {
      method: 'POST', headers: { origin: fixture.origin, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Local fixture', email: 'fixture@example.invalid', message: 'A valid synthetic message with no SMTP delivery.', website: '', startedAt: Date.now() - 2000 }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match((await response.json()).message, /simulada/);
  } finally { await fixture.close(); }
});
