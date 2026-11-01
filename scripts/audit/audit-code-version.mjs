import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export async function codeVersion() {
  const files = [];
  async function walk(directory, required = false) {
    let entries;
    try { entries = await fs.readdir(path.join(projectRoot, directory), { withFileTypes: true }); }
    catch (error) { if (!required && error.code === 'ENOENT') return; throw error; }
    for (const entry of entries) {
      const file = path.posix.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile() && file !== 'docs/refactor/validation.md') files.push(file);
    }
  }
  await walk('public', true);
  await walk('src', true);
  for (const directory of ['server', 'scripts', 'api', 'tests', 'config', 'docs', 'deploy', '.github']) await walk(directory);
  for (const file of ['package.json', 'package-lock.json', 'vercel.json', '.vercelignore', '.env.example', '.gitignore', 'README.md']) {
    if ((await fs.stat(path.join(projectRoot, file)).catch(error => { if (error.code === 'ENOENT') return null; throw error; }))?.isFile()) files.push(file);
  }
  const hashes = [];
  for (const file of files.sort()) hashes.push({ file, sha256: createHash('sha256').update(await fs.readFile(path.join(projectRoot, file))).digest('hex') });
  return {
    baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', cwd: projectRoot }).trim(),
    branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8', cwd: projectRoot }).trim(),
    description: 'Working files, including staged/uncommitted changes. Base commit alone is not the tested version.',
    algorithm: 'SHA256 of UTF8 JSON.stringify(files), each file hashed as raw bytes. Generated reports (including docs/refactor/validation.md), .env, keys, profiles, dependencies and build output excluded.',
    snapshot: createHash('sha256').update(JSON.stringify(hashes)).digest('hex'),
    files: hashes,
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await codeVersion(), null, 2));
