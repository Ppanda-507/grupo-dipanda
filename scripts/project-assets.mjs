import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

// Check every generated page and local stylesheet/script before packaging.
// A missing resource must fail the build, rather than rely on temporary files.
export async function assertProjectAssets(publicRoot, documents) {
  const sources = [...documents];
  for (const folder of ['css', 'js']) {
    for (const file of await readdir(path.join(publicRoot, folder))) {
      if (/\.(css|js)$/.test(file)) sources.push(await readFile(path.join(publicRoot, folder, file), 'utf8'));
    }
  }
  const resources = new Set();
  const pattern = /\/(?:assets|fonts|css|js)\/[^"'()\s<>`,]+?\.(?:png|jpe?g|webp|avif|gif|svg|woff2?|ttf|css|js|json)(?=[?#"'()\s<>`,]|$)/g;
  for (const source of sources) {
    for (const match of source.matchAll(pattern)) resources.add(match[0]);
  }
  const missing = [];
  for (const resource of resources) {
    const file = path.resolve(publicRoot, '.' + resource);
    const relative = path.relative(publicRoot, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Invalid project asset: ${resource}`);
    const details = await stat(file).catch(() => null);
    if (!details?.isFile() || details.size < 2) missing.push(resource);
  }
  if (missing.length) throw new Error(`Project resources missing from public/:\n${missing.join('\n')}`);
  return resources.size;
}
