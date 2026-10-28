import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { assertProjectAssets } from '../scripts/project-assets.mjs';

test('packaging requires local fonts and every responsive image, including empty files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dipanda-assets-test-'));
  try {
    for (const folder of ['css', 'js', 'fonts', 'assets']) await mkdir(path.join(root, folder));
    await writeFile(path.join(root, 'css', 'site.css'), "@font-face{src:url('/fonts/body.woff2')}");
    await writeFile(path.join(root, 'assets', 'small.png'), 'image');
    await writeFile(path.join(root, 'assets', 'large.png'), '');
    const documents = ['<img src="/assets/small.png" srcset="/assets/small.png 320w, /assets/large.png 960w">'];
    await assert.rejects(assertProjectAssets(root, documents), error => {
      assert.match(error.message, /\/fonts\/body\.woff2/);
      assert.match(error.message, /\/assets\/large\.png/);
      return true;
    });
    await writeFile(path.join(root, 'fonts', 'body.woff2'), 'font');
    await writeFile(path.join(root, 'assets', 'large.png'), 'image');
    assert.equal(await assertProjectAssets(root, documents), 3);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
