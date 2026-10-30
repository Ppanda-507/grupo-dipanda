import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { codeVersion } from './audit-code-version.mjs';

const directory = 'reports/local-audit-2026-10-29';
const runtime = process.env.AUDIT_NODE || process.execPath;
await fs.mkdir(directory, { recursive: true });
const version = await codeVersion();
await fs.writeFile(path.join(directory, 'code-version.json'), JSON.stringify(version, null, 2));
await fs.writeFile(path.join(directory, 'consent.js.diff'), execFileSync('git', ['diff', 'HEAD', '--', 'public/js/consent.js']));
for (const [name, args, env] of [
  ['unit-tests.txt', ['--test', 'tests/*.test.mjs'], {}],
  ['build.txt', ['scripts/build.mjs', '--output', path.join(os.tmpdir(), 'dipanda-site-dist')], {}],
  ['https-transport.json', ['scripts/check-local-https.mjs'], { TEST_URL: 'https://127.0.0.1:4443', TLS_CERT: path.join(os.tmpdir(), 'dipanda-local-tls/localhost-cert.pem') }],
]) {
  const child = spawn(runtime, args, { env: { ...process.env, ...env }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
  const exit = await new Promise(resolve => { child.on('error', error => { stderr += error.stack; resolve(null); }); child.on('exit', resolve); });
  await fs.writeFile(path.join(directory, name), stdout + (name.endsWith('.json') ? '' : stderr));
  await fs.writeFile(path.join(directory, name + '.meta.json'), JSON.stringify({ runtime, args, exit, stderr, snapshot: version.snapshot, date: new Date().toISOString() }, null, 2));
  console.log(name + ': exit=' + exit);
  if (exit !== 0) process.exitCode = 1;
}
