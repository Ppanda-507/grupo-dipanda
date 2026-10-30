// Run from the repository root. Pattern scan; never print candidate secret values.
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const version = JSON.parse(await fs.readFile('reports/local-audit-2026-10-29/code-version.json', 'utf8'));
const rules = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['service-api-key', /\b(?:re_[A-Za-z0-9]{24,}|sk_(?:live_|test_)?[A-Za-z0-9]{24,})\b/],
  ['credential-url', /https?:\/\/[^\s/:]+:[^\s/@]+@[^\s/]+/],
];
const candidates = [];
const scan = (file, content, source) => content.split('\n').forEach((line, index) => {
  for (const [rule, pattern] of rules) if (pattern.test(line)) candidates.push({ source, file, line: index + 1, rule, value: '[REDACTED]' });
});
const files = version.files.map(v => v.file).filter(f => /\.(?:m?js|json|md|yml|yaml|css|svg|html|txt)$/.test(f) || f.endsWith('.env.example'));
files.push('README.md');
if (await fs.stat('.env').catch(() => null)) files.push('.env');
for (const file of files) scan(file, await fs.readFile(file, 'utf8'), 'working-tree');
const history = execFileSync('git', ['log', '--all', '--format=', '-p', '--root', '--', 'public', 'src', 'scripts', 'api', 'tests', 'deploy', 'package.json', 'package-lock.json', '.env.example', '.github', 'vercel.json', 'README.md'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
scan('git log --all -p (scoped paths)', history, 'reachable-history');
const triage = candidates.map(candidate => ({ ...candidate, classification: candidate.source === 'working-tree' && candidate.file === 'tests/security.test.mjs' && candidate.line === 104 && candidate.rule === 'credential-url' ? 'Verified false positive: deliberate synthetic URL-credential rejection fixture, .test domain; no real credential.' : 'Needs review' }));
console.log(JSON.stringify({ date: new Date().toISOString(), snapshot: version.snapshot, fileCount: files.length, rules: rules.map(([name]) => name), candidates: triage, scope: 'Dipanda manifest plus README and reachable Git history in named paths. Excludes casaspanda, browser profiles, reports and binary assets. Pattern scan is not proof of absence; no external scanner or source upload.', certificateKey: 'Development TLS private key is in OS TEMP, outside the project and report bundle.' }, null, 2));
