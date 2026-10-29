import { validateContact, sendContact } from './contact.mjs';
import { securityHeaders, publicOrigin } from './security.mjs';
import { createMemoryLimiter, createDurableLimiter } from './contact-limits.mjs';

export const MAX_CONTACT_BYTES = 32768;
const memoryLimiter = createMemoryLimiter();

export function createContactHandler({ environment = process.env, send = sendContact, limit, local = false } = {}) {
  const limiter = limit || (local ? memoryLimiter : createDurableLimiter(environment));
  return async (request, address) => {
    const reply = (status, message, extra = {}) => new Response(JSON.stringify({ message }), {
      status, headers: { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
    });
    if (request.method !== 'POST') return reply(405, 'Método não permitido.', { Allow: 'POST' });
    const target = new URL(request.url);
    const expected = local ? target.origin : publicOrigin(environment.SITE_URL);
    // Disable real submissions on preview deployments, or until explicitly enabled.
    if (!expected || (!local && (environment.CONTACT_ENABLED !== 'true' || (environment.VERCEL_ENV && environment.VERCEL_ENV !== 'production')))) return reply(503, 'O formulário ainda não está disponível. Contacte-nos por e-mail.');
    if (target.origin !== expected || request.headers.get('origin') !== expected || request.headers.get('sec-fetch-site') === 'cross-site') return reply(403, 'Origem do pedido inválida.');
    const type = request.headers.get('content-type') || '';
    if (request.headers.has('content-encoding') && request.headers.get('content-encoding') !== 'identity') return reply(415, 'Conteúdo comprimido não suportado.');
    if (!/^(application\/json|application\/x-www-form-urlencoded)(?:\s*;\s*charset=utf-8)?$/i.test(type)) return reply(415, 'Tipo de conteúdo não suportado.');
    const declared = request.headers.get('content-length');
    if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_CONTACT_BYTES)) return reply(413, 'A mensagem é demasiado longa.');
    const quota = await limiter(address);
    if (quota.status !== 200) return reply(quota.status === 429 ? 429 : 503, quota.status === 429 ? 'Foram enviados vários pedidos. Aguarde antes de tentar novamente.' : 'O formulário está temporariamente indisponível.', quota.status === 429 ? { 'Retry-After': String(quota.retryAfter || 900) } : {});
    let body;
    try {
      const reader = request.body?.getReader();
      if (!reader) return reply(400, 'Pedido inválido.');
      let bytes = 0;
      const chunks = [];
      const deadline = AbortSignal.timeout(10000);
      const timedOut = new Promise((_, reject) => { deadline.addEventListener('abort', () => { void reader.cancel().catch(() => {}); reject(new Error('Timeout')); }, { once: true }); });
      while (true) {
        const { done, value } = await Promise.race([reader.read(), timedOut]);
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_CONTACT_BYTES) { await reader.cancel(); return reply(413, 'A mensagem é demasiado longa.'); }
        chunks.push(value);
      }
      const text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
      if (type.toLowerCase().startsWith('application/json')) body = JSON.parse(text);
      else {
        const fields = new URLSearchParams(text);
        if (new Set(fields.keys()).size !== [...fields.keys()].length) return reply(400, 'Pedido inválido.');
        body = Object.fromEntries(fields);
      }
    } catch { return reply(400, 'Pedido inválido.'); }
    const result = validateContact(body);
    if (result.error) return reply(400, result.error);
    const sent = await send(result.value, { environment });
    return reply(sent.status, sent.message);
  };
}
