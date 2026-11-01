import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { codeVersion, projectRoot } from './audit-code-version.mjs';
import { auditDirectory, writeEvidence } from './output.mjs';

const directory = await auditDirectory('local-evidence');
const runtime = process.env.AUDIT_NODE || process.execPath;
const version = await codeVersion();
await writeEvidence(path.join(directory, 'capture-code-version.json'), JSON.stringify(version, null, 2));
console.log('Evidence directory: ' + directory);
// Share the build command's explicitly allowed temporary output location.
const buildOutput = path.join(os.tmpdir(), 'dipanda-site-dist');
const commands = [
  ['unit-tests.txt', ['--test', 'tests/unit/*.test.mjs', 'tests/integration/*.test.mjs'], {}],
  ['build.txt', ['scripts/build.mjs', '--output', buildOutput], {}],
];
if (process.env.AUDIT_TLS_CERT) commands.push(['https-transport.json', ['scripts/audit/check-local-https.mjs'], { TEST_URL: process.env.AUDIT_HTTPS_URL || 'https://127.0.0.1:4443', TLS_CERT: process.env.AUDIT_TLS_CERT }]);
else await writeEvidence(path.join(directory, 'https-transport.meta.json'), JSON.stringify({ status: 'NOT_APPLICABLE', reason: 'No AUDIT_TLS_CERT supplied. No HTTPS transport test was executed.', snapshot: version.snapshot }, null, 2));
for (const [name, args, env] of commands) {
  const output = path.join(directory, name);
  await writeEvidence(output, '');
  const child = spawn(runtime, args, { cwd: projectRoot, env: { ...process.env, ...env }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; child.kill(); }, 300000);
  child.on('error', error => { stderr += error.stack; });
  const exit = await new Promise(resolve => child.on('close', resolve));
  clearTimeout(timer);
  await fs.writeFile(output, stdout + (name.endsWith('.json') ? '' : stderr));
  await writeEvidence(path.join(directory, name + '.meta.json'), JSON.stringify({ runtime, args, exit, timedOut, stderr, snapshot: version.snapshot, date: new Date().toISOString() }, null, 2));
  console.log(name + ': exit=' + exit);
  if (exit !== 0 || timedOut) process.exitCode = 1;
}
if ((await codeVersion()).snapshot !== version.snapshot) throw Error('Code changed during capture; these results cannot validate the final version.');
