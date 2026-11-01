import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { assertPublicAssetPath, assertPublicFiles, assertDistFiles } from '../../scripts/public-artifacts.mjs';
import { assertProjectAssets } from '../../scripts/project-assets.mjs';

async function fixture(t, entries) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dipanda-artifacts-'));
  t.after(async () => {
    if (path.dirname(root) !== path.resolve(os.tmpdir()) || !path.basename(root).startsWith('dipanda-artifacts-')) throw new Error('Unsafe fixture cleanup path.');
    await rm(root, { recursive: true, force: true });
  });
  for (const [file, content] of Object.entries(entries)) await put(root, file, content);
  return root;
}

async function put(root, relative, content) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}

const manifest = files => ({ version: 1, files });
const minimal = { 'js/app.js': 'export {};', 'fonts/LICENSE-test.txt': 'Test fixture license.' };

test('public manifest permits exactly its assets and distribution notices', async t => {
  const root = await fixture(t, minimal);
  assert.deepEqual(await assertPublicFiles(root, { manifest: manifest(Object.keys(minimal)) }), Object.keys(minimal).sort());
});

test('public artifact rejects unexpected files and empty directories', async t => {
  const root = await fixture(t, { ...minimal, 'js/old.js': 'export {};' });
  await assert.rejects(assertPublicFiles(root, { manifest: manifest(Object.keys(minimal)) }), /Unexpected file/);
  await rm(path.join(root, 'js/old.js'));
  await mkdir(path.join(root, 'unused'));
  await assert.rejects(assertPublicFiles(root, { manifest: manifest(Object.keys(minimal)) }), /Unexpected directory/);
});

test('manifest rejects missing files, empty resources and duplicate entries', async t => {
  const root = await fixture(t, minimal);
  await assert.rejects(assertPublicFiles(root, { manifest: manifest([...Object.keys(minimal), 'js/missing.js']) }), /missing/);
  await put(root, 'js/app.js', '');
  await assert.rejects(assertPublicFiles(root, { manifest: manifest(Object.keys(minimal)) }), /Empty resource/);
  await assert.rejects(assertPublicFiles(root, { manifest: manifest(['js/app.js', 'js/app.js']) }), /Duplicate/);
});

test('private paths, source maps, dotfiles and traversal cannot be allowlisted', () => {
  for (const file of ['.env', 'assets/.env', 'server/contact.js', 'scripts/build.js', 'src/site.js', 'tests/cookies.js', 'reports/result.json', 'config/settings.json', 'node_modules/library.js', 'assets/private.pem', 'js/app.js.map', 'assets/credentials.json', '../escape.js', 'assets/../app.js', 'C:/escape.js', 'assets\\image.png']) {
    assert.throws(() => assertPublicAssetPath(file), /Invalid|Private|Unsupported/, file);
  }
});

test('private text material is rejected without repeating its contents', async t => {
  const marker = 'synthetic-fixture-password-DO-NOT-LOG';
  const root = await fixture(t, { 'js/app.js': `const SMTP_PASSWORD = '${marker}';` });
  await assert.rejects(assertPublicFiles(root, { manifest: manifest(['js/app.js']) }), error => /Private material/.test(error.message) && !error.message.includes(marker));
  await put(root, 'js/app.js', '-----BEGIN PRIVATE KEY-----\nSYNTHETIC FIXTURE ONLY');
  await assert.rejects(assertPublicFiles(root, { manifest: manifest(['js/app.js']) }), /Private material/);
});

