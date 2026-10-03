import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { pages, renderPage } from '../src/pages.mjs';
import { validateContact, sendContact } from './contact.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const production = process.argv.includes('--production');
const outputIndex = process.argv.indexOf('--output');
const assetRoot = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : path.join(root, production ? 'dist' : 'public');
try { process.loadEnvFile(path.join(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 4173);
const hostIndex = process.argv.indexOf('--host');
const host = hostIndex >= 0 ? process.argv[hostIndex + 1] : process.env.HOST || '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
const contacts = new Map();
async function contactRequest(request, response) {
  const reply = (status, message) => { response.writeHead(status, { 'Content-Type': types['.json'], 'Cache-Control': 'no-store' }); response.end(JSON.stringify({ message })); };
  const origin = request.headers.origin;
  if (origin && new URL(origin).host !== request.headers.host) return reply(403, 'Origem do pedido inválida.');
  const address = request.socket.remoteAddress;
  const now = Date.now();
  for (const [key, value] of contacts) if (now - value.start > 900000) contacts.delete(key);
  const rate = contacts.get(address) || { start: now, count: 0 };
  if (rate.count >= 6) return reply(429, 'Foram enviados vários pedidos. Aguarde alguns minutos antes de tentar novamente.');
  let size = 0, chunks = [];
  for await (const chunk of request) { size += chunk.length; if (size > 32768) return reply(413, 'A mensagem é demasiado longa.'); chunks.push(chunk); }
  let body;
  try {
    const text = Buffer.concat(chunks).toString('utf8');
    body = request.headers['content-type']?.includes('application/json') ? JSON.parse(text) : Object.fromEntries(new URLSearchParams(text));
  } catch { return reply(400, 'Pedido inválido.'); }
  const result = validateContact(body, now);
  if (result.error) return reply(400, result.error);
  rate.count++; contacts.set(address, rate);
  const sent = await sendContact(result.value);
  reply(sent.status, sent.message);
}
const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/api/contact' && request.method === 'POST') { await contactRequest(request, response); return; }
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: pathname === '/api/contact' ? 'POST' : 'GET, HEAD' }); response.end(); return; }
    const route = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    if (pages[route]) {
      response.writeHead(route === '/404' ? 404 : 200, { 'Content-Type': types['.html'] });
      const html = production ? await readFile(path.join(assetRoot, route.slice(1), 'index.html')) : renderPage(route);
      response.end(request.method === 'HEAD' ? undefined : html);
      return;
    }
    let file = path.resolve(assetRoot, '.' + pathname);
    const relative = path.relative(assetRoot, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { response.writeHead(403); response.end(); return; }
    let details = await stat(file).catch(() => null);
    if (!production && (!details?.isFile() || details.size < 2)) {
      const fallback = pathname.startsWith('/assets/figma/') ? path.join(os.tmpdir(), 'dipanda-site-assets') : pathname.startsWith('/assets/process/') ? path.join(os.tmpdir(), 'dipanda-process-assets') : pathname.startsWith('/assets/hero/') ? path.join(os.tmpdir(), 'dipanda-hero-assets') : pathname.startsWith('/fonts/') ? path.join(os.tmpdir(), 'dipanda-site-fonts') : null;
      if (fallback && path.basename(pathname) === pathname.split('/').pop() && !pathname.includes('..')) { file = path.join(fallback, path.basename(pathname)); details = await stat(file).catch(() => null); }
    }
    if (details?.isFile()) {
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': production ? 'public, max-age=3600' : 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : await readFile(file));
      return;
    }
    response.writeHead(404, { 'Content-Type': types['.html'] });
    response.end(request.method === 'HEAD' ? undefined : renderPage('/404'));
  } catch {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Pedido inválido.');
  }
});
server.listen(port, host, () => console.log(`Dipanda: http://${host}:${port}${production ? ' (production)' : ''}`));
