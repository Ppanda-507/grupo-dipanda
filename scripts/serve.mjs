import { createSiteRequestHandler } from './site-request-handler.mjs';
import { createServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pages, renderPage } from '../src/pages.mjs';
import { assertProductionReady } from './production-readiness.mjs';
import { Readable } from 'node:stream';
import { createContactHandler } from './contact-handler.mjs';
import { publicOrigin } from './security.mjs';

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

const handleContact = createContactHandler({ local: !production });
async function contactRequest(request, response) {
  const origin = production ? publicOrigin(process.env.SITE_URL) : protocol + '//' + request.headers.host;
  if (!origin) { response.writeHead(503); response.end(); return; }
  const webRequest = new Request(origin + '/api/contact', { method: request.method, headers: request.headers, body: request.method === 'POST' ? Readable.toWeb(request) : undefined, duplex: 'half' });
  const result = await handleContact(webRequest, request.socket.remoteAddress);
  response.writeHead(result.status, Object.fromEntries(result.headers));
  response.end(await result.text());
}
const handler = createSiteRequestHandler({ assetRoot, production, pages, renderPage, contactRequest, siteUrl: process.env.SITE_URL });

const server = tlsEnabled
  ? createHttpsServer({ key: await readFile(process.env.TLS_KEY), cert: await readFile(process.env.TLS_CERT), minVersion: 'TLSv1.2' }, handler)
  : createServer(handler);
server.headersTimeout = 15000;
server.requestTimeout = 20000;
server.keepAliveTimeout = 5000;
server.maxRequestsPerSocket = 100;
server.listen(port, host, () => console.log(`Dipanda: ${protocol}//${host}:${port}${production ? ' (production)' : ''}`));
