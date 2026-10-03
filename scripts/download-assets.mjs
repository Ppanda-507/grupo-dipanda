import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.resolve(root, 'public/assets/figma');
if (path.relative(root, target) !== path.join('public', 'assets', 'figma')) throw new Error('Invalid asset directory');
await mkdir(target, { recursive: true });
const manifest = JSON.parse(await readFile(new URL('./assets.json', import.meta.url), 'utf8'));
const items = Object.values(manifest).flat();
const results = [];
for (let i = 0; i < items.length; i += 4) {
  results.push(...await Promise.all(items.slice(i, i + 4).map(async asset => {
    const response = await fetch(asset.url, { signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error(`Asset ${asset.file}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length) throw new Error(`Empty asset: ${asset.file}`);
    await writeFile(path.join(target, asset.file), bytes);
    return { file: asset.file, bytes: bytes.length };
  })));
}
console.log(JSON.stringify(results));
