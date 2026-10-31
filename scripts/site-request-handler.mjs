import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { securityHeaders, publicOrigin } from './security.mjs';

export function sendErrorPage(response, status, method, renderPage) {
  let html;
  try { html = renderPage(`/${status}`); }
  catch {
    // Independent fallback: a rendering failure must not expose a stack trace
    // or depend on the same template that failed in the first place.
    html = '<!doctype html><html lang="pt-PT"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Não foi possível abrir a página — Dipanda</title><body><main><h1>Não foi possível abrir esta página.</h1><p>Tente novamente dentro de momentos.</p><a href="/">Voltar à Home</a></main></body></html>';
  }
  response.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
  response.end(method === 'HEAD' ? undefined : html);
}

export function createSiteRequestHandler({ assetRoot, production = false, pages, renderPage, contactRequest, siteUrl = '' }) {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8' };
  return async (request, response) => {
    for (const [key, value] of Object.entries(securityHeaders)) response.setHeader(key, value);
    let pathname;
    try {
      const host = request.headers.host;
      if (typeof host !== 'string' || !/^[a-z0-9.:[\]_-]+(?::[0-9]+)?$/i.test(host) || (production && host !== new URL(publicOrigin(siteUrl)).host)) {
        response.writeHead(421, { 'Cache-Control': 'no-store' }); response.end(); return;
      }
      pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname.includes('\0')) throw new URIError('Invalid URL');
      if (pathname === '/api/contact') { await contactRequest(request, response); return; }
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' }); response.end(); return;
      }
      const route = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
      if (pages[route]) {
        if (['/404','/500','/503'].includes(route)) { sendErrorPage(response, Number(route.slice(1)), request.method, renderPage); return; }
        const html = production ? await readFile(path.join(assetRoot, route.slice(1), 'index.html')) : renderPage(route);
        response.writeHead(200, { 'Content-Type': types['.html'] });
        response.end(request.method === 'HEAD' ? undefined : html); return;
      }
      const file = path.resolve(assetRoot, '.' + pathname);
      const relative = path.relative(assetRoot, file);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        response.writeHead(403, { 'Cache-Control': 'no-store' }); response.end(); return;
      }
      const details = await stat(file).catch(error => {
        if (['ENOENT','ENOTDIR'].includes(error.code)) return null;
        throw error;
      });
      if (details?.isFile()) {
        const content = request.method === 'HEAD' ? undefined : await readFile(file);
        response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': production ? 'public, max-age=3600' : 'no-store' });
        response.end(content); return;
      }
      sendErrorPage(response, 404, request.method, renderPage);
    } catch (error) {
      if (response.headersSent) { response.destroy(); return; }
      if (error instanceof URIError) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
        response.end(request.method === 'HEAD' ? undefined : 'Pedido inválido.'); return;
      }
      if (pathname === '/api/contact') {
        response.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        response.end(JSON.stringify({ ok: false, message: 'Não foi possível enviar o pedido. Tente novamente mais tarde.' })); return;
      }
      sendErrorPage(response, 500, request.method, renderPage);
    }
  };
}
