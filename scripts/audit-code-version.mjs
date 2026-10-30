import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export async function codeVersion() {
  const files = [];
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.posix.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) files.push(file);
    }
  }
  for (const directory of ['public', 'src', 'scripts', 'api', 'tests', 'deploy', '.github']) await walk(directory);
  files.push('package.json', 'package-lock.json', 'vercel.json', '.vercelignore', '.env.example', '.gitignore');
  const hashes = [];
  for (const file of files.sort()) hashes.push({ file, sha256: createHash('sha256').update(await fs.readFile(file)).digest('hex') });
  return {
    baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
    description: 'Working files, including staged/uncommitted changes. Base commit alone is not the tested version.',
    algorithm: 'SHA256 of UTF8 JSON.stringify(files), each file hashed as raw bytes; reports excluded to avoid recursion.',
    snapshot: createHash('sha256').update(JSON.stringify(hashes)).digest('hex'),
    files: hashes,
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('scripts/audit-code-version.mjs')) console.log(JSON.stringify(await codeVersion(), null, 2));
