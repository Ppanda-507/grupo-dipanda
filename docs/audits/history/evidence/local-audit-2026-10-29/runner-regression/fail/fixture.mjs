
import fs from 'node:fs/promises';
if (process.argv[1]?.endsWith('check-consent-storage.mjs')) {
  const mode = process.env.RUNNER_FIXTURE_MODE;
  console.log('Synthetic subprocess output: ' + mode);
  console.error('Synthetic diagnostic stderr');
  if (mode === 'crash') process.exit(17);
  if (mode === 'missing') process.exit(0);
  const file = process.env.DIPANDA_CONSENT_REPORT;
  if (mode === 'malformed') { await fs.writeFile(file, '{broken-json'); process.exit(0); }
  if (mode === 'invalid') { await fs.writeFile(file, '{}'); process.exit(0); }
  const status = mode === 'fail' ? 'FAIL' : mode === 'unverified' ? 'UNVERIFIED' : 'PASS';
  const version = JSON.parse(await fs.readFile(process.env.AUDIT_VERSION, 'utf8'));
  await fs.writeFile(file, JSON.stringify({
    engine: process.env.BROWSER_ENGINE, origin: process.env.TEST_URL, version,
    scenarios: [{ id: 'S13-https-cookie-attributes', status, observed: 'Synthetic SameSite limitation' }],
    summary: { scenarios: 1, passed: status === 'PASS' ? 1 : 0, failed: status === 'FAIL' ? 1 : 0,
      unverified: status === 'UNVERIFIED' ? 1 : 0, notApplicable: 0 },
  }));
  process.exit(mode === 'valid-but-crash' ? 17 : 0);
}
