import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';

const publicExtensions = new Set(['.avif', '.css', '.gif', '.ico', '.jpeg', '.jpg', '.js', '.json', '.png', '.svg', '.ttf', '.txt', '.webmanifest', '.webp', '.woff', '.woff2', '.xml']);
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt', '.webmanifest', '.xml']);
const privateSegments = /^(?:api|server|scripts|src|tests?|reports?|docs?|config|node_modules|coverage|backups?|\.git|\.env)$/i;
const privateNames = /^(?:package(?:-lock)?\.json|vercel\.json|AGENTS\.md|credentials?(?:\..+)?|secrets?(?:\..+)?|id_(?:rsa|ed25519)(?:\..+)?)$/i;

function assertSegments(relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || !/^[a-zA-Z0-9_./-]+$/.test(relative) || path.posix.isAbsolute(relative)) throw new Error(`Invalid public path: ${relative}`);
  const segments = relative.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..' || segment.startsWith('.') || privateSegments.test(segment) || privateNames.test(segment))) throw new Error(`Private or invalid path in public artifact: ${relative}`);
}

export function assertPublicAssetPath(relative, { allowHtml = false } = {}) {
  assertSegments(relative);
  const extension = path.posix.extname(relative).toLowerCase();
  if (!publicExtensions.has(extension) && !(allowHtml && extension === '.html')) throw new Error(`Unsupported file in public artifact: ${relative}`);
  return relative;
}

function assertTextSafe(content, relative) {
  // Report only a filename: never include a detected credential in build logs.
  if (/-----BEGIN (?:[A-Z ]*PRIVATE KEY|CERTIFICATE)-----/.test(content) || /(?:SMTP_PASSWORD|SMTP_PASS|RESEND_API_KEY|UPSTASH_REDIS_REST_TOKEN|RATE_LIMIT_KEY_SECRET)\s*["']?\s*[:=]\s*["']?[^\s"'`,;}]+/.test(content)) throw new Error(`Private material detected in public artifact: ${relative}`);
}

async function checkedRoot(root) {
  const absolute = path.resolve(root);
  const details = await lstat(absolute);
  if (details.isSymbolicLink() || !details.isDirectory()) throw new Error('Public artifact root must be a real directory.');
  return realpath(absolute);
}

async function inspectTree(root, expected, { allowHtml = false } = {}) {
  const base = await checkedRoot(root);
  const directories = new Set();
  for (const file of expected) {
    assertPublicAssetPath(file, { allowHtml });
    const segments = file.split('/');
    for (let index = 1; index < segments.length; index++) directories.add(segments.slice(0, index).join('/'));
  }
  const found = [];
  async function visit(relative = '') {
    for (const entry of await readdir(path.join(base, relative), { withFileTypes: true })) {
      const current = relative ? `${relative}/${entry.name}` : entry.name;
      assertSegments(current);
      const file = path.join(base, current);
      const details = await lstat(file);
      if (details.isSymbolicLink()) throw new Error(`Symlinks are not allowed in public artifacts: ${current}`);
      if (details.isDirectory()) {
        if (!directories.has(current)) throw new Error(`Unexpected directory in public artifact: ${current}`);
        await visit(current);
        continue;
      }
      assertPublicAssetPath(current, { allowHtml });
      if (!details.isFile() || !expected.has(current)) throw new Error(`Unexpected file in public artifact: ${current}`);
      if (details.size < 2) throw new Error(`Empty resource in public artifact: ${current}`);
      if (textExtensions.has(path.posix.extname(current).toLowerCase())) assertTextSafe(await readFile(file, 'utf8'), current);
      found.push(current);
    }
  }
  await visit();
  const missing = [...expected].filter(file => !found.includes(file));
  if (missing.length) throw new Error(`Files missing from public artifact:\n${missing.join('\n')}`);
  return found.sort();
}

/** Return the exact files allowed to be copied; an explicit manifest also supports isolated fixtures. */
export async function assertPublicFiles(publicRoot, { manifest } = {}) {
  const configured = manifest ?? JSON.parse(await readFile(new URL('../config/public-assets.json', import.meta.url), 'utf8'));
  if (configured?.version !== 1 || !Array.isArray(configured.files) || !configured.files.length) throw new Error('Invalid public asset manifest.');
  const expected = new Set(configured.files.map(file => assertPublicAssetPath(file)));
  if (expected.size !== configured.files.length) throw new Error('Duplicate entries in public asset manifest.');
  return inspectTree(publicRoot, expected);
}

/** Check the complete publication output, including generated pages and standalone error pages. */
export async function assertDistFiles(output, routes, assets) {
  const expected = new Set(assets.map(file => assertPublicAssetPath(file)));
  for (const route of routes) {
    if (typeof route !== 'string' || !route.startsWith('/') || /[?#\\]/.test(route)) throw new Error(`Invalid generated route: ${route}`);
    const relative = route === '/' ? '' : route.replace(/^\//, '').replace(/\/$/, '');
    if (relative) assertSegments(relative);
    const file = relative ? `${relative}/index.html` : 'index.html';
    if (expected.has(file)) throw new Error(`Generated page collides with a public asset: ${file}`);
    expected.add(file);
  }
  for (const status of ['404', '500', '503']) expected.add(`${status}.html`);
  return (await inspectTree(output, expected, { allowHtml: true })).length;
}
