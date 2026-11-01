import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { assertPublicAssetPath } from './public-artifacts.mjs';

const inspectable = new Set(['.css', '.js', '.svg']);
const assetExtension = /\.(?:avif|css|gif|ico|jpe?g|js|json|png|svg|ttf|webmanifest|webp|woff2?|xml)(?:[?#].*)?$/i;

function resolveReference(raw, owner, { module = false } = {}) {
  let reference = raw.trim().replaceAll('&amp;', '&');
  if (!reference || reference.startsWith('#') || reference.startsWith('data:')) {
    if (module) throw new Error(`Invalid browser module import in ${owner}`);
    return null;
  }
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference)) {
    if (module) throw new Error(`Browser modules must be local: ${owner}`);
    return null;
  }
  if (!module && !assetExtension.test(reference)) return null;
  if (module && !reference.startsWith('/') && !reference.startsWith('./') && !reference.startsWith('../')) throw new Error(`Unsupported bare browser module import in ${owner}`);
  reference = reference.split(/[?#]/, 1)[0];
  try { reference = decodeURIComponent(reference); }
  catch { throw new Error(`Invalid encoded project asset in ${owner}`); }
  if (reference.includes('\\')) throw new Error(`Invalid project asset path in ${owner}`);
  const segments = reference.startsWith('/') ? [] : path.posix.dirname(owner).split('/').filter(segment => segment !== '.');
  for (const segment of reference.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (!segments.length) throw new Error(`Project asset escapes public root: ${owner}`);
      segments.pop();
    } else segments.push(segment);
  }
  const resolved = segments.join('/');
  assertPublicAssetPath(resolved);
  if (module && path.posix.extname(resolved) !== '.js') throw new Error(`Unsupported browser module import: ${resolved}`);
  return resolved;
}

function dependencies(source, owner) {
  const found = new Set();
  const add = (reference, options) => { const resolved = resolveReference(reference, owner, options); if (resolved) found.add(resolved); };
  // Absolute asset literals also cover runtime fallbacks and every srcset candidate.
  for (const match of source.matchAll(/["'`]((?:\/|\.\/|\.\.\/)[^"'`\s<>]+)["'`]/g)) add(match[1]);
  for (const match of source.matchAll(/\b(?:src|href|xlink:href|poster)\s*=\s*["']([^"']+)["']/gi)) add(match[1]);
  for (const match of source.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(',')) add(candidate.trim().split(/\s+/, 1)[0]);
  }
  for (const match of source.matchAll(/\burl\(\s*["']?([^\s"')]+)["']?\s*\)/gi)) add(match[1]);
  if (owner.endsWith('.css')) for (const match of source.matchAll(/@import\s+["']([^"']+)["']/gi)) add(match[1]);
  if (owner.endsWith('.js')) {
    const imports = /(?:\bimport\s+(?!\()(?:(?:[^"'`;]*?\s+from\s*)?)|\bexport\s+(?:[^"'`;]*?\s+from\s*)|\bimport\s*\(\s*)(["'])([^"']+)\1/g;
    for (const match of source.matchAll(imports)) add(match[2], { module: true });
  }
  return found;
}

async function checkedResource(publicRoot, relative) {
  // lstat every component before reading: lexical containment alone permits symlinks.
  let current = publicRoot;
  const segments = relative.split('/');
  for (let index = 0; index < segments.length; index++) {
    current = path.join(current, segments[index]);
    const details = await lstat(current).catch(error => {
      if (['ENOENT', 'ENOTDIR'].includes(error.code)) throw new Error(`Project resource missing: /${relative}`);
      throw error;
    });
    if (details.isSymbolicLink()) throw new Error(`Symlink in project resource: /${relative}`);
    if (index < segments.length - 1 && !details.isDirectory()) throw new Error(`Invalid project resource directory: /${relative}`);
    if (index === segments.length - 1 && (!details.isFile() || details.size < 2)) throw new Error(`Project resource missing or empty: /${relative}`);
  }
  return current;
}

/** Validate the transitive browser dependency graph without executing browser modules. */
export async function assertProjectAssets(publicRoot, documents) {
  const rootDetails = await lstat(publicRoot);
  if (rootDetails.isSymbolicLink() || !rootDetails.isDirectory()) throw new Error('Project asset root must be a real directory.');
  const base = await realpath(publicRoot);
  const pending = [...documents].map(source => ({ source, owner: 'index.html' }));
  const resources = new Set();
  for (let index = 0; index < pending.length; index++) {
    const { source, owner } = pending[index];
    for (const relative of dependencies(source, owner)) {
      if (resources.has(relative)) continue;
      resources.add(relative);
      const file = await checkedResource(base, relative);
      if (inspectable.has(path.posix.extname(relative))) pending.push({ source: await readFile(file, 'utf8'), owner: relative });
    }
  }
  return resources.size;
}
