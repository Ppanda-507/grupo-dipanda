import { createServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pages, renderPage } from '../src/pages.mjs';
import { assertProductionReady } from './production-readiness.mjs';
import { Readable } from 'node:stream';
import { createContactHandler } from './contact-handler.mjs';
import { securityHeaders, publicOrigin } from './security.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const production = process.argv.includes('--production');
const outputIndex = process.argv.indexOf('--output');
const assetRoot = outputIndex >= 0 ? path.resolve(process.argv[outputIndex + 1]) : path.join(root, production ? 'dist' : 'public');
try { process.loadEnvFile(path.join(root, '.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (production) assertProductionReady();
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT || 4173);
const hostIndex = process.argv.indexOf('--host');
const host = hostIndex >= 0 ? process.argv[hostIndex + 1] : process.env.HOST || '127.0.0.1';
const tlsEnabled = Boolean(process.env.TLS_KEY || process.env.TLS_CERT);
if (tlsEnabled && (production || !['127.0.0.1', 'localhost', '::1'].includes(host) || !process.env.TLS_KEY || !process.env.TLS_CERT)) throw new Error('Development TLS requires a loopback host, key and certificate, without --production.');
const protocol = tlsEnabled ? 'https:' : 'http:';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
const handleContact = createContactHandler({ local: !production });
async function contactRequest(request, response) {
  const origin = production ? publicOrigin(process.env.SITE_URL) : protocol + '//' + request.headers.host;
  if (!origin) { response.writeHead(503); response.end(); return; }
  const webRequest = new Request(origin + '/api/contact', { method: request.method, headers: request.headers, body: request.method === 'POST' ? Readable.toWeb(request) : undefined, duplex: 'half' });
  const result = await handleContact(webRequest, request.socket.remoteAddress);
  response.writeHead(result.status, Object.fromEntries(result.headers));
  response.end(await result.text());
}
const handler = async (request, response) => {
  for (const [key, value] of Object.entries(securityHeaders)) response.setHeader(key, value);
  try {
    const hostHeader = request.headers.host;
    const hostValid = typeof hostHeader === 'string' && /^[a-z0-9.:[\]_-]+(?::[0-9]+)?$/i.test(hostHeader);
    if (!hostValid || (production && hostHeader !== new URL(publicOrigin(process.env.SITE_URL)).host)) { response.writeHead(421); response.end(); return; }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/api/contact') { await contactRequest(request, response); return; }
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: pathname === '/api/contact' ? 'POST' : 'GET, HEAD' }); response.end(); return; }
    const route = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    if (pages[route]) {
      const html = production ? await readFile(path.join(assetRoot, route.slice(1), 'index.html')) : renderPage(route);
      response.writeHead(route === '/404' ? 404 : 200, { 'Content-Type': types['.html'] });
      response.end(request.method === 'HEAD' ? undefined : html);
      return;
    }
    const file = path.resolve(assetRoot, '.' + pathname);
    const relative = path.relative(assetRoot, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { response.writeHead(403); response.end(); return; }
    const details = await stat(file).catch(() => null);
    if (details?.isFile()) {
      const content = request.method === 'HEAD' ? undefined : await readFile(file);
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': production ? 'public, max-age=3600' : 'no-store' });
      response.end(content);
      return;
    }
    response.writeHead(404, { 'Content-Type': types['.html'] });
    response.end(request.method === 'HEAD' ? undefined : renderPage('/404'));
  } catch {
    if (response.headersSent) { response.destroy(); return; }
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Pedido inválido.');
  }
};
const server = tlsEnabled
  ? createHttpsServer({ key: await readFile(process.env.TLS_KEY), cert: await readFile(process.env.TLS_CERT), minVersion: 'TLSv1.2' }, handler)
  : createServer(handler);
server.headersTimeout = 15000;
server.requestTimeout = 20000;
server.keepAliveTimeout = 5000;
server.maxRequestsPerSocket = 100;
server.listen(port, host, () => console.log(`Dipanda: ${protocol}//${host}:${port}${production ? ' (production)' : ''}`));
