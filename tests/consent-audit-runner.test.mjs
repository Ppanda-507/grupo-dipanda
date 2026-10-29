import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

// Preload only replaces the browser subprocess, never the executor under test.
// No browser, server, network request or real audit evidence is touched.
const fixture = `
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
`;

for (const mode of ['crash', 'missing', 'malformed', 'invalid', 'fail', 'valid-but-crash', 'spawn-error', 'unverified', 'pass']) {
  test(`audit executor propagates ${mode} and preserves diagnostic evidence`, async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'dipanda-runner-regression-'));
    const preload = path.join(directory, 'fixture.mjs');
    await fs.writeFile(preload, fixture);
    // Ensure a failed rerun cannot leave a stale success masquerading as its report.
    await fs.writeFile(path.join(directory, 'webkit-https.json'), 'previous report evidence');
    await fs.writeFile(path.join(directory, 'webkit-https.txt'), 'previous log evidence');
    const child = spawn(process.execPath, ['scripts/run-local-consent-audit.mjs'], {
      env: { ...process.env, AUDIT_OUTPUT_DIR: directory, AUDIT_NODE: mode === 'spawn-error' ? path.join(directory, 'missing-runtime.exe') : process.execPath,
        AUDIT_ENGINES: 'webkit', AUDIT_TARGETS: 'https://127.0.0.1:4443', AUDIT_DIAGNOSTICS: '0',
        NODE_OPTIONS: '--import=' + pathToFileURL(preload).href, RUNNER_FIXTURE_MODE: mode },
      windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
    const exit = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
    const expectedSuccess = ['unverified', 'pass'].includes(mode);
    assert.equal(exit, expectedSuccess ? 0 : 1, output);
    const [run] = JSON.parse(await fs.readFile(path.join(directory, 'runs.json'), 'utf8'));
    assert.equal(run.status, mode === 'unverified' ? 'UNVERIFIED' : mode === 'pass' ? 'PASS' : mode === 'fail' ? 'FAIL' : 'ERROR');
    const log = await fs.readFile(path.join(directory, 'webkit-https.txt'), 'utf8');
    assert.match(log, mode === 'spawn-error' ? /ENOENT/ : /Synthetic diagnostic stderr/);
    if (!expectedSuccess && mode !== 'fail') assert.ok(run.errors.length > 0);
    const archive = (await fs.readdir(directory)).find(name => /^webkit-https\.previous-.*\.json$/.test(name));
    assert.equal(await fs.readFile(path.join(directory, archive), 'utf8'), 'previous report evidence');
    const report = await fs.readFile(path.join(directory, 'webkit-https.json'), 'utf8').catch(() => null);
    if (['crash', 'missing', 'spawn-error'].includes(mode)) assert.equal(report, null);
    if (mode === 'malformed') assert.equal(report, '{broken-json');
    if (mode === 'unverified') {
      assert.equal(JSON.parse(report).scenarios[0].status, 'UNVERIFIED');
      assert.equal(run.summary.unverified, 1);
      assert.equal(run.summary.passed, 0);
    }
  });
}