test('directory symlinks are rejected by both artifact and graph validation', async t => {
  const root = await fixture(t, { 'target/app.js': 'export {};' });
  await symlink(path.join(root, 'target'), path.join(root, 'js'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(assertPublicFiles(root, { manifest: manifest(['js/app.js', 'target/app.js']) }), /Symlink/);
  await assert.rejects(assertProjectAssets(root, ['<script type="module" src="/js/app.js"></script>']), /Symlink/);
});

test('dist accepts only assets, generated route pages and three error documents', async t => {
  const root = await fixture(t, {
    ...minimal,
    'index.html': '<!doctype html><title>Home fixture</title>',
    'servicos/index.html': '<!doctype html><title>Services fixture</title>',
    '404.html': '<!doctype html><title>404 fixture</title>',
    '500.html': '<!doctype html><title>500 fixture</title>',
    '503.html': '<!doctype html><title>503 fixture</title>'
  });
  assert.equal(await assertDistFiles(root, ['/', '/servicos'], Object.keys(minimal)), 7);
  await put(root, 'unexpected.html', '<title>Unlisted fixture</title>');
  await assert.rejects(assertDistFiles(root, ['/', '/servicos'], Object.keys(minimal)), /Unexpected file/);
});

test('dist rejects private copied material and invalid routes', async t => {
  const root = await fixture(t, { 'server/contact.js': 'export {};' });
  await assert.rejects(assertDistFiles(root, ['/'], []), /Private/);
  for (const route of ['/../escape', '/server', '/a?b', '/a\\b']) await assert.rejects(assertDistFiles(root, [route], []), /Invalid|Private/);
});

const graphFiles = {
  'css/site.css': '@import "./nested/theme.css"; body{background:url(../assets/background.png)}',
  'css/nested/theme.css': '@font-face{font-family:Fixture;src:url("../../fonts/test.woff2")}',
  'js/app.js': 'import "./consent.js"; export { value } from "./shared.js"; const next = () => import("./lazy.js"); const fallback = "/assets/fallback.gif";',
  'js/consent.js': 'import { value } from "./shared.js"; export const consent = value;',
  'js/shared.js': 'export const value = 1;',
  'js/lazy.js': 'export default 1;',
  'assets/picture.svg': '<svg><use href="./symbols.svg#fixture"/></svg>',
  'assets/symbols.svg': '<svg><symbol id="fixture"/></svg>',
  'assets/background.png': 'synthetic image fixture',
  'assets/fallback.gif': 'synthetic animation fixture',
  'assets/preview-320.png': 'synthetic image fixture',
  'assets/preview-640.png': 'synthetic image fixture',
  'fonts/test.woff2': 'synthetic font fixture'
};
const document = '<link rel="stylesheet" href="/css/site.css?v=1"><script type="module" src="/js/app.js"></script><img src="/assets/picture.svg" srcset="/assets/preview-320.png 320w, /assets/preview-640.png 640w"><a href="/contacto/">Contact</a>';

test('dependency graph follows ESM imports/reexports/dynamic imports, CSS, SVG and srcset', async t => {
  const root = await fixture(t, graphFiles);
  assert.equal(await assertProjectAssets(root, [document]), Object.keys(graphFiles).length);
});

test('missing transitive ESM import fails instead of passing the build', async t => {
  const root = await fixture(t, graphFiles);
  await rm(path.join(root, 'js/shared.js'));
  await assert.rejects(assertProjectAssets(root, [document]), /missing: \/js\/shared\.js/);
});

test('missing nested CSS or srcset candidate fails the graph check', async t => {
  const root = await fixture(t, graphFiles);
  await rm(path.join(root, 'fonts/test.woff2'));
  await assert.rejects(assertProjectAssets(root, [document]), /missing: \/fonts\/test\.woff2/);
  await put(root, 'fonts/test.woff2', 'synthetic font fixture');
  await rm(path.join(root, 'assets/preview-640.png'));
  await assert.rejects(assertProjectAssets(root, [document]), /missing: \/assets\/preview-640\.png/);
});

test('browser imports cannot reach private directories, bare packages or remote modules', async t => {
  const root = await fixture(t, { 'js/app.js': 'export {};' });
  for (const specifier of ['../server/security.mjs', '../scripts/security.js', 'node:fs', 'nodemailer', 'https://example.invalid/module.js', '../../escape.js', '/%2e%2e/escape.js']) {
    await put(root, 'js/app.js', `import ${JSON.stringify(specifier)};`);
    await assert.rejects(assertProjectAssets(root, ['<script type="module" src="/js/app.js"></script>']), /Private|Unsupported|local|escapes/, specifier);
  }
});

test('fragments, embedded images and external hyperlinks do not become local resources', async t => {
  const root = await fixture(t, { 'assets/picture.svg': '<svg><use href="#fixture"/></svg>' });
  assert.equal(await assertProjectAssets(root, ['<img src="/assets/picture.svg"><img src="data:image/svg+xml;base64,PHN2Zy8+"><a href="https://example.invalid/information.pdf">Reference</a>']), 1);
});
