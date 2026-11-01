import { createServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pages, renderPage } from '../../src/pages/index.mjs';
import { createSiteRequestHandler } from '../../server/http/site-request-handler.mjs';
import { createContactHandler } from '../../server/contact/handler.mjs';

export const FIXTURE_HEADER = 'x-dipanda-audit-fixture';
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

// Dedicated loopback server. Never loads .env, SMTP, provider credentials or
// production services. Even valid form submissions use this injected sender.
export async function startAuditServer({ port = 0, host = '127.0.0.1', key, cert, contactEnabled = true, sendStatus = 200 } = {}) {
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) throw Error('The audit fixture only binds to loopback.');
  if (Boolean(key) !== Boolean(cert)) throw Error('Audit HTTPS requires both a development key and certificate.');
  const protocol = key ? 'https:' : 'http:';
  const environment = { CONTACT_ENABLED: contactEnabled ? 'true' : 'false' };
  const contact = createContactHandler({ environment, local: true, send: async () => ({ status: sendStatus, message: 'Resposta simulada da auditoria local. Nenhum e-mail foi enviado.' }) });
  async function contactRequest(request, response) {
    const origin = `${protocol}//${request.headers.host}`;
    const webRequest = new Request(origin + '/api/contact', {
      method: request.method, headers: request.headers,
      ...(request.method === 'POST' ? { body: Readable.toWeb(request), duplex: 'half' } : {}),
    });
    const result = await contact(webRequest, request.socket.remoteAddress);
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(await result.text());
  }
  const handler = createSiteRequestHandler({ assetRoot: path.join(projectRoot, 'public'), pages, renderPage, contactRequest });
  const handle = (request, response) => { response.setHeader(FIXTURE_HEADER, '1'); void handler(request, response); };
  const server = key
    ? createHttpsServer({ key: await readFile(key), cert: await readFile(cert), minVersion: 'TLSv1.2' }, handle)
    : createServer(handle);
  server.headersTimeout = 15000;
  server.requestTimeout = 20000;
  server.listen(port, host);
  await once(server, 'listening');
  const hostname = host.includes(':') ? `[${host}]` : host;
  return {
    server, origin: `${protocol}//${hostname}:${server.address().port}`,
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const value = flag => { const index = process.argv.indexOf(flag); return index < 0 ? undefined : process.argv[index + 1]; };
  const fixture = await startAuditServer({
    port: Number(value('--port') || 4173), host: value('--host') || '127.0.0.1',
    key: value('--key'), cert: value('--cert'), contactEnabled: !process.argv.includes('--disable-contact'),
  });
  console.log(`Dipanda audit fixture: ${fixture.origin} (all contact deliveries simulated)`);
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => { void fixture.close().then(() => process.exit(0)); });
}
