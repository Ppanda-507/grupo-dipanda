import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { codeVersion } from './audit-code-version.mjs';

// The parent only orchestrates files. AUDIT_NODE selects the runtime executing tests.
const runtime = process.env.AUDIT_NODE || process.execPath;
const directory = process.env.AUDIT_OUTPUT_DIR || 'reports/local-audit-2026-10-29';
await fs.mkdir(directory, { recursive: true });
const version = await codeVersion();
await fs.writeFile(path.join(directory, 'code-version.json'), JSON.stringify(version, null, 2));
const engines = (process.env.AUDIT_ENGINES || 'chromium,firefox,webkit').split(',');
const targets = (process.env.AUDIT_TARGETS || 'http://127.0.0.1:4173,https://127.0.0.1:4443').split(',');
const runs = [];
let failed = false;
async function archivePrevious(label) {
  const id = randomUUID();
  for (const extension of ['json', 'txt']) {
    const file = path.join(directory, `${label}.${extension}`);
    try { await fs.rename(file, path.join(directory, `${label}.previous-${id}.${extension}`)); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
function validateReport(result, engine, origin) {
  const keys = { PASS: 'passed', FAIL: 'failed', UNVERIFIED: 'unverified', NOT_APPLICABLE: 'notApplicable' };
  if (!result || result.engine !== engine || result.origin !== origin || result.version?.snapshot !== version.snapshot ||
      !Array.isArray(result.scenarios) || !result.scenarios.length ||
      result.scenarios.some(row => !row || typeof row.id !== 'string' || !Object.hasOwn(keys, row.status))) throw new Error('Invalid report identity or scenarios.');
  const counts = { scenarios: result.scenarios.length, passed: 0, failed: 0, unverified: 0, notApplicable: 0 };
  for (const row of result.scenarios) counts[keys[row.status]]++;
  if (Object.entries(counts).some(([key, value]) => result.summary?.[key] !== value)) throw new Error('Invalid or inconsistent report summary.');
}
if (process.env.AUDIT_DIAGNOSTICS === '1') {
  await archivePrevious('profile-diagnostic-unrestricted');
  const child = spawn(runtime, ['scripts/diagnose-browser-profile.mjs'], { env: { ...process.env, BROWSER_ENGINE: 'chromium', PROFILE_DEBUG: '1', DEBUG: 'pw:browser' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
  child.on('error', error => { stderr += error.stack || String(error); });
  const exit = await new Promise(resolve => child.on('close', resolve));
  await fs.writeFile(path.join(directory, 'profile-diagnostic-unrestricted.json'), stdout);
  await fs.writeFile(path.join(directory, 'profile-diagnostic-unrestricted.txt'), stderr);
  if (exit !== 0) failed = true;
}
for (const origin of targets) for (const engine of engines) {
  const label = `${engine}-${new URL(origin).protocol.slice(0, -1)}`;
  await archivePrevious(label);
  const temporary = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'dipanda-consent-run-')), label + '.json');
  let log = '';
  console.log(`Starting ${label}`);
  const startedAt = new Date().toISOString();
  const child = spawn(runtime, ['scripts/check-consent-storage.mjs'], {
    env: { ...process.env, BROWSER_ENGINE: engine, TEST_URL: origin, DIPANDA_CONSENT_REPORT: temporary, AUDIT_VERSION: path.resolve(directory, 'code-version.json') }, windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', data => { log += data; process.stdout.write(data); });
  child.stderr.on('data', data => { log += data; process.stderr.write(data); });
  let timedOut = false, signal = null, executionError = null;
  const timeout = setTimeout(() => { timedOut = true; child.kill(); }, 300000);
  child.on('error', error => { executionError = error.stack || String(error); });
  // close waits for stdio after exit/error, preserving complete diagnostic output.
  const exit = await new Promise(resolve => child.on('close', (code, value) => { signal = value; resolve(code); }));
  clearTimeout(timeout);
  let result, reportPath = null;
  const errors = [];
  if (exit !== 0) errors.push(`Subprocess exit: ${exit}`);
  if (signal) errors.push(`Subprocess signal: ${signal}`);
  if (timedOut) errors.push('Subprocess timed out.');
  if (executionError) errors.push(executionError);
  try {
    const raw = await fs.readFile(temporary);
    reportPath = path.join(directory, label + '.json');
    // Keep malformed reports byte-for-byte too; parsing must not discard evidence.
    await fs.writeFile(reportPath, raw);
    result = JSON.parse(raw.toString('utf8'));
    validateReport(result, engine, origin);
  } catch (error) { errors.push(`Report missing or invalid: ${error.message}`); }
  const status = errors.length ? 'ERROR' : result.summary.failed ? 'FAIL' : result.summary.unverified ? 'UNVERIFIED' : 'PASS';
  if (status === 'ERROR' || status === 'FAIL') failed = true;
  if (errors.length) log += '\n[executor]\n' + errors.join('\n') + '\n';
  await fs.writeFile(path.join(directory, label + '.txt'), log);
  runs.push({ label, origin, engine, startedAt, finishedAt: new Date().toISOString(), exit, signal, timedOut, summary: result?.summary, status, errors, reportPath, temporary, snapshot: version.snapshot });
  await fs.writeFile(path.join(directory, 'runs.json'), JSON.stringify(runs, null, 2));
}
const after = await codeVersion();
if (after.snapshot !== version.snapshot) throw new Error('Code changed during the run; regenerate results.');
console.log(JSON.stringify(runs, null, 2));
if (failed) process.exitCode = 1;
