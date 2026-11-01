import { lstat, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const project = fileURLToPath(new URL('../../', import.meta.url));

export async function assertAssetRoot(directory, projectRoot = project) {
  const absolute = path.resolve(directory);
  const allowed = [path.resolve(projectRoot, 'public'), path.resolve(projectRoot, 'dist'), path.join(os.tmpdir(), 'dipanda-site-dist')];
  if (!allowed.includes(absolute)) throw new Error('Asset root must be public/, dist/, or the dedicated temporary dipanda-site-dist folder.');
  const info = await lstat(absolute);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Asset root must be a real directory.');
  const resolved = await realpath(absolute);
  const normalize = value => process.platform === 'win32' ? value.toLowerCase() : value;
  if (normalize(resolved) !== normalize(absolute)) throw new Error('Asset root must not pass through a symbolic link.');
  return resolved;
}
